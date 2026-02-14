#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen, urlretrieve

BASE_URL = "https://examedeordem.oab.org.br/EditaisProvas"


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._current_href = None
        self._current_text = []
        self.links: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        attr_map = dict(attrs)
        href = attr_map.get("href")
        if href:
            self._current_href = href
            self._current_text = []

    def handle_data(self, data: str) -> None:
        if self._current_href is not None:
            self._current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != "a" or self._current_href is None:
            return
        text = " ".join("".join(self._current_text).split())
        if text:
            self.links.append((self._current_href, text))
        self._current_href = None
        self._current_text = []


def classify_phase(text: str) -> str:
    low = text.lower()
    if "edital" in low:
        return "edital"
    if "prático" in low or "pratico" in low or "peça" in low or "discurs" in low:
        return "2fase"
    return "1fase"


def classify_kind(text: str) -> str:
    low = text.lower()
    if "gabarito" in low:
        return "gabarito"
    if "edital" in low and "complement" in low:
        return "edital_complementar"
    if "edital" in low:
        return "edital"
    if "padr" in low and "resposta" in low:
        return "padrao_resposta"
    if "prático" in low or "pratico" in low:
        return "prova_pratico_profissional"
    if "objetiv" in low:
        return "prova_objetiva"
    return "material"


def fetch_catalog(numero_exame: int) -> dict:
    url = f"{BASE_URL}?NumeroExame={numero_exame}"
    html = urlopen(url).read().decode("utf-8", errors="ignore")

    parser = LinkParser()
    parser.feed(html)

    exam_match = re.search(r"(\d+)\s*º\s*EXAME", html, flags=re.IGNORECASE)
    exam_number = int(exam_match.group(1)) if exam_match else None

    resources = []
    seen = set()
    for href, text in parser.links:
        full = urljoin("https://examedeordem.oab.org.br/", href)
        if "/arquivo/" not in full:
            continue
        if full in seen:
            continue
        seen.add(full)
        resources.append(
            {
                "id": f"portal-{numero_exame}-{len(resources) + 1}",
                "title": text,
                "exam": exam_number,
                "phase": classify_phase(text),
                "kind": classify_kind(text),
                "url": full,
                "source": "portal-oab",
            }
        )

    return {
        "sourceUrl": url,
        "updatedAt": __import__("datetime").date.today().isoformat(),
        "exam": exam_number,
        "resources": resources,
    }


def maybe_download(resources: list[dict], download_dir: Path) -> None:
    download_dir.mkdir(parents=True, exist_ok=True)
    for item in resources:
        url = item["url"]
        filename = re.sub(r"[^a-zA-Z0-9_.-]+", "_", item["title"])[:90] or "arquivo"
        target = download_dir / f"{filename}.pdf"
        try:
            urlretrieve(url, target)
        except Exception as exc:
            print(f"Falha no download de {url}: {exc}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sincroniza materiais do portal da OAB por numero de exame.")
    parser.add_argument("--numero-exame", type=int, default=16773)
    parser.add_argument("--output", default="data/portal_catalog.json")
    parser.add_argument("--download-dir", default=None)
    args = parser.parse_args()

    catalog = fetch_catalog(args.numero_exame)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Catálogo salvo em {output} com {len(catalog['resources'])} itens.")

    if args.download_dir:
        maybe_download(catalog["resources"], Path(args.download_dir))
        print(f"Downloads concluídos em {args.download_dir}.")


if __name__ == "__main__":
    main()
