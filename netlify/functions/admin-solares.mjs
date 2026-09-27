// Terrenos (categories.solares.data): agregar en lote, editar y eliminar solares individuales.
// Estructura en properties.json: [{ ubicacion, solares: [{ area_m2, frente_m, fondo_m, precio_usd_m2, precio_total_usd?, estatus_legal }] }]
import { requireUser, json } from './_lib/auth.mjs';
import { commitData, explainGitHubError } from './_lib/github.mjs';

const MAX_LOTS = 1000;

function fold(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const numOrText = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() ? v.trim().slice(0, 40) : null);

// Deja solo los campos conocidos con tipos válidos
function cleanLot(lot) {
  const price = lot.precio_usd_m2;
  const out = {
    area_m2: numOrText(lot.area_m2),
    frente_m: numOrText(lot.frente_m),
    fondo_m: numOrText(lot.fondo_m),
    precio_usd_m2: typeof price === 'number' && Number.isFinite(price) ? price : 'CONSULTAR',
    estatus_legal: String(lot.estatus_legal || 'CON TÍTULO').trim().slice(0, 120),
  };
  if (numOrNull(lot.precio_total_usd) !== null) out.precio_total_usd = lot.precio_total_usd;
  return out;
}

// Huella para detectar si el solar que se quiere editar/borrar sigue siendo el mismo
function fingerprint(lot) {
  return JSON.stringify([lot.area_m2, lot.frente_m, lot.fondo_m, lot.precio_usd_m2, lot.precio_total_usd ?? null, lot.estatus_legal]);
}

function groups(data) {
  const cat = data.categories.solares || (data.categories.solares = { name: 'Solares disponibles', isListFormat: true, data: [] });
  return cat.data || (cat.data = []);
}

function findGroup(list, ubicacion) {
  const key = fold(ubicacion);
  return list.find((g) => fold(g.ubicacion) === key);
}

function addLot(list, ubicacion, lot) {
  let group = findGroup(list, ubicacion);
  if (!group) {
    group = { ubicacion: ubicacion.trim(), solares: [] };
    list.push(group);
  }
  group.solares.push(lot);
}

function locate(list, { ubicacion, index, fingerprint: fp }) {
  const group = list.find((g) => g.ubicacion === ubicacion);
  const lot = group?.solares[index];
  if (!lot || fingerprint(lot) !== fp) return null;
  return { group, lot };
}

function removeFromGroup(list, group, index) {
  group.solares.splice(index, 1);
  if (!group.solares.length) list.splice(list.indexOf(group), 1);
}

export default async (req) => {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const body = await req.json().catch(() => ({}));
  const changed = 'Ese terreno cambió o ya no existe (¿lo editó otra persona?). Recarga la lista.';

  try {
    if (body.action === 'add') {
      const lots = Array.isArray(body.lots) ? body.lots : [];
      if (!lots.length || lots.length > MAX_LOTS) return json({ error: 'No hay terrenos para agregar' }, 400);
      if (lots.some((l) => !String(l.ubicacion || '').trim())) return json({ error: 'Todos los terrenos necesitan ubicación' }, 400);

      const { result } = await commitData({
        author: user,
        message: `admin: agrega ${lots.length} terreno${lots.length === 1 ? '' : 's'}${body.source ? ` desde ${body.source}` : ''} (por ${user})`,
        mutate(data) {
          const list = groups(data);
          for (const l of lots) addLot(list, String(l.ubicacion), cleanLot(l));
          return { ok: true, added: lots.length };
        },
      });
      return json(result);
    }

    if (body.action === 'update') {
      const newUbicacion = String(body.lot?.ubicacion || '').trim();
      if (!newUbicacion) return json({ error: 'La ubicación es obligatoria' }, 400);
      const { result } = await commitData({
        author: user,
        message: `admin: actualiza terreno en ${newUbicacion} (por ${user})`,
        mutate(data) {
          const list = groups(data);
          const found = locate(list, body.target || {});
          if (!found) return { error: changed };
          const lot = cleanLot(body.lot);
          if (fold(found.group.ubicacion) === fold(newUbicacion)) {
            found.group.solares[body.target.index] = lot;
            found.group.ubicacion = newUbicacion;
          } else {
            removeFromGroup(list, found.group, body.target.index);
            addLot(list, newUbicacion, lot);
          }
          return { ok: true };
        },
      });
      return result.error ? json(result, 409) : json(result);
    }

    if (body.action === 'delete') {
      const { result } = await commitData({
        author: user,
        message: `admin: elimina terreno en ${body.target?.ubicacion} (por ${user})`,
        mutate(data) {
          const list = groups(data);
          const found = locate(list, body.target || {});
          if (!found) return { error: changed };
          removeFromGroup(list, found.group, body.target.index);
          return { ok: true };
        },
      });
      return result.error ? json(result, 409) : json(result);
    }

    return json({ error: 'Acción no válida' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: explainGitHubError(e, 'No se pudo guardar en GitHub. Intenta de nuevo.') }, 502);
  }
};
