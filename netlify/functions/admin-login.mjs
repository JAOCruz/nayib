import { verifyPassword, signToken, json } from './_lib/auth.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const { username, password } = await req.json().catch(() => ({}));
  const user = verifyPassword(username, password);
  if (!user) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: 'Usuario o contraseña incorrectos' }, 401);
  }
  return json({ token: signToken(user), user });
};
