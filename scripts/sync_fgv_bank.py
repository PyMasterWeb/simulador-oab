#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen, urlretrieve

FGV_HOME = "https://oab.fgv.br/home.aspx"


class HtmlLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._in_anchor = False
        self._anchor_href: str | None = None
        self._anchor_text: list[str] = []
        self.links: list[tuple[str, str]] = []
        self.option_values: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = dict(attrs)
        if tag == "a":
            href = attrs_map.get("href")
            if href:
                self._in_anchor = True
                self._anchor_href = href
                self._anchor_text = []
        elif tag == "option":
            value = attrs_map.get("value")
            if value:
                self.option_values.append(value)

    def handle_data(self, data: str) -> None:
        if self._in_anchor:
            self._anchor_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._in_anchor and self._anchor_href:
            text = " ".join("".join(self._anchor_text).split())
            self.links.append((self._anchor_href, text))
            self._in_anchor = False
            self._anchor_href = None
            self._anchor_text = []


def fetch_html(url: str) -> str:
    return urlopen(url, timeout=30).read().decode("utf-8", errors="ignore")


def normalize(text: str) -> str:
    return " ".join(text.lower().split())


def extract_exam_number(text: str) -> int | None:
    match = re.search(r"\b([0-9]{2})\s*(?:º|o)?\s*exame\b", text, flags=re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def discover_exam_pages(home_html: str) -> list[tuple[int, str]]:
    parser = HtmlLinkParser()
    parser.feed(home_html)

    exam_pages: list[tuple[int, str]] = []
    seen: set[int] = set()
    for href, text in parser.links:
        if "home.aspx?key=" not in href.lower():
            continue
        exam_number = extract_exam_number(text)
        if not exam_number or exam_number in seen:
            continue
        seen.add(exam_number)
        exam_pages.append((exam_number, urljoin(FGV_HOME, href)))

    return sorted(exam_pages, key=lambda item: item[0])


def discover_novosec_url(exam_page_html: str, exam_page_url: str) -> str | None:
    parser = HtmlLinkParser()
    parser.feed(exam_page_html)

    candidates = []
    candidates.extend(value for value in parser.option_values if "novosec.aspx" in value.lower())
    candidates.extend(href for href, _ in parser.links if "novosec.aspx" in href.lower())
    candidates.extend(re.findall(r"NovoSec\.aspx\?[^\s\"'<>]+", exam_page_html, flags=re.IGNORECASE))

    for candidate in candidates:
        if not candidate:
            continue
        return urljoin(exam_page_url, candidate)
    return None


def pick_document_links(section_html: str, section_url: str) -> tuple[str | None, str | None]:
    parser = HtmlLinkParser()
    parser.feed(section_html)

    proof_url = None
    answer_key_url = None
    for href, text in parser.links:
        t = normalize(text)
        full = urljoin(section_url, href)
        if proof_url is None and ("caderno de prova - tipo 1" in t or "prova tipo 1" in t):
            proof_url = full
        if answer_key_url is None and ("gabaritos definitivos" in t or "gabarito definitivo" in t):
            answer_key_url = full

    return proof_url, answer_key_url


def download_if_present(url: str | None, target: Path) -> bool:
    if not url:
        return False
    try:
        urlretrieve(url, target)
        return True
    except Exception as exc:
        print(f"Falha no download de {url}: {exc}")
        return False


def rebuild_local_catalog() -> None:
    catalog_path = Path("data/oab_catalog.json")
    if catalog_path.exists():
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    else:
        catalog = {"resources": [], "objectiveAnswerKeys": {}, "exams": []}

    non_local_resources = [item for item in catalog.get("resources", []) if item.get("source") != "local"]
    local_resources = []

    proof_exams = []
    for pdf in sorted(Path(".").glob("P*OAB.pdf")):
        match = re.search(r"P(\d+)OAB", pdf.name)
        if not match:
            continue
        exam = int(match.group(1))
        proof_exams.append(exam)
        local_resources.append(
            {
                "id": f"local-p{exam}",
                "title": f"{exam}º Exame - Prova Objetiva (Tipo 1)",
                "exam": exam,
                "phase": "1fase",
                "kind": "prova_objetiva",
                "url": pdf.name,
                "source": "local",
            }
        )

    answer_exams = []
    for pdf in sorted(Path(".").glob("G*OAB.pdf")):
        match = re.search(r"G(\d+)OAB", pdf.name)
        if not match:
            continue
        exam = int(match.group(1))
        answer_exams.append(exam)
        local_resources.append(
            {
                "id": f"local-g{exam}",
                "title": f"{exam}º Exame - Gabarito",
                "exam": exam,
                "phase": "1fase",
                "kind": "gabarito",
                "url": pdf.name,
                "source": "local",
            }
        )

    keys_path = Path("data/local_answer_keys.json")
    if keys_path.exists():
        objective_keys = json.loads(keys_path.read_text(encoding="utf-8"))
    else:
        objective_keys = catalog.get("objectiveAnswerKeys", {})

    catalog["updatedAt"] = dt.date.today().isoformat()
    catalog["resources"] = local_resources + non_local_resources
    catalog["exams"] = sorted(set(proof_exams + answer_exams))
    catalog["objectiveAnswerKeys"] = objective_keys

    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Catálogo atualizado em {catalog_path}.")


def rebuild_structured_bank() -> None:
    subprocess.run(["./scripts/build_objective_questions_bank.py"], check=True)
    subprocess.run(
        ["./scripts/build_local_answer_keys.py", "--output", "data/local_answer_keys.json"],
        check=True,
    )
    rebuild_local_catalog()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extrai prova tipo 1 e gabarito definitivo do site oab.fgv.br e reconstrói banco estruturado."
    )
    parser.add_argument("--from-exam", type=int, default=39, help="Exame inicial (inclusive).")
    parser.add_argument("--to-exam", type=int, default=99, help="Exame final (inclusive).")
    parser.add_argument("--no-rebuild", action="store_true", help="Não reconstruir JSONs após download.")
    args = parser.parse_args()

    home_html = fetch_html(FGV_HOME)
    exam_pages = discover_exam_pages(home_html)
    selected = [(exam, url) for exam, url in exam_pages if args.from_exam <= exam <= args.to_exam]

    print(f"Exames descobertos no range: {[exam for exam, _ in selected]}")
    for exam, exam_url in selected:
        try:
            exam_html = fetch_html(exam_url)
            section_url = discover_novosec_url(exam_html, exam_url)
            if not section_url:
                print(f"[{exam}] página de seção não encontrada.")
                continue

            section_html = fetch_html(section_url)
            proof_url, answer_key_url = pick_document_links(section_html, section_url)

            p_target = Path(f"P{exam}OAB.pdf")
            g_target = Path(f"G{exam}OAB.pdf")
            p_ok = download_if_present(proof_url, p_target)
            g_ok = download_if_present(answer_key_url, g_target)

            print(f"[{exam}] prova={'ok' if p_ok else 'falha'} gabarito={'ok' if g_ok else 'falha'}")
        except Exception as exc:
            print(f"[{exam}] erro: {exc}")

    if not args.no_rebuild:
        rebuild_structured_bank()


if __name__ == "__main__":
    main()
