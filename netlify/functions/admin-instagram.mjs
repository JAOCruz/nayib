// Lee un post de Instagram (fotos del carrusel + descripción) usando la sesión de la cuenta secundaria (IG_COOKIE).
import { requireUser, json } from './_lib/auth.mjs';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function mediaIdFromShortcode(shortcode) {
  let id = 0n;
  for (const ch of shortcode) id = id * 64n + BigInt(ALPHABET.indexOf(ch));
  return id.toString();
}

function shortcodeFromUrl(url) {
  const match = /instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/.exec(url || '');
  if (!match) return null;
  // Los posts privados/compartidos llevan 28 caracteres extra al final
  return match[1].length > 28 ? match[1].slice(0, -28) : match[1];
}

function bestImage(item) {
  const candidates = item.image_versions2?.candidates || [];
  const best = candidates.reduce((a, b) => (b.width * b.height > (a?.width || 0) * (a?.height || 0) ? b : a), null);
  return best && { url: best.url, width: best.width, height: best.height, video: item.media_type === 2 };
}

export default async (req) => {
  const user = requireUser(req);
  if (user instanceof Response) return user;
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const cookie = process.env.IG_COOKIE;
  if (!cookie) return json({ error: 'Falta configurar la sesión de Instagram (IG_COOKIE) en Netlify.' }, 500);

  const { url } = await req.json().catch(() => ({}));
  const shortcode = shortcodeFromUrl(url);
  if (!shortcode) return json({ error: 'Ese link no parece un post de Instagram.' }, 400);

  const csrf = /csrftoken=([^;]+)/.exec(cookie)?.[1] || '';
  const res = await fetch(`https://www.instagram.com/api/v1/media/${mediaIdFromShortcode(shortcode)}/info/`, {
    headers: {
      Cookie: cookie,
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
      Accept: '*/*',
      'X-CSRFToken': csrf,
      'X-IG-App-ID': '936619743392459',
      'X-ASBD-ID': '129477',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `https://www.instagram.com/p/${shortcode}/`,
    },
    redirect: 'manual',
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {}

  if (!res.ok || !data?.items?.length) {
    console.error('Instagram', res.status, text.slice(0, 300));
    if (res.status === 404) return json({ error: 'No se encontró el post. ¿El link es correcto?' }, 404);
    if (res.status === 429 || /wait a few minutes/i.test(text)) {
      return json({ error: 'Instagram pidió esperar unos minutos. Intenta más tarde o sube las fotos a mano.' }, 429);
    }
    return json(
      { error: 'Instagram rechazó la sesión. Probablemente hay que renovar IG_COOKIE. Mientras tanto puedes subir las fotos a mano.' },
      502
    );
  }

  const post = data.items[0];
  const items = post.carousel_media?.length ? post.carousel_media : [post];
  return json({
    shortcode,
    caption: post.caption?.text || '',
    images: items.map(bestImage).filter(Boolean),
  });
};
