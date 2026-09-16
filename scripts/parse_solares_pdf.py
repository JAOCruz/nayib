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
    """'$2,537.85' or '1,029.00' → float. '-' / 'A CONSULTAR' / '200+' → None."""
    if not val:
        return None
    val = val.strip()
    if val in ('-', 'A CONSULTAR'):
        return None
    # Strip trailing '+' and other non-numeric markers but keep digits/.,$
    val = val.replace('$', '').replace(',', '').strip()
    # Handle cases like '200+' (just take numeric part)
    val = re.sub(r'^(\d+(?:\.\d+)?)[^\d]*$', r'\1', val)
    try:
        return float(val)
    except ValueError:
        return None


def parse_consultar_or_num(val):
    """Like parse_num but returns the string 'CONSULTAR' for A CONSULTAR."""
    if not val:
        return None
    val = val.strip()
    if val in ('-', ''):
        return None
    if val.upper() == 'A CONSULTAR':
        return 'CONSULTAR'
    val = val.replace('$', '').replace(',', '').strip()
    val = re.sub(r'^(\d+(?:\.\d+)?)[^\d]*$', r'\1', val)
    try:
        return float(val)
    except ValueError:
        return None


def normalize_status(estatus):
    """Normalize legal status to the canonical form used in properties.json."""
    if not estatus:
        return 'CON TÍTULO'
    eu = estatus.upper().strip()
    if 'ACTUALIZACI' in eu:
        return 'ACTUALIZACIÓN DE TÍTULO'
    if 'CON T' in eu and 'CONSULTAR' not in eu:
        return 'CON TÍTULO'
    return 'CON TÍTULO'  # Default; 'A CONSULTAR' is a price marker, not a legal status


def parse_pdf(pdf_path):
    """Extract and parse the solares table. Returns list of dicts."""
    solares = []
    skipped = []
    HEADER_KEYWORDS = {'LOCALIZACION', 'METRAJE', 'FRENTE', 'PRECIO', 'ESTATUS', 'LEGAL'}

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Prefer table extraction: it correctly joins multi-line locations.
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    for row in table:
                        if not row or not any(cell and str(cell).strip() for cell in row):
                            continue
                        # Clean newlines/spaces from each cell
                        cells = [re.sub(r'\s+', ' ', (cell or '').strip()) for cell in row]
                        # Header row looks like ['LOCALIZACION', 'METRAJE (M2)', ...]
                        first = cells[0].upper()
                        if 'LOCALIZACION' in first or 'METRAJE' in first:
                            continue
                        # Filter out footer rows
                        if any(kw in ' '.join(cells).upper() for kw in [
                            'DÓLAR', 'PESOS DOMINICANOS', 'CAMBIO DEL DÓLAR',
                            'CONTACTAR', 'TELÉFONO', 'SOLARES AGOSTO'
                        ]):
                            continue
                        if len(cells) < 6:
                            continue
                        location, metraje, frente, precio_m2, precio_total, estatus = cells[:6]
                        if not location:
                            continue
                        solares.append({
                            'ubicacion': location,
                            'area_m2': parse_consultar_or_num(metraje),
                            'frente_m': parse_num(frente),
                            'fondo_m': None,
                            'precio_usd_m2': parse_consultar_or_num(precio_m2),
                            'precio_total_usd': parse_num(precio_total),
                            'estatus_legal': normalize_status(estatus),
                        })
                continue

            # Fallback to line-based parsing for non-table PDFs
            text = page.extract_text()
            if not text:
                continue
            for raw_line in text.split('\n'):
                line = raw_line.strip()
                # Skip header/footer rows
                if any(kw in line.upper() for kw in [
                    'LOCALIZACION', 'DÓLAR', 'PESOS DOMINICANOS', 'CAMBIO DEL DÓLAR',
                    'CONTACTAR', 'TELÉFONO', 'SOLARES AGOSTO'
                ]):
                    continue
                if not re.search(r'CON T[IÍ]TULO|ACTUALIZACI[OÓ]N', line):
                    continue
                skipped.append(line)

    if skipped:
        print(f"\n⚠️  {len(skipped)} línea(s) no pudieron parsearse (revisar manualmente):")
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
            'fondo_m': s.get('fondo_m'),
            'precio_usd_m2': s['precio_usd_m2'],
            'precio_total_usd': s['precio_total_usd'],
            'estatus_legal': s['estatus_legal'],
        })
    return [{'ubicacion': loc, 'solares': entries} for loc, entries in grouped.items()]


def update_properties_json(json_path, new_solares_data, replace=False, skip_duplicates=False):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if replace:
        data['categories']['solares']['data'] = new_solares_data
        print(f"✅ Replaced all solares with {len(new_solares_data)} locations.")
    else:
        existing_list = data['categories']['solares']['data']
        # Case-insensitive index: UPPER → list index
        existing_map = {e['ubicacion'].upper().strip(): i for i, e in enumerate(existing_list)}
        added, updated, skipped = 0, 0, 0
        for entry in new_solares_data:
            key = entry['ubicacion'].upper().strip()
            if key in existing_map:
                if skip_duplicates:
                    skipped += 1
                    continue
                idx = existing_map[key]
                orig_name = existing_list[idx]['ubicacion']  # preserve original casing
                existing_list[idx] = {**entry, 'ubicacion': orig_name}
                updated += 1
            else:
                existing_list.append(entry)
                added += 1
        data['categories']['solares']['data'] = existing_list
        if skip_duplicates:
            print(f"✅ Merged (skip duplicates): {added} new, {skipped} duplicates skipped.")
        else:
            print(f"✅ Merged: {added} new, {updated} updated.")

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved: {json_path}")
    return data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('pdf')
    parser.add_argument('--output', default=None)
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--replace', action='store_true')
    parser.add_argument('--skip-duplicates', action='store_true',
                        help='Skip locations that already exist in the JSON instead of replacing them')
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
            area_raw = s['area_m2']
            if isinstance(area_raw, str):
                area = f'{area_raw:>14}'
            elif area_raw is None:
                area = '              -'
            else:
                area = f"{area_raw:>14,.2f} m²"
            price_raw = s['precio_usd_m2']
            if isinstance(price_raw, str):
                price = f'${price_raw:>15}'
            elif price_raw is None:
                price = '    A CONSULTAR'
            else:
                price = f"${price_raw:>16,.2f}"
            print(f"  📍 {entry['ubicacion']:<50} {area}  {price}  [{s['estatus_legal']}]")

    if args.preview:
        print("\n[Preview only — nothing written]")
        return

    json_path = Path(args.output) if args.output else Path(__file__).parent.parent / 'data' / 'properties.json'
    if not json_path.exists():
        print(f"ERROR: {json_path} not found"); sys.exit(1)

    update_properties_json(json_path, grouped, replace=args.replace, skip_duplicates=args.skip_duplicates)


if __name__ == '__main__':
    main()
