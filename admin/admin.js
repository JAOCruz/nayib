// Panel de propiedades: login, lista, editor, importación desde Instagram y publicación vía Netlify Functions.
(function () {
  const API = '/.netlify/functions';
  const TOKEN_KEY = 'wl_admin_token';
  const MAX_SIDE = 1600;
  const JPEG_QUALITY = 0.82;

  const state = {
    token: null,
    user: null,
    data: null,
    category: 'propiedades',
    search: '',
    editing: null, // { property, isNew }
    photos: [], // { kind: 'existing', src } | { kind: 'new', blob, preview }
  };

  const $ = (id) => document.getElementById(id);
  const form = $('editorForm');

  // ---------- utilidades ----------

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function toast(msg, ms = 4000) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (el.hidden = true), ms);
  }

  function show(view) {
    ['loginView', 'listView', 'editorView'].forEach((v) => ($(v).hidden = v !== view));
    $('userBox').hidden = view === 'loginView';
    window.scrollTo(0, 0);
  }

  function storage(action, value) {
    try {
      if (action === 'get') return sessionStorage.getItem(TOKEN_KEY);
      if (action === 'set') sessionStorage.setItem(TOKEN_KEY, value);
      if (action === 'remove') sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
    return null;
  }

  async function api(name, { method = 'GET', body, raw = false } = {}) {
    const res = await fetch(`${API}/${name}`, {
      method,
      headers: {
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && name !== 'admin-login') {
      logout();
      throw new Error('Tu sesión expiró. Entra de nuevo.');
    }
    if (raw) {
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.blob();
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  function slugify(s) {
    return String(s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/, '');
  }

  function newId(title) {
    return `prop-${slugify(title) || 'propiedad'}-${Date.now().toString(36).slice(-5)}`;
  }

  function allProperties() {
    return ['propiedades', 'oficinas'].flatMap((c) => state.data.categories[c]?.properties || []);
  }

  function isFeatured(id) {
    return (state.data.featured || []).some((p) => p.id === id);
  }

  function formatPrice(p) {
    if (p.showPrice === false) return 'A Consultar';
    return `$${Number(p.price || 0).toLocaleString('en-US')} ${p.currency || ''}`;
  }

  // Redimensiona en el navegador para subir fotos livianas (máx 1600px, JPEG)
  async function toJpegDataUrl(blob) {
    const bitmap = await createImageBitmap(blob).catch(() => null);
    let source = bitmap;
    let width, height;
    if (bitmap) {
      width = bitmap.width;
      height = bitmap.height;
    } else {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('No se pudo leer una de las fotos (¿formato HEIC?). Conviértela a JPG.'));
        i.src = URL.createObjectURL(blob);
      });
      source = img;
      width = img.naturalWidth;
      height = img.naturalHeight;
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  }

  async function mapLimit(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
  }

  // ---------- sesión ----------

  async function login(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    $('loginError').textContent = '';
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      const { token, user } = await api('admin-login', {
        method: 'POST',
        body: { username: fd.get('username'), password: fd.get('password') },
      });
      state.token = token;
      state.user = user;
      storage('set', token);
      e.target.reset();
      await loadData();
    } catch (err) {
      $('loginError').textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }

  function logout() {
    state.token = null;
    state.user = null;
    storage('remove');
    show('loginView');
  }

  // ---------- lista ----------

  async function loadData() {
    const { data, user } = await api('admin-data');
    state.data = data;
    state.user = user;
    $('userName').textContent = user;
    fillDatalists();
    renderList();
    show('listView');
  }

  function fillDatalists() {
    const props = allProperties();
    const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    const fill = (id, values) => ($(id).innerHTML = uniq(values).map((v) => `<option value="${esc(v)}">`).join(''));
    fill('typeList', [...props.map((p) => p.type), 'Solar', 'Terreno', 'Casa']);
    fill('locationList', props.map((p) => p.location));
    fill('statusList', [...props.map((p) => p.status), 'Vendido', 'Reservado']);
    fill('badgeList', [...props.map((p) => p.badge), 'Vendido', 'Nuevo']);
  }

  function renderList() {
    const cats = ['propiedades', 'oficinas'];
    $('categoryTabs').innerHTML = cats
      .map((c) => {
        const n = state.data.categories[c]?.properties.length || 0;
        return `<button class="tab ${c === state.category ? 'active' : ''}" data-cat="${c}">${esc(state.data.categories[c]?.name || c)} (${n})</button>`;
      })
      .join('');

    const q = state.search.trim().toLowerCase();
    const list = (state.data.categories[state.category]?.properties || []).filter(
      (p) => !q || [p.title, p.location, p.id, p.type].some((v) => String(v || '').toLowerCase().includes(q))
    );

    $('propertyList').innerHTML = list.length
      ? list
          .map((p) => {
            const sold = p.status === 'Vendido';
            return `
        <div class="prop-row" data-id="${esc(p.id)}">
          <img src="${esc(p.image || (p.gallery || [])[0] || '')}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <div>
            <div class="prop-title">${esc(p.title)}${sold ? '<span class="pill sold">Vendido</span>' : ''}${
              isFeatured(p.id) ? '<span class="pill star">★ Destacada</span>' : ''
            }</div>
            <div class="prop-meta">${esc(formatPrice(p))} · ${esc(p.location)}</div>
            <div class="prop-meta">${esc(p.status || '')} · ${(p.gallery || []).length} fotos</div>
          </div>
          <div class="prop-actions">
            <a class="btn btn-sm" href="/property-detail.html?id=${encodeURIComponent(p.id)}&type=${state.category}" target="_blank" rel="noopener">Ver</a>
            <button class="btn btn-sm" data-action="edit">Editar</button>
            <button class="btn btn-sm" data-action="sold">${sold ? 'Disponible' : 'Vendida'}</button>
            <button class="btn btn-sm btn-danger" data-action="delete">Eliminar</button>
          </div>
        </div>`;
          })
          .join('')
      : '<p class="hint">No hay propiedades que coincidan.</p>';
  }

  async function onListClick(e) {
    const tab = e.target.closest('[data-cat]');
    if (tab) {
      state.category = tab.dataset.cat;
      renderList();
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.closest('.prop-row').dataset.id;
    const property = allProperties().find((p) => p.id === id);
    if (!property) return;

    if (btn.dataset.action === 'edit') return openEditor(property);

    if (btn.dataset.action === 'delete') {
      if (!confirm(`¿Eliminar "${property.title}" de la web? Esto no se puede deshacer desde el panel.`)) return;
      await runListAction(btn, () => api('admin-save', { method: 'POST', body: { action: 'delete', id } }), 'Propiedad eliminada.');
    }

    if (btn.dataset.action === 'sold') {
      const updated = structuredClone(property);
      if (updated.status === 'Vendido') {
        const prev = updated.before_sold || {};
        updated.status = prev.status || 'Disponible';
        updated.badge = prev.badge || '';
        delete updated.before_sold;
      } else {
        updated.before_sold = { status: updated.status, badge: updated.badge };
        updated.status = 'Vendido';
        updated.badge = 'Vendido';
      }
      await runListAction(
        btn,
        () =>
          api('admin-save', {
            method: 'POST',
            body: { action: 'save', property: updated, category: state.category, featured: isFeatured(id), isNew: false },
          }),
        updated.status === 'Vendido' ? 'Marcada como vendida.' : 'Marcada como disponible.'
      );
    }
  }

  async function runListAction(btn, fn, message) {
    btn.disabled = true;
    try {
      await fn();
      await loadData();
      toast(`${message} La web se actualiza en 1-2 minutos.`);
    } catch (err) {
      toast(err.message, 6000);
      btn.disabled = false;
    }
  }

  // ---------- editor ----------

  function openEditor(property) {
    const isNew = !property;
    const p = property || {
      currency: 'USD',
      showPrice: true,
      status: 'Disponible',
      features: [],
      gallery: [],
    };
    state.editing = { property: p, isNew };
    state.photos.forEach((ph) => ph.preview && URL.revokeObjectURL(ph.preview));
    state.photos = (p.gallery?.length ? p.gallery : p.image ? [p.image] : []).map((src) => ({ kind: 'existing', src }));

    $('editorTitle').textContent = isNew ? 'Nueva propiedad' : 'Editar propiedad';
    $('igBox').hidden = !isNew;
    $('igUrl').value = '';
    $('igStatus').textContent = '';
    $('editorError').textContent = '';
    $('publishStatus').textContent = '';
    $('publishStatus').className = 'status';

    form.reset();
    const f = form.elements;
    f.title.value = p.title || '';
    f.category.value = state.category;
    f.type.value = p.type || '';
    f.price.value = p.price ?? '';
    f.currency.value = ['USD', 'DOP', 'USD/mes'].includes(p.currency) ? p.currency : 'USD';
    f.showPrice.checked = p.showPrice !== false;
    f.location.value = p.location || '';
    f.area.value = p.area || '';
    f.units.value = p.units ?? '';
    f.status.value = p.status || '';
    f.badge.value = p.badge || '';
    f.delivery.value = p.delivery || '';
    f.featured.checked = !isNew && isFeatured(p.id);
    f.description.value = p.description || '';
    f.features.value = (p.features || []).join('\n');
    const pp = p.payment_plan || {};
    f.pp_reservation.value = pp.reservation || '';
    f.pp_contract.value = pp.contract || '';
    f.pp_construction.value = pp.construction || '';
    f.pp_delivery.value = pp.delivery || '';
    form.querySelector('details').open = !!p.payment_plan;

    renderPhotos();
    show('editorView');
  }

  function renderPhotos() {
    $('photoGrid').innerHTML = state.photos
      .map(
        (ph, i) => `
      <div class="photo ${ph.loading ? 'loading' : ''}" data-i="${i}">
        ${ph.loading ? '' : `<img src="${esc(ph.kind === 'existing' ? ph.src : ph.preview)}" alt="">`}
        ${i === 0 ? '<span class="cover">Portada</span>' : ''}
        <div class="tools">
          <button type="button" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Mover a la izquierda">◀</button>
          <button type="button" data-remove aria-label="Quitar">✕</button>
          <button type="button" data-move="1" ${i === state.photos.length - 1 ? 'disabled' : ''} aria-label="Mover a la derecha">▶</button>
        </div>
      </div>`
      )
      .join('');
  }

  function onPhotoClick(e) {
    const el = e.target.closest('.photo');
    if (!el) return;
    const i = Number(el.dataset.i);
    if (e.target.closest('[data-remove]')) {
      const [removed] = state.photos.splice(i, 1);
      if (removed.preview) URL.revokeObjectURL(removed.preview);
    } else if (e.target.closest('[data-move]')) {
      const j = i + Number(e.target.closest('[data-move]').dataset.move);
      if (j < 0 || j >= state.photos.length) return;
      [state.photos[i], state.photos[j]] = [state.photos[j], state.photos[i]];
    } else return;
    renderPhotos();
  }

  function addFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) continue;
      state.photos.push({ kind: 'new', blob: file, preview: URL.createObjectURL(file) });
    }
    renderPhotos();
  }

  async function importInstagram() {
    const url = $('igUrl').value.trim();
    if (!url) return;
    const btn = $('igBtn');
    const status = $('igStatus');
    btn.disabled = true;
    status.className = 'status';
    status.textContent = 'Leyendo el post de Instagram…';
    try {
      const post = await api('admin-instagram', { method: 'POST', body: { url } });
      const fields = window.parseCaption(post.caption, allProperties().map((p) => p.location).filter(Boolean));
      applyParsed(fields);

      const images = post.images.filter((img) => !img.video);
      const placeholders = images.map(() => ({ kind: 'new', loading: true }));
      state.photos = [...state.photos.filter((p) => p.kind === 'new' && !p.loading), ...placeholders];
      renderPhotos();

      let done = 0;
      let failed = 0;
      await mapLimit(images, 3, async (img, i) => {
        try {
          const blob = await api(`admin-ig-image?url=${encodeURIComponent(img.url)}`, { raw: true });
          Object.assign(placeholders[i], { blob, preview: URL.createObjectURL(blob), loading: false });
        } catch {
          failed++;
          Object.assign(placeholders[i], { failed: true, loading: false });
        }
        done++;
        status.textContent = `Descargando fotos… ${done} de ${images.length}`;
        renderPhotos();
      });
      state.photos = state.photos.filter((p) => !p.failed);
      renderPhotos();

      const videos = post.images.length - images.length;
      status.className = 'status ok';
      status.textContent =
        `Listo: ${images.length - failed} fotos importadas` +
        (failed ? `, ${failed} fallaron` : '') +
        (videos ? ` (${videos} videos omitidos)` : '') +
        '. Revisa los datos antes de publicar.';
    } catch (err) {
      status.className = 'error';
      status.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }

  function applyParsed(d) {
    const f = form.elements;
    const set = (name, value) => {
      if (value !== null && value !== undefined && value !== '') f[name].value = value;
    };
    set('title', d.title);
    set('type', d.type);
    set('price', d.price);
    set('currency', d.currency);
    set('location', d.location);
    set('area', d.area);
    set('status', d.status);
    set('badge', d.badge);
    set('delivery', d.delivery);
    set('description', d.description);
    if (d.features.length) f.features.value = d.features.join('\n');
    if (d.price === null) f.showPrice.checked = false;
  }

  function readForm() {
    const f = form.elements;
    const base = state.editing.property;
    const lines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
    const property = {
      ...base,
      id: base.id || newId(f.title.value),
      title: f.title.value.trim(),
      price: f.price.value === '' ? 0 : Number(f.price.value),
      showPrice: f.showPrice.checked,
      currency: f.currency.value,
      location: f.location.value.trim(),
      type: f.type.value.trim(),
      area: f.area.value.trim(),
      description: f.description.value.trim(),
      features: lines(f.features.value),
      status: f.status.value.trim() || 'Disponible',
      badge: f.badge.value.trim(),
    };
    const units = f.units.value === '' ? null : Number(f.units.value);
    if (units === null) delete property.units;
    else property.units = units;
    const delivery = f.delivery.value.trim();
    if (delivery) property.delivery = delivery;
    else delete property.delivery;

    const pp = {
      reservation: f.pp_reservation.value.trim(),
      contract: f.pp_contract.value.trim(),
      construction: f.pp_construction.value.trim(),
      delivery: f.pp_delivery.value.trim(),
    };
    if (Object.values(pp).some(Boolean)) property.payment_plan = pp;
    else delete property.payment_plan;

    return { property, category: f.category.value, featured: f.featured.checked };
  }

  async function publish(e) {
    e.preventDefault();
    const error = $('editorError');
    const status = $('publishStatus');
    error.textContent = '';
    status.className = 'status';

    const { property, category, featured } = readForm();
    if (!property.title) return (error.textContent = 'El título es obligatorio.');
    if (!Number.isFinite(property.price) || property.price < 0) return (error.textContent = 'El precio debe ser un número.');
    if (property.showPrice && !property.price) return (error.textContent = 'Pon un precio o desmarca "Mostrar precio".');
    if (state.photos.some((p) => p.loading)) return (error.textContent = 'Espera a que terminen de cargar las fotos.');
    if (!state.photos.length) return (error.textContent = 'Agrega al menos una foto.');

    const btn = $('publishBtn');
    btn.disabled = true;
    try {
      const stamp = Date.now().toString(36);
      const newPhotos = state.photos.filter((p) => p.kind === 'new');
      let uploaded = 0;
      const files = await mapLimit(newPhotos, 3, async (photo, i) => {
        const image = await toJpegDataUrl(photo.blob);
        const { sha } = await api('admin-upload', { method: 'POST', body: { image } });
        uploaded++;
        status.textContent = `Subiendo fotos… ${uploaded} de ${newPhotos.length}`;
        const path = `images/panel/${property.id}/${stamp}-${i + 1}.jpg`;
        photo.path = path;
        return { path, sha };
      });

      property.gallery = state.photos.map((p) => (p.kind === 'existing' ? p.src : `/${p.path}`));
      property.image = property.gallery[0];

      status.textContent = 'Publicando…';
      await api('admin-save', {
        method: 'POST',
        body: { action: 'save', property, category, featured, isNew: state.editing.isNew, files },
      });

      state.category = category;
      await loadData();
      toast('¡Publicada! La web se actualiza en 1-2 minutos.', 6000);
    } catch (err) {
      error.textContent = err.message;
      status.textContent = '';
    } finally {
      btn.disabled = false;
    }
  }

  function leaveEditor() {
    if (state.photos.some((p) => p.kind === 'new') && !confirm('Hay fotos nuevas sin publicar. ¿Salir de todos modos?')) return;
    show('listView');
  }

  // ---------- eventos ----------

  $('loginForm').addEventListener('submit', login);
  $('logoutBtn').addEventListener('click', logout);
  $('newBtn').addEventListener('click', () => openEditor(null));
  $('listView').addEventListener('click', onListClick);
  $('searchInput').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderList();
  });
  $('backBtn').addEventListener('click', leaveEditor);
  $('cancelBtn').addEventListener('click', leaveEditor);
  $('photoGrid').addEventListener('click', onPhotoClick);
  $('photoInput').addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  });
  $('igBtn').addEventListener('click', importInstagram);
  $('igUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      importInstagram();
    }
  });
  form.addEventListener('submit', publish);

  // ---------- inicio ----------

  state.token = storage('get');
  if (state.token) {
    loadData().catch(() => logout());
  } else {
    show('loginView');
  }
})();
