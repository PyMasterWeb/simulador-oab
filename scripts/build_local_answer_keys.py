#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

PAIR_RE = re.compile(r"\b([1-9]|[1-7][0-9]|80)\s*\n\s*([ABCD*])\b")
NUMBER_TOKEN_RE = re.compile(r"\b([1-9]|[1-7][0-9]|80)\b")
ANSWER_TOKEN_RE = re.compile(r"([ABCD]|\*)")


def extract_by_pair_lines(pdf_path: Path) -> list[str] | None:
    text = subprocess.check_output(["pdftotext", str(pdf_path), "-"], text=True, errors="ignore")
    pairs = PAIR_RE.findall(text)
    first_80 = pairs[:80]

    if len(first_80) != 80:
        return None

    mapping = {int(number): answer for number, answer in first_80}
    if sorted(mapping) != list(range(1, 81)):
        return None

    return [mapping[i] for i in range(1, 81)]


def extract_by_layout_rows(pdf_path: Path) -> list[str] | None:
    text = subprocess.check_output(["pdftotext", "-layout", str(pdf_path), "-"], text=True, errors="ignore")
    lines = [" ".join(line.split()) for line in text.splitlines() if line.strip()]

    answers_by_number: dict[int, str] = {}
    for index in range(len(lines) - 1):
        numbers = [int(token) for token in NUMBER_TOKEN_RE.findall(lines[index])]
        answers = ANSWER_TOKEN_RE.findall(lines[index + 1])

        # Typical gabarito row pattern: 20 numbers followed by 20 answers.
        if len(numbers) >= 10 and len(numbers) == len(answers):
            for number, answer in zip(numbers, answers):
                if 1 <= number <= 80 and number not in answers_by_number:
                    answers_by_number[number] = answer
            if len(answers_by_number) == 80:
                break

    if len(answers_by_number) != 80:
        return None
    return [answers_by_number[i] for i in range(1, 81)]


def extract_first_type_answers(pdf_path: Path) -> list[str] | None:
    return extract_by_pair_lines(pdf_path) or extract_by_layout_rows(pdf_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extrai gabaritos locais (tipo 1) de arquivos G*.pdf")
    parser.add_argument("--output", default="data/local_answer_keys.json")
    args = parser.parse_args()

    result = {}
    for pdf in sorted(Path(".").glob("G*OAB.pdf")):
        match = re.search(r"G(\d+)OAB", pdf.name)
        if not match:
            continue

        exam = match.group(1)
        answers = extract_first_type_answers(pdf)
        if answers:
            result[exam] = answers
        else:
            print(f"Aviso: nao foi possivel extrair 80 respostas de {pdf}.")

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Arquivo salvo em {out_path} com {len(result)} exames.")


if __name__ == "__main__":
    main()
