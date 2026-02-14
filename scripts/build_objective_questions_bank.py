#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

NUM_RE = re.compile(r"^([1-9]|[1-7][0-9]|80)$")
OPTION_RE = re.compile(r"(?:(?:\(([ABCD])\))|(?:\b([ABCD])\)))\s*")
BLOCKLIST_TERMS = (
    "na sua avaliação, o grau de dificuldade desta prova",
    "questionário de percepção",
)


def run_bbox(pdf_path: Path, xml_out: Path) -> None:
    subprocess.run(["pdftotext", "-bbox-layout", str(pdf_path), str(xml_out)], check=True, stdout=subprocess.DEVNULL)


def collect_column_lines(xml_path: Path) -> list[tuple[int, int, list[str]]]:
    root = ET.parse(xml_path).getroot()
    pages = root.findall(".//{*}page")
    columns: list[tuple[int, int, list[str]]] = []

    for page_index, page in enumerate(pages, start=1):
        col_lines: dict[int, defaultdict[float, list[tuple[float, str]]]] = {
            0: defaultdict(list),
            1: defaultdict(list),
        }

        for word in page.findall(".//{*}word"):
            token = (word.text or "").strip()
            if not token:
                continue

            x = float(word.attrib["xMin"])
            y = float(word.attrib["yMin"])

            if y < 90 or y > 790:
                continue

            col = 0 if x < 297 else 1
            line_y = round(y * 2) / 2
            col_lines[col][line_y].append((x, token))

        for col in (0, 1):
            ordered: list[str] = []
            for y in sorted(col_lines[col]):
                line = " ".join(token for _, token in sorted(col_lines[col][y], key=lambda item: item[0]))
                line = " ".join(line.split())
                if line:
                    ordered.append(line)
            columns.append((page_index, col, ordered))

    return columns


def parse_question_block(lines: list[str]) -> dict | None:
    raw = "\n".join(lines)
    option_markers = list(OPTION_RE.finditer(raw))
    if len(option_markers) < 4:
        return None

    stem = " ".join(raw[: option_markers[0].start()].split())
    if len(stem) < 40:
        return None
    lower_stem = stem.lower()
    if any(term in lower_stem for term in BLOCKLIST_TERMS):
        return None
    options = {}

    for index, marker in enumerate(option_markers):
        letter = marker.group(1) or marker.group(2)
        start = marker.end()
        end = option_markers[index + 1].start() if index + 1 < len(option_markers) else len(raw)
        options[letter] = " ".join(raw[start:end].split())

    if any(letter not in options for letter in "ABCD"):
        return None

    return {
        "text": stem,
        "options": {letter: options[letter] for letter in "ABCD"},
    }


def extract_questions(pdf_path: Path) -> dict[int, dict]:
    xml_tmp = Path("/tmp") / f"{pdf_path.stem}.xml"
    run_bbox(pdf_path, xml_tmp)

    question_map: dict[int, dict] = {}

    for _, _, lines in collect_column_lines(xml_tmp):
        markers = [(idx, int(NUM_RE.fullmatch(line).group(1))) for idx, line in enumerate(lines) if NUM_RE.fullmatch(line)]
        if not markers:
            continue

        first_line_index, first_number = markers[0]
        prefix = parse_question_block(lines[:first_line_index])
        if prefix and 1 <= first_number - 1 <= 80 and first_number - 1 not in question_map:
            question_map[first_number - 1] = prefix

        for marker_index, (line_index, number) in enumerate(markers):
            next_line_index = markers[marker_index + 1][0] if marker_index + 1 < len(markers) else len(lines)
            block = parse_question_block(lines[line_index + 1 : next_line_index])
            if block and 1 <= number <= 80 and number not in question_map:
                question_map[number] = block

    return question_map


def build_bank() -> dict:
    bank = {}
    for pdf_path in sorted(Path(".").glob("P*OAB.pdf")):
        match = re.search(r"P(\d+)OAB", pdf_path.name)
        if not match:
            continue

        exam = match.group(1)
        extracted = extract_questions(pdf_path)

        entries = []
        for number in range(1, 81):
            if number in extracted:
                item = extracted[number]
                entries.append(
                    {
                        "number": number,
                        "text": item["text"],
                        "options": item["options"],
                        "source": "parsed",
                    }
                )
            else:
                entries.append(
                    {
                        "number": number,
                        "text": f"Questão {number} do {exam}º Exame. Use o caderno oficial para leitura integral.",
                        "options": {
                            "A": "Alternativa A",
                            "B": "Alternativa B",
                            "C": "Alternativa C",
                            "D": "Alternativa D",
                        },
                        "source": "fallback",
                    }
                )

        parsed_count = sum(1 for item in entries if item["source"] == "parsed")
        print(f"{pdf_path.name}: {parsed_count}/80 questões parseadas.")
        bank[exam] = entries

    return bank


def main() -> None:
    output_path = Path("data/objective_questions.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "updatedAt": __import__("datetime").date.today().isoformat(),
        "exams": build_bank(),
    }
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Arquivo salvo em {output_path}.")


if __name__ == "__main__":
    main()
