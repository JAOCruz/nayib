#!/usr/bin/env python3
"""
parse_solares_pdf.py — Convert Nayib's monthly solares PDF to JSON

Usage:
  python3 parse_solares_pdf.py <input.pdf> [--output data/properties.json] [--preview]

Options:
  --output   Path to properties.json to update (default: ../data/properties.json)
  --preview  Just print the parsed data, don't write anything
  --replace  Replace all solares in the JSON (default: merge/append new ones)
"""

import sys
import json
import re
import argparse
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("ERROR: Run: pip3 install pdfplumber --break-system-packages")
    sys.exit(1)

# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_num(val):
    """'$2,537.85' or '1,029.00' → float. '-' → None."""
    if not val or val.strip() == '-':
        return None
    return float(val.replace('$', '').replace(',', '').strip())


# ── Core row regex ────────────────────────────────────────────────────────────
# Pattern: <location> <metraje|-> <frente|-> <precio_m2|-> <precio_total|-> <estatus>
# Numbers use , as thousand separator and . as decimal.
NUM = r'[\d,]+\.?\d*'
STATUS = r'(?:CON T[IÍ]TULO|A CONSULTAR|ACTUALIZACI[OÓ]N DE T[IÍ]TULO)'

ROW_RE = re.compile(
    r'^(.+?)\s+'                           # location (non-greedy)
    r'(-|' + NUM + r')\s+'                 # metraje
    r'(-|' + NUM + r')\s+'                 # frente
    r'(\$' + NUM + r'|A CONSULTAR|-)\s+'   # precio m2
    r'(\$' + NUM + r'|A CONSULTAR|-)\s+'   # precio total
    r'(' + STATUS + r')'                   # estatus
)


def parse_pdf(pdf_path):
    """Extract and parse the solares table. Returns list of dicts."""
    solares = []
    skipped = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            for raw_line in text.split('\n'):
                line = raw_line.strip()
                m = ROW_RE.match(line)
                if not m:
                    # Track lines that look like data but didn't match (split locations)
                    if re.search(STATUS, line) and not any(
                        kw in line.upper() for kw in ['LOCALIZACIÓN', 'METRAJE', 'CONTACTAR', 'TELÉFONO', 'DÓLAR', 'TASA', 'SOLARES']
                    ):
                        skipped.append(line)
                    continue

                location, metraje, frente, precio_m2, precio_total, estatus = m.groups()
                location = location.strip()

                # Normalize estatus
                eu = estatus.upper()
                if 'ACTUALIZACI' in eu:
                    estatus_norm = 'ACTUALIZACIÓN DE TITULO'
                elif 'CON T' in eu:   # "CON TITULO" — avoid false match on "CONSULTAR"
                    estatus_norm = 'CON TITULO'
                else:
                    estatus_norm = 'A CONSULTAR'

                solares.append({
                    'ubicacion': location,
                    'area_m2': parse_num(metraje),
                    'frente_m': parse_num(frente),
                    'precio_usd_m2': parse_num(precio_m2),
                    'precio_total_usd': parse_num(precio_total),
                    'estatus_legal': estatus_norm,
                })

    if skipped:
        print(f"\n⚠️  {len(skipped)} línea(s) con localización en múltiples renglones (revisar manualmente):")
        for s in skipped:
            print(f"   → {s}")

    return solares


def group_by_location(solares):
    """Match the existing JSON schema: [{ubicacion, solares:[{area_m2,...}]}]"""
    grouped = {}
    for s in solares:
        loc = s['ubicacion']
        if loc not in grouped:
            grouped[loc] = []
        grouped[loc].append({
            'area_m2': s['area_m2'],
            'frente_m': s['frente_m'],
            'precio_usd_m2': s['precio_usd_m2'],
            'precio_total_usd': s['precio_total_usd'],
            'estatus_legal': s['estatus_legal'],
        })
    return [{'ubicacion': loc, 'solares': entries} for loc, entries in grouped.items()]


def update_properties_json(json_path, new_solares_data, replace=False):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if replace:
        data['categories']['solares']['data'] = new_solares_data
        print(f"✅ Replaced all solares with {len(new_solares_data)} locations.")
    else:
        existing_list = data['categories']['solares']['data']
        # Case-insensitive index: UPPER → list index
        existing_map = {e['ubicacion'].upper().strip(): i for i, e in enumerate(existing_list)}
        added, updated = 0, 0
        for entry in new_solares_data:
            key = entry['ubicacion'].upper().strip()
            if key in existing_map:
                idx = existing_map[key]
                orig_name = existing_list[idx]['ubicacion']  # preserve original casing
                existing_list[idx] = {**entry, 'ubicacion': orig_name}
                updated += 1
            else:
                existing_list.append(entry)
                added += 1
        data['categories']['solares']['data'] = existing_list
        print(f"✅ Merged: {added} new, {updated} updated.")

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved: {json_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('pdf')
    parser.add_argument('--output', default=None)
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--replace', action='store_true')
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"ERROR: {pdf_path} not found"); sys.exit(1)

    print(f"📄 Parsing: {pdf_path.name}")
    solares = parse_pdf(pdf_path)
    grouped = group_by_location(solares)

    print(f"\n📊 {len(solares)} solares in {len(grouped)} locations:\n")
    for entry in grouped:
        for s in entry['solares']:
            area  = f"{s['area_m2']:>14,.2f} m²" if s['area_m2'] else '              -'
            total = f"${s['precio_total_usd']:>16,.2f}" if s['precio_total_usd'] else '    A CONSULTAR'
            print(f"  📍 {entry['ubicacion']:<50} {area}  {total}  [{s['estatus_legal']}]")

    if args.preview:
        print("\n[Preview only — nothing written]")
        return

    json_path = Path(args.output) if args.output else Path(__file__).parent.parent / 'data' / 'properties.json'
    if not json_path.exists():
        print(f"ERROR: {json_path} not found"); sys.exit(1)

    update_properties_json(json_path, grouped, replace=args.replace)


if __name__ == '__main__':
    main()
