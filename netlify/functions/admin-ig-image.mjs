// Descarga una foto del CDN de Instagram para el navegador (Instagram no permite leerlas directo por CORS).
import { requireUser, json } from './_lib/auth.mjs';

const ALLOWED_HOSTS = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/;

export default async (req) => {
  const user = requireUser(req);
  if (user instanceof Response) return user;

  let target;
  try {
    target = new URL(new URL(req.url).searchParams.get('url'));
  } catch {
    return json({ error: 'URL no válida' }, 400);
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.test(target.hostname)) return json({ error: 'Host no permitido' }, 400);

  const res = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return json({ error: `Instagram respondió ${res.status}` }, 502);
  return new Response(await res.arrayBuffer(), {
    headers: { 'Content-Type': res.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'no-store' },
  });
};
