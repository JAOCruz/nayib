// Lectura de la hoja de terrenos (Excel/CSV) al formato de categories.solares.
// Reconoce las columnas por nombre (el formato del Excel mensual "Solares <MES>") e ignora el pie del archivo.
(function (root) {
  const TEMPLATE_HEADERS = [
    'LOCALIZACION',
    'METRAJE (M2)',
    'FRENTE (M)',
    'FONDO (M)',
    'PRECIO POR M2 ($USD)',
    'PRECIO TOTAL ($USD)',
    'ESTATUS LEGAL',
  ];

  function fold(s) {
    return String(s ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function columnFor(header) {
    const h = fold(header);
    if (!h) return null;
    if (/localizacion|ubicacion|sector|zona|direccion/.test(h)) return 'ubicacion';
    if (/precio|valor|costo/.test(h)) return /total/.test(h) ? 'precio_total_usd' : /m2|m²|metro/.test(h) ? 'precio_usd_m2' : 'precio_total_usd';
    if (/metraje|area|superficie|tamano/.test(h)) return 'area_m2';
    if (/frente/.test(h)) return 'frente_m';
    if (/fondo/.test(h)) return 'fondo_m';
    if (/estatus|status|legal|titulo/.test(h)) return 'estatus_legal';
    return null;
  }

  function findHeader(rows) {
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const map = {};
      (rows[i] || []).forEach((cell, col) => {
        const key = columnFor(cell);
        if (key && !(key in map)) map[key] = col;
      });
      if ('ubicacion' in map && ('area_m2' in map || 'precio_usd_m2' in map || 'precio_total_usd' in map)) return { index: i, map };
    }
    return null;
  }

  const isEmpty = (v) => v === null || v === undefined || (typeof v === 'string' && /^\s*[-–—]?\s*$/.test(v));
  const isConsultar = (v) => typeof v === 'string' && /consultar/i.test(v);

  // "1,250.5" / "1.250,5" / "US$ 1,000" → número; devuelve null si no es un número
  function toNumber(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v !== 'string') return null;
    let s = v.replace(/[^\d.,-]/g, '');
    if (!/\d/.test(s)) return null;
    if (/,\d{3}(\.|$)/.test(s) || (s.includes(',') && s.includes('.') && s.lastIndexOf('.') > s.lastIndexOf(','))) s = s.replace(/,/g, '');
    else if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  const round2 = (n) => Math.round(n * 100) / 100;

  // Número si se puede, texto corto si no (ej. "200+", "A CONSULTAR"), null si está vacío
  function measure(v) {
    if (isEmpty(v)) return null;
    if (isConsultar(v)) return 'CONSULTAR';
    if (typeof v === 'number') return round2(v);
    const n = toNumber(v);
    return n !== null && /^[\s\d.,]+$/.test(v) ? round2(n) : String(v).trim().toUpperCase();
  }

  function normalizeStatus(v) {
    const s = String(v ?? '').trim();
    if (!s) return 'CON TÍTULO';
    if (fold(s) === 'con titulo') return 'CON TÍTULO';
    if (isConsultar(s)) return 'A CONSULTAR';
    return s.toUpperCase().replace(/TITULO/g, 'TÍTULO');
  }

  function parseRows(rows) {
    const header = findHeader(rows);
    if (!header) {
      return { lots: [], errors: ['No encontré la fila de títulos. La hoja debe tener columnas como LOCALIZACION, METRAJE (M2) y PRECIO POR M2 ($USD).'] };
    }
    const { index, map } = header;
    const get = (row, key) => (key in map ? row[map[key]] : undefined);
    const lots = [];
    const errors = [];

    for (let i = index + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const ubicacion = String(get(row, 'ubicacion') ?? '').replace(/\s+/g, ' ').trim();
      const rawPrice = get(row, 'precio_usd_m2');
      const rawTotal = get(row, 'precio_total_usd');
      const rawStatus = get(row, 'estatus_legal');
      const rawArea = get(row, 'area_m2');
      if (!ubicacion) continue;
      // El pie del Excel (tasa del dólar, contacto) no trae precio ni estatus
      if (isEmpty(rawPrice) && isEmpty(rawTotal) && isEmpty(rawStatus)) continue;

      const area = measure(rawArea);
      const total = isConsultar(rawTotal) ? null : toNumber(rawTotal);
      let perM2 = isConsultar(rawPrice) ? null : toNumber(rawPrice);
      if (perM2 === null && total !== null && typeof area === 'number' && area > 0) perM2 = total / area;

      if (!isEmpty(rawPrice) && !isConsultar(rawPrice) && toNumber(rawPrice) === null) {
        errors.push(`Fila ${i + 1} (${ubicacion}): no entendí el precio por m² "${rawPrice}"; quedó como "A consultar".`);
      }

      const lot = {
        ubicacion,
        area_m2: area,
        frente_m: measure(get(row, 'frente_m')),
        fondo_m: measure(get(row, 'fondo_m')),
        precio_usd_m2: perM2 === null ? 'CONSULTAR' : round2(perM2),
        estatus_legal: normalizeStatus(rawStatus),
        row: i + 1,
      };
      if (total !== null) lot.precio_total_usd = round2(total);
      lots.push(lot);
    }
    if (!lots.length) errors.push('La hoja no tiene filas de terrenos debajo de los títulos.');
    return { lots, errors };
  }

  // Clave para detectar terrenos repetidos (misma ubicación, metraje y precio por m²)
  function lotKey(ubicacion, lot) {
    const price = typeof lot.precio_usd_m2 === 'number' ? Math.round(lot.precio_usd_m2) : 'c';
    const area = typeof lot.area_m2 === 'number' ? Math.round(lot.area_m2) : /consultar/i.test(lot.area_m2 ?? '') ? 'c' : fold(lot.area_m2);
    return `${fold(ubicacion)}|${area}|${price}`;
  }

  root.SolaresImport = { parseRows, lotKey, fold, TEMPLATE_HEADERS };
  if (typeof module !== 'undefined') module.exports = root.SolaresImport;
})(typeof window !== 'undefined' ? window : globalThis);
