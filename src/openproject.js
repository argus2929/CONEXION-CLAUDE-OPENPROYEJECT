// Conector mínimo para la API REST v3 de OpenProject.
// Sin dependencias externas: usa el fetch nativo de Node 24.

// Se lee en el momento de cada llamada (no al importar el módulo), para que
// funcione aunque el .env se cargue después de los imports.
function config() {
  const rawBase = process.env.OPENPROJECT_BASE_URL || '';
  const token = process.env.OPENPROJECT_TOKEN || '';
  // La API vive bajo /api/v3 dentro de la instalación (ojo con la subruta /openproject).
  const apiBase = rawBase.replace(/\/+$/, '') + '/api/v3';
  return { rawBase, token, apiBase };
}

function authHeader() {
  const { token } = config();
  if (!token || token === 'PEGA_AQUI_TU_TOKEN') {
    throw new Error('Falta OPENPROJECT_TOKEN en el archivo .env');
  }
  // OpenProject usa Basic auth con usuario "apikey" y el token como contraseña.
  const basic = Buffer.from(`apikey:${token}`).toString('base64');
  return `Basic ${basic}`;
}

async function request(path, { method = 'GET', body } = {}) {
  const { apiBase } = config();
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || res.statusText;
    const err = new Error(`OpenProject ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// GET /api/v3 -> info del nodo, incluye coreVersion.
export async function getInstanceInfo() {
  return request('/');
}

export async function getMe() {
  return request('/users/me');
}

export async function listProjects() {
  const data = await request('/projects?pageSize=200');
  return data?._embedded?.elements || [];
}

// Construye el parámetro `filters` (JSON codificado) que usa OpenProject.
function filtersParam(filters) {
  return encodeURIComponent(JSON.stringify(filters));
}

export async function myWorkPackages({ onlyOpen = true, pageSize = 100 } = {}) {
  const me = await getMe();
  const filters = [{ assignee: { operator: '=', values: [String(me.id)] } }];
  if (onlyOpen) filters.push({ status: { operator: 'o', values: [] } }); // 'o' = abiertas
  const sort = encodeURIComponent('[["updatedAt","desc"]]');
  const qs = `filters=${filtersParam(filters)}&pageSize=${pageSize}&sortBy=${sort}`;
  const data = await request(`/work_packages?${qs}`);
  return (data?._embedded?.elements || []).map(simplifyWP);
}

export async function getWorkPackage(id) {
  return request(`/work_packages/${id}`);
}

// Todos los paquetes de trabajo de un proyecto (sin filtrar por asignado ni estado).
export async function projectWorkPackages(projectId, { pageSize = 200 } = {}) {
  const filters = encodeURIComponent(JSON.stringify([{ project: { operator: '=', values: [String(projectId)] } }]));
  const data = await request(`/work_packages?filters=${filters}&pageSize=${pageSize}`);
  return data?._embedded?.elements || [];
}

// Prefijo de ruta de la API (incluye la subruta /openproject), para construir _links.
function apiPath() {
  return new URL(config().apiBase).pathname; // p. ej. /openproject/api/v3
}

export async function listTypes() {
  const data = await request('/types?pageSize=200');
  return (data?._embedded?.elements || []).map((t) => ({ id: t.id, nombre: t.name, href: t._links?.self?.href }));
}

// --- Registro de tiempo (time entries) ---

// Formulario de registro de tiempo: valida (sin guardar) y devuelve el schema
// con campos requeridos y actividades permitidas para ese work package.
export async function timeEntryForm(workPackageId) {
  const base = apiPath();
  return request('/time_entries/form', {
    method: 'POST',
    body: { _links: { workPackage: { href: `${base}/work_packages/${workPackageId}` } } },
  });
}

// Actividades de tiempo permitidas (derivadas del formulario, son por proyecto).
export async function listTimeActivities(workPackageId) {
  const form = await timeEntryForm(workPackageId);
  const sch = form?._embedded?.schema?.activity || {};
  let allowed = sch._embedded?.allowedValues;
  if (!allowed && Array.isArray(sch._links?.allowedValues)) {
    allowed = sch._links.allowedValues.map((l) => ({ name: l.title, _links: { self: { href: l.href } } }));
  }
  return {
    requeridaActividad: !!sch.required,
    actividades: (allowed || []).map((a) => ({ nombre: a.name, href: a._links?.self?.href })),
  };
}

// Lista las entradas de tiempo de un proyecto.
export async function listTimeEntries(projectId, { pageSize = 200 } = {}) {
  const filters = encodeURIComponent(JSON.stringify([{ project: { operator: '=', values: [String(projectId)] } }]));
  const data = await request(`/time_entries?filters=${filters}&pageSize=${pageSize}`);
  return data?._embedded?.elements || [];
}

// Convierte una duración ISO 8601 (PT8H30M) a horas decimales.
export function isoAHoras(iso) {
  const m = /PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?/.exec(iso || '') || [];
  return (Number(m[1]) || 0) + (Number(m[2]) || 0) / 60;
}

// Convierte horas (número, admite decimales) a duración ISO 8601: 2.5 -> "PT2H30M".
function horasAIso(h) {
  if (typeof h === 'string' && h.startsWith('P')) return h;
  const totalMin = Math.round(Number(h) * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `PT${hh}H${mm ? mm + 'M' : ''}`;
}

// Registra tiempo en una tarea. `horas` puede ser número (2, 1.5) o ISO ("PT2H30M").
export async function registrarTiempo({ workPackageId, horas, fecha, comentario, activityHref }) {
  const base = apiPath();
  const body = {
    hours: horasAIso(horas),
    _links: { workPackage: { href: `${base}/work_packages/${workPackageId}` } },
  };
  if (fecha) body.spentOn = fecha;
  if (comentario) body.comment = { raw: comentario };
  if (activityHref) body._links.activity = { href: activityHref };
  return request('/time_entries', { method: 'POST', body });
}

// Crea un nuevo paquete de trabajo. Devuelve el work package creado (con su id).
export async function crearWorkPackage({ projectId, subject, typeHref, parentId, descripcion }) {
  const base = apiPath();
  const body = {
    subject,
    _links: {
      project: { href: `${base}/projects/${projectId}` },
      type: { href: typeHref },
    },
  };
  if (parentId) body._links.parent = { href: `${base}/work_packages/${parentId}` };
  if (descripcion) body.description = { raw: descripcion };
  return request('/work_packages', { method: 'POST', body });
}

export async function getActivities(id) {
  const data = await request(`/work_packages/${id}/activities?pageSize=100`);
  return data?._embedded?.elements || [];
}

// Reemplaza la descripción del work package (campo editable, a diferencia del comentario).
export async function actualizarDescripcion(id, textoMarkdown) {
  const current = await getWorkPackage(id);
  const updated = await request(`/work_packages/${id}`, {
    method: 'PATCH',
    body: { lockVersion: current.lockVersion, description: { raw: textoMarkdown } },
  });
  return simplifyWP(updated);
}

// Actualiza el asunto (título) y/o la descripción de una tarea.
export async function actualizarCampos(id, { subject, descripcion } = {}) {
  const current = await getWorkPackage(id);
  const body = { lockVersion: current.lockVersion };
  if (subject != null) body.subject = subject;
  if (descripcion != null) body.description = { raw: descripcion };
  const updated = await request(`/work_packages/${id}`, { method: 'PATCH', body });
  return simplifyWP(updated);
}

// Edita el texto de un comentario existente (usando el self href de la actividad).
// OJO: al EDITAR, `comment` va como texto plano (al crear va como objeto {raw}).
export async function editarComentario(selfHref, texto) {
  const origin = new URL(config().apiBase).origin;
  const url = selfHref.startsWith('http') ? selfHref : origin + selfHref;
  return request(url, { method: 'PATCH', body: { comment: texto } });
}

// Conserva la descripción existente y le anexa una sección debajo (separada por ---).
export async function agregarADescripcion(id, textoExtra) {
  const current = await getWorkPackage(id);
  const prev = current.description?.raw?.trim() || '';
  const nuevo = prev ? `${prev}\n\n---\n\n${textoExtra}` : textoExtra;
  const updated = await request(`/work_packages/${id}`, {
    method: 'PATCH',
    body: { lockVersion: current.lockVersion, description: { raw: nuevo } },
  });
  return simplifyWP(updated);
}

export async function listStatuses() {
  const data = await request('/statuses?pageSize=200');
  return (data?._embedded?.elements || []).map((s) => ({
    id: s.id,
    nombre: s.name,
    cerrado: s.isClosed,
    ratio: s.defaultDoneRatio,
    href: s._links?.self?.href,
  }));
}

// Valida un cambio SIN guardarlo. Devuelve el schema con qué campos son
// editables (writable) y qué valores se permiten (p. ej. transiciones de estado).
export async function getWorkPackageForm(id, payload = {}) {
  return request(`/work_packages/${id}/form`, { method: 'POST', body: payload });
}

export function simplifyWP(wp) {
  return {
    id: wp.id,
    asunto: wp.subject,
    tipo: wp._links?.type?.title,
    estado: wp._links?.status?.title,
    avance: wp.percentageDone,
    proyecto: wp._links?.project?.title,
    actualizado: wp.updatedAt,
  };
}

// --- Lógica de avance ---
// Esta instancia está en modo "basado en estado": el % de avance lo determina
// el ESTADO de la tarea (no se puede fijar a mano). Por eso "avanzar" = cambiar estado.

function estadosPermitidosDesdeForm(form) {
  const st = form?._embedded?.schema?.status || {};
  let allowed = st._embedded?.allowedValues;
  if (!allowed && Array.isArray(st._links?.allowedValues)) {
    allowed = st._links.allowedValues.map((l) => ({ name: l.title, _links: { self: { href: l.href } } }));
  }
  return (allowed || []).map((s) => ({ name: s.name, href: s._links?.self?.href }));
}

function coincideEstado(estadoObj, consulta) {
  const q = String(consulta).trim().toLowerCase();
  if (estadoObj.name && estadoObj.name.toLowerCase() === q) return true;
  const idEnHref = estadoObj.href?.match(/\/statuses\/(\d+)/)?.[1];
  return Boolean(idEnHref && idEnHref === q);
}

// Agrega un comentario (nota de actividad). OJO: los comentarios NO se pueden
// mandar dentro del PATCH del work package (ahí OpenProject los ignora); van a
// este endpoint dedicado de actividades.
export async function comentar(id, texto) {
  return request(`/work_packages/${id}/activities`, {
    method: 'POST',
    body: { comment: { raw: texto } },
  });
}

// Aplica un avance: cambia el estado (opcional) y/o agrega un comentario (opcional).
// Valida que el estado destino sea una transición permitida. Devuelve la tarea resumida.
export async function aplicarAvance(id, { estado, comentario } = {}) {
  if (!estado && !comentario) {
    throw new Error('Nada que actualizar: indica un estado y/o un comentario.');
  }
  const current = await getWorkPackage(id);

  // 1) Cambio de estado (atributo real del work package) vía PATCH.
  if (estado) {
    const form = await getWorkPackageForm(id, { lockVersion: current.lockVersion });
    const permitidos = estadosPermitidosDesdeForm(form);
    const match = permitidos.find((s) => coincideEstado(s, estado));
    if (!match) {
      const lista = permitidos.map((s) => s.name).join(', ');
      throw new Error(
        `El estado "${estado}" no es válido desde "${current._links?.status?.title}". Permitidos: ${lista}`
      );
    }
    await request(`/work_packages/${id}`, {
      method: 'PATCH',
      body: { lockVersion: current.lockVersion, _links: { status: { href: match.href } } },
    });
  }

  // 2) Comentario al endpoint de actividades (no al PATCH).
  if (comentario) {
    await comentar(id, comentario);
  }

  const updated = await getWorkPackage(id);
  return simplifyWP(updated);
}

// Devuelve los estados a los que la tarea puede cambiar desde su estado actual.
export async function estadosPermitidos(id) {
  const current = await getWorkPackage(id);
  const form = await getWorkPackageForm(id, { lockVersion: current.lockVersion });
  return estadosPermitidosDesdeForm(form);
}
