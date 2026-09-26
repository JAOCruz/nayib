// Sube una foto (ya redimensionada en el navegador) como blob de git; se incluye en el commit al guardar.
import { requireUser, json } from './_lib/auth.mjs';
import { createBlob } from './_lib/github.mjs';

const MAX_BYTES = 4 * 1024 * 1024;

export default async (req) => {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const { image } = await req.json().catch(() => ({}));
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(image || '');
  if (!match) return json({ error: 'Formato de imagen no válido' }, 400);
  if (Buffer.byteLength(match[1], 'base64') > MAX_BYTES) return json({ error: 'Imagen demasiado grande' }, 413);

  try {
    return json({ sha: await createBlob(match[1]) });
  } catch (e) {
    console.error(e);
    return json({ error: 'No se pudo subir la foto a GitHub.' }, 502);
  }
};
