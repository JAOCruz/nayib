// Crea, edita o elimina una propiedad y lo publica con un commit en la rama de producción.
import { requireUser, json } from './_lib/auth.mjs';
import { commitData } from './_lib/github.mjs';

const CATEGORIES = ['propiedades', 'oficinas'];
const ID_RE = /^[a-z0-9][a-z0-9-]{2,80}$/;
const IMAGE_PATH_RE = /^images\/panel\/[a-z0-9-]+\/[a-z0-9-]+\.jpg$/;

function findProperty(data, id) {
  for (const cat of CATEGORIES) {
    const list = data.categories[cat]?.properties || [];
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) return { cat, list, index };
  }
  return null;
}

function syncFeatured(data, property, featured) {
  const list = data.featured || (data.featured = []);
  const index = list.findIndex((p) => p.id === property.id);
  if (featured && index === -1) list.push(property);
  else if (featured) list[index] = property;
  else if (index !== -1) list.splice(index, 1);
}

function validate(property) {
  if (!property || typeof property !== 'object') return 'Faltan los datos de la propiedad';
  if (!ID_RE.test(property.id || '')) return 'ID no válido';
  if (!String(property.title || '').trim()) return 'El título es obligatorio';
  if (!Number.isFinite(property.price) || property.price < 0) return 'El precio debe ser un número';
  if (!Array.isArray(property.gallery) || !property.gallery.length) return 'Agrega al menos una foto';
  return null;
}

export default async (req) => {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === 'delete') {
      const { id } = body;
      const { result } = await commitData({
        author: user,
        message: `admin: elimina ${id} (por ${user})`,
        mutate(data) {
          const found = findProperty(data, id);
          if (!found) return { error: 'La propiedad ya no existe' };
          const [removed] = found.list.splice(found.index, 1);
          syncFeatured(data, removed, false);
          return { ok: true };
        },
      });
      return result.error ? json(result, 404) : json(result);
    }

    if (body.action === 'save') {
      const { property, category, featured, isNew, files = [] } = body;
      if (!CATEGORIES.includes(category)) return json({ error: 'Categoría no válida' }, 400);
      const error = validate(property);
      if (error) return json({ error }, 400);
      if (!files.every((f) => IMAGE_PATH_RE.test(f.path) && /^[0-9a-f]{40}$/.test(f.sha))) {
        return json({ error: 'Fotos no válidas' }, 400);
      }

      const { result } = await commitData({
        author: user,
        files,
        message: `admin: ${isNew ? 'agrega' : 'actualiza'} "${property.title}" (por ${user})`,
        mutate(data) {
          const found = findProperty(data, property.id);
          if (isNew && found) return { error: 'Ya existe una propiedad con ese ID' };
          if (!isNew && !found) return { error: 'La propiedad ya no existe (¿la borró otra persona?)' };
          const target = data.categories[category].properties;
          if (found && found.cat === category) {
            found.list[found.index] = property;
          } else {
            if (found) found.list.splice(found.index, 1);
            target.unshift(property);
          }
          syncFeatured(data, property, !!featured);
          return { ok: true, id: property.id };
        },
      });
      return result.error ? json(result, 409) : json(result);
    }

    return json({ error: 'Acción no válida' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: 'No se pudo guardar en GitHub. Intenta de nuevo.' }, 502);
  }
};
