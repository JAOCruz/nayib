// Extrae los datos de una propiedad a partir de la descripción de un post de Instagram.
// Son reglas simples: lo que no encuentre queda vacío para llenarlo a mano en el formulario.
(function (root) {
  const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}️‍⃣]/gu;
  const BULLET = /^\s*(?:[•·▪◦‣∙●○■□✓✔✅☑➤➔→\-–*]|\d+[.)])\s*/u;
  const SIGNATURE = /excelente día|construye hoy|lowess real estate|lowest wessin|escr[ií]beme|m[aá]s informaci[oó]n|por dm|whatsapp|mensaje directo|disponibilidad actualizada/i;

  const KNOWN_SECTORS = [
    'Ensanche Naco', 'Naco', 'Piantini', 'Serrallés', 'Evaristo Morales', 'Bella Vista', 'La Esperilla', 'Gazcue',
    'Altos de Arroyo Hondo', 'Arroyo Hondo', 'Cacicazgos', 'Mirador Norte', 'Mirador Sur', 'Paraíso', 'El Millón',
    'Renacimiento', 'Julieta Morales', 'Los Prados', 'La Julia', 'El Vergel', 'El Cacique', 'Urbanización Real',
    'Cap Cana', 'Punta Cana', 'Bávaro', 'Juan Dolio', 'Las Terrenas', 'Samaná', 'Santiago', 'Jarabacoa',
    'Casa de Campo', 'La Romana', 'Bayahibe', 'San Cristóbal', 'Santo Domingo Este', 'Santo Domingo Oeste',
  ];

  const MONTHS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';

  function fold(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function clean(line) {
    return line.replace(EMOJI, '').replace(/\s+/g, ' ').trim();
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // "179,000" / "179.000" / "2,350,000" / "1.5" (millones) → número
  function toNumber(raw, suffix) {
    let s = raw.replace(/\s/g, '');
    if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
    else s = s.replace(',', '.');
    let n = parseFloat(s);
    if (!Number.isFinite(n)) return null;
    const suf = fold(suffix || '');
    if (suf === 'k' || suf === 'mil') n *= 1e3;
    if (suf === 'm' || suf === 'mm' || suf.startsWith('millon')) n *= 1e6;
    return Math.round(n);
  }

  function findPrices(text) {
    const prices = [];
    const re = /(RD\$|US\$|USD\s*\$?|U\$S|\$)\s*([\d][\d.,]*)\s*(k|mil|millones|millón|mm|m)?\b|([\d][\d.,]*)\s*(k|mil|millones|mm)?\s*(USD|US\$|d[oó]lares|RD\$|pesos)/giu;
    let m;
    while ((m = re.exec(text))) {
      const symbol = (m[1] || m[6] || '').toUpperCase();
      const value = toNumber(m[2] || m[4], m[3] || m[5]);
      if (value && value >= 1000) prices.push({ value, currency: /RD|PESOS/.test(symbol) ? 'DOP' : 'USD' });
    }
    return prices;
  }

  function findArea(text) {
    const values = [];
    const re = /(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(?:m2|m²|mts2?|mt2|metros(?:\s+cuadrados)?)(?![a-z])/gi;
    let m;
    while ((m = re.exec(text))) {
      const n = /^\d{1,3}([.,]\d{3})+$/.test(m[1]) ? Number(m[1].replace(/[.,]/g, '')) : Number(m[1].replace(',', '.'));
      if (n > 0) values.push(n);
    }
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const fmt = (n) => n.toLocaleString('en-US');
    return min === max ? `${fmt(min)} m²` : `${fmt(min)} - ${fmt(max)} m²`;
  }

  function findType(title, text) {
    const t = fold(title);
    const all = fold(text);
    const luxury = /lujo|deluxe|luxury|premium/.test(t);
    if (/penthouse|pent-house|penthouse/.test(t)) return 'Pent-House';
    if (/\bvilla/.test(t)) return 'Villa';
    if (/\bsolar|terreno|\blote/.test(t)) return 'Solar';
    if (/local comercial/.test(t)) return 'Local Comercial / Oficinas';
    if (/oficina/.test(t)) return 'Oficina';
    if (/\bloft/.test(t)) return 'Loft';
    if (/apartamentos/.test(t)) return luxury ? 'Apartamentos de Lujo' : 'Apartamentos';
    if (/apartamento/.test(t)) return luxury ? 'Apartamento de Lujo' : 'Apartamento';
    if (/\bvilla/.test(all)) return 'Villa';
    if (/\bsolar|terreno/.test(all)) return 'Solar';
    if (/apartamentos/.test(all)) return 'Apartamentos';
    if (/apartamento/.test(all)) return 'Apartamento';
    return '';
  }

  function findLocation(lines, title, knownLocations) {
    const sectors = [...new Set([...KNOWN_SECTORS, ...knownLocations.map((l) => l.split(',')[0].trim())])]
      .filter((s) => s.length > 3 && !/^av\.?\s|^avenida|^km\s/i.test(s))
      .sort((a, b) => b.length - a.length);

    const pinIndex = lines.findIndex((l) => l.includes('📍'));
    const pinText = pinIndex === -1 ? '' : lines[pinIndex] + ' ' + (lines[pinIndex + 1] || '');
    const haystacks = [pinText, title, lines.join(' ')].map(fold);

    for (const hay of haystacks) {
      const sector = sectors.find((s) => new RegExp(`(^|[^a-z])${fold(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(hay));
      if (!sector) continue;
      // Reutiliza la forma en que ya aparece en el sitio (ej. "Naco, Santo Domingo") si existe
      const counts = {};
      knownLocations
        .filter((l) => fold(l.split(',')[0].trim()).endsWith(fold(sector)) && l.includes(','))
        .forEach((l) => (counts[l] = (counts[l] || 0) + 1));
      const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      return { sector, location: best || sector };
    }
    return { sector: '', location: '' };
  }

  function findDelivery(text) {
    const m = new RegExp(`entrega(?:do)?(?:\\s+estimada)?\\s*(?:en|:)?\\s*((?:${MONTHS})?\\s*(?:de\\s+)?\\d{4})`, 'i').exec(text);
    if (!m) return { delivery: '', delivered: false };
    const when = capitalize(m[1].replace(/\s+de\s+/i, ' ').trim());
    const delivered = /entregado/i.test(m[0]);
    return { delivery: delivered ? `Entregado ${when}` : when, delivered };
  }

  function parseCaption(caption, knownLocations = []) {
    const text = String(caption || '').replace(/\r/g, '');
    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const lines = rawLines.filter((l) => !/^#/.test(l) && !/^[⸻—_\-=\s]+$/u.test(l));

    const title = clean(lines[0] || '').replace(/[:.]$/, '').slice(0, 100);

    const features = [];
    const paragraphs = [];
    for (const line of lines.slice(1)) {
      if (SIGNATURE.test(line)) continue;
      const withoutEmoji = clean(line);
      if (!withoutEmoji) continue;
      if (BULLET.test(line)) {
        const item = clean(line.replace(BULLET, ''));
        if (item) features.push(item);
      } else if (withoutEmoji.length >= 40 && !withoutEmoji.endsWith(':')) {
        paragraphs.push(withoutEmoji);
      }
    }

    const prices = findPrices(text);
    const best = prices.length ? prices.reduce((a, b) => (b.value < a.value ? b : a)) : null;
    const { sector, location } = findLocation(lines, title, knownLocations);
    const { delivery, delivered } = findDelivery(text);

    let status = 'Disponible';
    if (delivered || /entrega inmediata|listo para entrega/i.test(text)) status = 'Listo para entrega';
    else if (/entrega estimada|en construcci[oó]n|preventa/i.test(text)) status = 'En construcción';

    return {
      title,
      type: findType(title, text),
      price: best ? best.value : null,
      currency: best ? best.currency : 'USD',
      location,
      area: findArea(text),
      delivery,
      status,
      badge: status === 'Listo para entrega' ? 'Entrega Inmediata' : sector,
      description: [title, ...paragraphs].filter(Boolean).join(' '),
      features: features.slice(0, 25),
    };
  }

  root.parseCaption = parseCaption;
  if (typeof module !== 'undefined') module.exports = { parseCaption };
})(typeof window !== 'undefined' ? window : globalThis);
