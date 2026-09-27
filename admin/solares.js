// Terrenos en el panel: lista por ubicación, alta/edición individual e importación desde Excel.
(function () {
  const { state, api, toast, show, esc, loadData } = window.AdminApp;
  const SI = window.SolaresImport;
  const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const $ = (id) => document.getElementById(id);
  const form = $('solarForm');

  let editing = null; // { target } cuando se edita un terreno existente
  let preview = []; // filas del Excel: { lot, dupe, selected }

  const groups = () => state.data.categories.solares?.data || [];

  // ---------- formato ----------

  const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'A consultar');
  const measure = (v) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : esc(v));

  function totalOf(lot) {
    if (typeof lot.precio_total_usd === 'number') return lot.precio_total_usd;
    if (typeof lot.precio_usd_m2 === 'number' && typeof lot.area_m2 === 'number') return Math.round(lot.precio_usd_m2 * lot.area_m2);
    return null;
  }

  // Igual que en el servidor: identifica el terreno para editarlo/borrarlo sin pisar cambios de otra persona
  function fingerprint(lot) {
    return JSON.stringify([lot.area_m2, lot.frente_m, lot.fondo_m, lot.precio_usd_m2, lot.precio_total_usd ?? null, lot.estatus_legal]);
  }

  function lotCells(lot) {
    return `
      <td>${measure(lot.area_m2)}</td>
      <td>${measure(lot.frente_m)}</td>
      <td>${measure(lot.fondo_m)}</td>
      <td>${money(lot.precio_usd_m2)}</td>
      <td>${money(totalOf(lot))}</td>
      <td>${esc(lot.estatus_legal || '')}</td>`;
  }

  // ---------- lista ----------

  function renderList(container, search) {
    const q = SI.fold(search);
    const list = groups()
      .map((g, gi) => ({ g, gi }))
      .filter(({ g }) => !q || SI.fold(g.ubicacion).includes(q));

    container.innerHTML = list.length
      ? list
          .map(
            ({ g, gi }) => `
        <div class="group">
          <div class="group-title">${esc(g.ubicacion)} <span class="pill">${g.solares.length}</span></div>
          <div class="table-wrap">
            <table class="lots">
              <thead><tr><th>Metraje m²</th><th>Frente</th><th>Fondo</th><th>US$/m²</th><th>Total US$</th><th>Estatus</th><th></th></tr></thead>
              <tbody>
                ${g.solares
                  .map(
                    (lot, li) => `
                  <tr>${lotCells(lot)}
                    <td class="actions-cell">
                      <button class="btn btn-sm" data-saction="edit" data-g="${gi}" data-i="${li}">Editar</button>
                      <button class="btn btn-sm btn-danger" data-saction="delete" data-g="${gi}" data-i="${li}">Eliminar</button>
                    </td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>`
          )
          .join('')
      : '<p class="hint">No hay terrenos que coincidan.</p>';
  }

  async function onListClick(e) {
    const btn = e.target.closest('[data-saction]');
    if (!btn) return;
    const group = groups()[Number(btn.dataset.g)];
    const index = Number(btn.dataset.i);
    const lot = group?.solares[index];
    if (!lot) return;
    const target = { ubicacion: group.ubicacion, index, fingerprint: fingerprint(lot) };

    if (btn.dataset.saction === 'edit') return openForm({ ...lot, ubicacion: group.ubicacion }, target);

    if (!confirm(`¿Eliminar el terreno de ${lot.area_m2 ?? '?'} m² en "${group.ubicacion}"?`)) return;
    btn.disabled = true;
    try {
      await api('admin-solares', { method: 'POST', body: { action: 'delete', target } });
      await reload('Terreno eliminado.');
    } catch (err) {
      toast(err.message, 6000);
      btn.disabled = false;
    }
  }

  async function reload(message) {
    state.category = 'solares';
    await loadData();
    toast(`${message} La web se actualiza en 1-2 minutos.`, 6000);
  }

  function fillDatalists() {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    $('ubicacionList').innerHTML = uniq(groups().map((g) => g.ubicacion)).map((v) => `<option value="${esc(v)}">`).join('');
    $('estatusList').innerHTML = uniq(['CON TÍTULO', 'DESLINDADO', 'A CONSULTAR', ...groups().flatMap((g) => g.solares.map((l) => l.estatus_legal))])
      .map((v) => `<option value="${esc(v)}">`)
      .join('');
  }

  // ---------- formulario individual ----------

  function openForm(lot, target) {
    editing = target ? { target } : null;
    fillDatalists();
    form.reset();
    $('solarTitle').textContent = target ? 'Editar terreno' : 'Agregar terreno';
    $('solarError').textContent = '';
    const f = form.elements;
    const text = (v) => (v === null || v === undefined ? '' : String(v));
    if (lot) {
      const consultar = typeof lot.precio_usd_m2 !== 'number' && typeof lot.precio_total_usd !== 'number';
      f.ubicacion.value = lot.ubicacion || '';
      f.area_m2.value = /consultar/i.test(text(lot.area_m2)) ? '' : text(lot.area_m2);
      f.frente_m.value = text(lot.frente_m);
      f.fondo_m.value = text(lot.fondo_m);
      f.precio_usd_m2.value = typeof lot.precio_usd_m2 === 'number' ? lot.precio_usd_m2 : '';
      f.precio_total_usd.value = typeof lot.precio_total_usd === 'number' ? lot.precio_total_usd : '';
      f.estatus_legal.value = lot.estatus_legal || 'CON TÍTULO';
      f.consultar.checked = consultar;
    } else {
      f.estatus_legal.value = 'CON TÍTULO';
    }
    syncConsultar();
    show('solarView');
  }

  function syncConsultar() {
    const off = form.elements.consultar.checked;
    form.elements.precio_usd_m2.disabled = off;
    form.elements.precio_total_usd.disabled = off;
  }

  function parseMeasure(raw) {
    const v = String(raw || '').trim();
    if (!v) return null;
    if (/consultar/i.test(v)) return 'CONSULTAR';
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : v.toUpperCase();
  }

  function parseMoney(raw) {
    const v = String(raw || '').replace(/[$,\s]|US|USD/gi, '');
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function readForm() {
    const f = form.elements;
    const lot = {
      ubicacion: f.ubicacion.value.replace(/\s+/g, ' ').trim(),
      area_m2: parseMeasure(f.area_m2.value),
      frente_m: parseMeasure(f.frente_m.value),
      fondo_m: parseMeasure(f.fondo_m.value),
      estatus_legal: f.estatus_legal.value.trim().toUpperCase() || 'CON TÍTULO',
    };
    if (!lot.ubicacion) throw new Error('La ubicación es obligatoria.');
    if (f.consultar.checked) {
      lot.precio_usd_m2 = 'CONSULTAR';
      return lot;
    }
    const perM2 = parseMoney(f.precio_usd_m2.value);
    const total = parseMoney(f.precio_total_usd.value);
    if (Number.isNaN(perM2) || Number.isNaN(total)) throw new Error('Los precios deben ser números.');
    const area = typeof lot.area_m2 === 'number' ? lot.area_m2 : null;
    if (perM2 === null && total === null) throw new Error('Pon el precio por m², el precio total, o marca "A consultar".');
    if (perM2 === null && !area) throw new Error('Para calcular el precio por m² desde el total hace falta el metraje.');
    lot.precio_usd_m2 = perM2 !== null ? perM2 : Math.round((total / area) * 100) / 100;
    if (total !== null) lot.precio_total_usd = total;
    return lot;
  }

  async function submitForm(e) {
    e.preventDefault();
    const error = $('solarError');
    error.textContent = '';
    let lot;
    try {
      lot = readForm();
    } catch (err) {
      error.textContent = err.message;
      return;
    }
    const btn = $('solarSaveBtn');
    btn.disabled = true;
    try {
      if (editing) await api('admin-solares', { method: 'POST', body: { action: 'update', target: editing.target, lot } });
      else await api('admin-solares', { method: 'POST', body: { action: 'add', lots: [lot] } });
      await reload(editing ? 'Terreno actualizado.' : 'Terreno publicado.');
    } catch (err) {
      error.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- importación desde Excel ----------

  let xlsxLoading = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    xlsxLoading =
      xlsxLoading ||
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = XLSX_URL;
        s.onload = () => resolve(window.XLSX);
        s.onerror = () => {
          xlsxLoading = null;
          reject(new Error('No se pudo cargar el lector de Excel. Revisa la conexión e intenta de nuevo.'));
        };
        document.head.appendChild(s);
      });
    return xlsxLoading;
  }

  function openImport() {
    preview = [];
    $('excelInput').value = '';
    $('importStatus').textContent = '';
    $('importStatus').className = 'status';
    $('importPreview').hidden = true;
    $('importError').textContent = '';
    show('importView');
    loadXlsx().catch(() => {});
  }

  async function onFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const status = $('importStatus');
    status.className = 'status';
    status.textContent = `Leyendo ${file.name}…`;
    $('importPreview').hidden = true;
    try {
      const XLSX = await loadXlsx();
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      // Usa la primera hoja que tenga la fila de títulos reconocible
      let parsed = null;
      for (const name of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
        const result = SI.parseRows(rows);
        if (result.lots.length) {
          parsed = { ...result, sheet: name };
          break;
        }
        parsed = parsed || result;
      }
      if (!parsed.lots.length) {
        status.className = 'error';
        status.textContent = parsed.errors.join(' ');
        return;
      }

      const existing = new Set(groups().flatMap((g) => g.solares.map((l) => SI.lotKey(g.ubicacion, l))));
      const seen = new Set();
      preview = parsed.lots.map((lot) => {
        const key = SI.lotKey(lot.ubicacion, lot);
        const dupe = existing.has(key) || seen.has(key);
        seen.add(key);
        return { lot, dupe, selected: !dupe };
      });
      status.className = 'status ok';
      status.textContent = `Hoja "${parsed.sheet}" leída.` + (parsed.errors.length ? ' Avisos: ' + parsed.errors.join(' ') : '');
      state.importFile = file.name;
      renderPreview();
    } catch (err) {
      status.className = 'error';
      status.textContent = err.message || 'No se pudo leer el archivo.';
    }
  }

  function renderPreview() {
    const showDupes = $('showDupes').checked;
    const news = preview.filter((p) => !p.dupe).length;
    const selected = preview.filter((p) => p.selected).length;
    $('importSummary').textContent = `${preview.length} terrenos en el archivo · ${news} nuevos · ${preview.length - news} ya están en la web`;
    $('importRows').innerHTML =
      preview
        .map((p, i) =>
          p.dupe && !showDupes
            ? ''
            : `
        <tr class="${p.dupe ? 'dupe' : ''}">
          <td><input type="checkbox" data-row="${i}" ${p.selected ? 'checked' : ''}></td>
          <td>${p.lot.row}</td>
          <td>${esc(p.lot.ubicacion)}</td>
          ${lotCells(p.lot)}
        </tr>`
        )
        .join('') || '<tr><td colspan="10" class="hint">Todos los terrenos del archivo ya están en la web. Marca "Mostrar repetidos" para verlos.</td></tr>';
    $('importPublishBtn').textContent = `Publicar ${selected} terreno${selected === 1 ? '' : 's'}`;
    $('importPublishBtn').disabled = !selected;
    $('importPreview').hidden = false;
  }

  async function publishImport() {
    const lots = preview.filter((p) => p.selected).map(({ lot }) => {
      const { row, ...clean } = lot;
      return clean;
    });
    if (!lots.length) return;
    const btn = $('importPublishBtn');
    btn.disabled = true;
    $('importError').textContent = '';
    try {
      await api('admin-solares', { method: 'POST', body: { action: 'add', lots, source: state.importFile } });
      await reload(`${lots.length} terreno${lots.length === 1 ? '' : 's'} publicado${lots.length === 1 ? '' : 's'}.`);
    } catch (err) {
      $('importError').textContent = err.message;
      btn.disabled = false;
    }
  }

  async function downloadTemplate() {
    try {
      const XLSX = await loadXlsx();
      const ws = XLSX.utils.aoa_to_sheet([
        SI.TEMPLATE_HEADERS,
        ['PUNTA CANA - UVERO ALTO', 14500, 160, '-', 350, 5075000, 'CON TITULO'],
        ['JARABACOA', 'A CONSULTAR', '-', '-', 85, '-', 'CON TITULO'],
      ]);
      ws['!cols'] = [{ wch: 40 }, { wch: 14 }, { wch: 11 }, { wch: 11 }, { wch: 20 }, { wch: 20 }, { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'TERRENOS');
      XLSX.writeFile(wb, 'plantilla-terrenos.xlsx');
    } catch (err) {
      toast(err.message, 6000);
    }
  }

  // ---------- eventos ----------

  $('propertyList').addEventListener('click', onListClick);
  $('newSolarBtn').addEventListener('click', () => openForm(null));
  $('importSolaresBtn').addEventListener('click', openImport);
  form.addEventListener('submit', submitForm);
  $('excelInput').addEventListener('change', onFile);
  $('templateBtn').addEventListener('click', downloadTemplate);
  $('showDupes').addEventListener('change', renderPreview);
  $('importRows').addEventListener('change', (e) => {
    const i = e.target.dataset.row;
    if (i === undefined) return;
    preview[Number(i)].selected = e.target.checked;
    renderPreview();
  });
  $('importPublishBtn').addEventListener('click', publishImport);
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show('listView')));
  // Al marcar "A consultar" se desactivan los precios
  form.elements.consultar.addEventListener('change', syncConsultar);

  window.Solares = { renderList };
})();
