// Devuelve el properties.json más reciente de la rama (no el publicado, que puede ir 1-2 min atrás).
import { requireUser, json } from './_lib/auth.mjs';
import { headCommit, readData } from './_lib/github.mjs';

export default async (req) => {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  try {
    const head = await headCommit();
    const data = await readData(head.sha);
    return json({ user, commit: head.sha, data });
  } catch (e) {
    console.error(e);
    return json({ error: 'No se pudieron cargar las propiedades desde GitHub.' }, 502);
  }
};
