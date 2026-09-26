// Cliente mínimo de la API de GitHub para leer y commitear el repo del sitio.
const API = process.env.GITHUB_API_URL || 'https://api.github.com';

// Copias de properties.json que se mantienen idénticas (la raíz es la que Netlify sirve)
export const DATA_PATHS = ['data/properties.json', 'public/data/properties.json', 'dist/data/properties.json'];

function config() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN no configurado');
  return {
    token,
    repo: process.env.GITHUB_REPO || 'JAOCruz/nayib',
    branch: process.env.GITHUB_BRANCH || 'feat/organization',
  };
}

async function gh(path, { method = 'GET', body, accept = 'application/vnd.github+json' } = {}) {
  const { token, repo } = config();
  const res = await fetch(`${API}/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'realestatewl-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return accept.includes('raw') ? res.text() : res.json();
}

export async function headCommit() {
  const { branch } = config();
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
  const commit = await gh(`/git/commits/${ref.object.sha}`);
  return { sha: ref.object.sha, tree: commit.tree.sha };
}

export async function readData(commitSha) {
  const raw = await gh(`/contents/${DATA_PATHS[0]}?ref=${commitSha}`, { accept: 'application/vnd.github.raw+json' });
  return JSON.parse(raw);
}

export async function createBlob(base64) {
  const blob = await gh('/git/blobs', { method: 'POST', body: { content: base64, encoding: 'base64' } });
  return blob.sha;
}

// Crea un commit con los archivos dados ({path, sha} o {path, content}) y mueve la rama.
// `mutate(data)` recibe el properties.json más reciente y lo modifica; se reintenta si la rama avanzó.
export async function commitData({ mutate, files = [], message, author }) {
  const { branch } = config();
  for (let attempt = 0; attempt < 3; attempt++) {
    const head = await headCommit();
    const data = await readData(head.sha);
    const result = mutate(data);
    if (result?.error) return { result };
    const content = JSON.stringify(data, null, 2) + '\n';
    const dataSha = await createBlob(Buffer.from(content).toString('base64'));
    const tree = await gh('/git/trees', {
      method: 'POST',
      body: {
        base_tree: head.tree,
        tree: [
          ...DATA_PATHS.map((path) => ({ path, mode: '100644', type: 'blob', sha: dataSha })),
          ...files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', sha: f.sha })),
        ],
      },
    });
    const commit = await gh('/git/commits', {
      method: 'POST',
      body: {
        message,
        tree: tree.sha,
        parents: [head.sha],
        author: { name: `Panel admin (${author})`, email: 'admin@realestatewl.com' },
      },
    });
    try {
      await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
      return { commit: commit.sha, result };
    } catch (e) {
      // 422: la rama avanzó mientras tanto (otro guardado); se vuelve a aplicar sobre la versión nueva
      if (e.status !== 422 || attempt === 2) throw e;
    }
  }
}
