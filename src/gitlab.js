// Conector mínimo para la API v4 de GitLab (gitlab.alerta.com.mx).
// Sin dependencias: fetch nativo. El token vive SOLO en .env (GITLAB_TOKEN).
//
// Rol en el triángulo local ⇄ GitLab ⇄ OpenProject:
//   - una RAMA por tarea (convención: op-<id>-<slug>, ej. op-1266-comprobacion-gastos)
//   - el MERGE REQUEST es el filtro extra (revisión)
//   - lo fusionado a la rama principal es el filtro final: "eso ya está bien"

function config() {
  const base = (process.env.GITLAB_BASE_URL || '').replace(/\/+$/, '');
  const token = process.env.GITLAB_TOKEN || '';
  return { base, token, api: base + '/api/v4' };
}

async function request(path, { method = 'GET', body } = {}) {
  const { api, token } = config();
  if (!token) throw new Error('Falta GITLAB_TOKEN en el archivo .env');
  const url = path.startsWith('http') ? path : `${api}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message ? JSON.stringify(data.message) : res.statusText;
    const err = new Error(`GitLab ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function gitGetMe() {
  return request('/user');
}

// Proyectos donde el usuario es miembro.
export async function gitListProjects() {
  const data = await request('/projects?membership=true&simple=true&per_page=100&order_by=last_activity_at');
  return (data || []).map((p) => ({
    id: p.id,
    nombre: p.name,
    ruta: p.path_with_namespace,
    rama_principal: p.default_branch,
    url: p.web_url,
    actividad: p.last_activity_at,
  }));
}

// Resuelve un proyecto por id, ruta (namespace/proyecto) o nombre.
export async function gitResolverProyecto(ref) {
  const q = String(ref).trim();
  if (/^\d+$/.test(q)) {
    try { const p = await request(`/projects/${q}`); return simplificar(p); } catch { /* sigue */ }
  }
  if (q.includes('/')) {
    try { const p = await request(`/projects/${encodeURIComponent(q)}`); return simplificar(p); } catch { /* sigue */ }
  }
  const todos = await gitListProjects();
  const ql = q.toLowerCase();
  return (
    todos.find((p) => p.ruta.toLowerCase() === ql || p.nombre.toLowerCase() === ql) ||
    todos.find((p) => p.ruta.toLowerCase().includes(ql) || p.nombre.toLowerCase().includes(ql)) ||
    null
  );
}

function simplificar(p) {
  return {
    id: p.id,
    nombre: p.name,
    ruta: p.path_with_namespace,
    rama_principal: p.default_branch,
    url: p.web_url,
    actividad: p.last_activity_at,
  };
}

export async function gitListBranches(projectId) {
  const data = await request(`/projects/${projectId}/repository/branches?per_page=100`);
  return (data || []).map((b) => ({
    nombre: b.name,
    fusionada: b.merged,
    protegida: b.protected,
    ultimo_commit: b.commit?.committed_date,
    autor: b.commit?.author_name,
    mensaje: b.commit?.title,
  }));
}

export async function gitCrearRama(projectId, nombre, desde) {
  const b = await request(
    `/projects/${projectId}/repository/branches?branch=${encodeURIComponent(nombre)}&ref=${encodeURIComponent(desde)}`,
    { method: 'POST' }
  );
  return { nombre: b.name, desde };
}

export async function gitListMergeRequests(projectId, { estado = 'all' } = {}) {
  const data = await request(`/projects/${projectId}/merge_requests?state=${estado}&per_page=100&order_by=updated_at`);
  return (data || []).map((m) => ({
    iid: m.iid,
    titulo: m.title,
    estado: m.state, // opened | merged | closed
    rama_origen: m.source_branch,
    rama_destino: m.target_branch,
    autor: m.author?.name,
    url: m.web_url,
    actualizado: m.updated_at,
  }));
}

// Extrae el id de tarea de OpenProject del nombre de una rama o MR.
// Convención preferida: "op-1266-lo-que-sea". Acepta también "1266-..." o "#1266".
export function tareaDesdeNombre(nombre) {
  const m =
    /^op[-_]?(\d{2,6})\b/i.exec(nombre) ||
    /#(\d{2,6})\b/.exec(nombre) ||
    /^(\d{2,6})[-_]/.exec(nombre);
  return m ? Number(m[1]) : null;
}

// Convierte un título de tarea en slug de rama: "Comprobación de gastos" -> "comprobacion-de-gastos".
export function slugDeRama(titulo, max = 40) {
  return String(titulo)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');
}

// El corazón del triángulo: cruza ramas y MRs de un proyecto GitLab con los ids
// de tareas de OpenProject que aparecen en sus nombres. Devuelve, por tarea:
// en qué ramas se trabaja, qué MRs tiene y su situación git.
//   situación: 'fusionada' (merge a principal = filtro final pasado)
//            | 'en revisión' (MR abierto)
//            | 'en desarrollo' (rama sin MR)
export async function gitCruceConTareas(projectId) {
  const [ramas, mrs] = await Promise.all([
    gitListBranches(projectId),
    gitListMergeRequests(projectId, { estado: 'all' }),
  ]);
  const porTarea = new Map();
  const entrada = (id) => {
    if (!porTarea.has(id)) porTarea.set(id, { tarea: id, ramas: [], mrs: [], situacion: 'en desarrollo' });
    return porTarea.get(id);
  };
  for (const r of ramas) {
    const id = tareaDesdeNombre(r.nombre);
    if (id) entrada(id).ramas.push(r);
  }
  for (const m of mrs) {
    const id = tareaDesdeNombre(m.rama_origen) ?? tareaDesdeNombre(m.titulo);
    if (id) entrada(id).mrs.push(m);
  }
  for (const e of porTarea.values()) {
    if (e.mrs.some((m) => m.estado === 'merged') || e.ramas.some((r) => r.fusionada)) e.situacion = 'fusionada';
    else if (e.mrs.some((m) => m.estado === 'opened')) e.situacion = 'en revisión';
  }
  const sinTarea = ramas.filter((r) => !tareaDesdeNombre(r.nombre) && !r.protegida).map((r) => r.nombre);
  return { tareas: [...porTarea.values()].sort((a, b) => a.tarea - b.tarea), ramasSinTarea: sinTarea };
}
