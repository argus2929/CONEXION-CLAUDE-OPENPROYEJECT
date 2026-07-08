// Servidor MCP para OpenProject. Lo lanza Claude Code (transporte stdio).
// Expone herramientas para leer tareas y actualizar avances (estado + comentario).
//
// IMPORTANTE: en stdio, stdout es el canal del protocolo. Nunca usar console.log
// (eso corrompería la comunicación). Para depurar usar console.error (stderr).

import path from 'node:path';

// Cargar el .env relativo a este archivo (el cwd al lanzarse puede variar).
try {
  process.loadEnvFile(path.join(import.meta.dirname, '..', '.env'));
} catch {
  console.error('[openproject-mcp] Aviso: no se pudo cargar .env');
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  listProjects,
  myWorkPackages,
  getWorkPackage,
  projectWorkPackages,
  listStatuses,
  estadosPermitidos,
  aplicarAvance,
  avanzarHastaEstado,
  registrarTiempo,
  listTimeActivities,
  buscarTareas,
  resolverProyecto,
  resolverTipo,
  crearWorkPackage,
  actualizarDescripcion,
  agregarADescripcion,
  actualizarCampos,
  comentar,
} from './openproject.js';

const server = new McpServer({ name: 'openproject', version: '0.2.0' });

const texto = (s) => ({ content: [{ type: 'text', text: s }] });

// Registra una herramienta capturando errores y devolviéndolos como texto legible.
function tool(name, config, handler) {
  server.registerTool(name, config, async (args, extra) => {
    try {
      return await handler(args, extra);
    } catch (e) {
      return { content: [{ type: 'text', text: '❌ Error: ' + e.message }], isError: true };
    }
  });
}

tool(
  'op_listar_tareas',
  {
    title: 'Listar mis tareas',
    description:
      'Lista las tareas (paquetes de trabajo) asignadas a ti en OpenProject, con su estado y % de avance.',
    inputSchema: { solo_abiertas: z.boolean().default(true).describe('Si es true, solo tareas abiertas (no cerradas).') },
  },
  async ({ solo_abiertas }) => {
    const wps = await myWorkPackages({ onlyOpen: solo_abiertas });
    if (!wps.length) return texto('No tienes tareas' + (solo_abiertas ? ' abiertas' : '') + '.');
    const filas = wps.map((w) => `#${w.id} [${w.avance ?? 0}%] ${w.estado} — ${w.asunto} (${w.proyecto})`);
    return texto(`Tienes ${wps.length} tarea(s):\n` + filas.join('\n'));
  }
);

tool(
  'op_ver_tarea',
  {
    title: 'Ver detalle de una tarea',
    description:
      'Muestra el detalle de una tarea por su ID: asunto, estado, % de avance, descripción y a qué estados puede cambiar.',
    inputSchema: { id: z.number().int().describe('ID de la tarea (work package).') },
  },
  async ({ id }) => {
    const wp = await getWorkPackage(id);
    const permitidos = await estadosPermitidos(id).catch(() => []);
    const desc = wp.description?.raw?.trim() || '(sin descripción)';
    const lineas = [
      `#${wp.id} — ${wp.subject}`,
      `Estado: ${wp._links?.status?.title}   |   Avance: ${wp.percentageDone ?? 0}%`,
      `Tipo: ${wp._links?.type?.title}   |   Proyecto: ${wp._links?.project?.title}`,
      `Asignado a: ${wp._links?.assignee?.title || '—'}`,
      '',
      'Descripción:',
      desc,
    ];
    if (permitidos.length) lineas.push('', 'Puede cambiar a: ' + permitidos.map((s) => s.name).join(', '));
    return texto(lineas.join('\n'));
  }
);

tool(
  'op_listar_estados',
  {
    title: 'Listar estados y su % de avance',
    description:
      'Lista los estados disponibles y el % de avance que representa cada uno. En esta instancia el % lo determina el estado de la tarea.',
    inputSchema: {},
  },
  async () => {
    const estados = await listStatuses();
    const filas = estados.map(
      (s) => `${s.nombre} → ${s.ratio == null ? '—' : s.ratio + '%'}${s.cerrado ? ' (cierra la tarea)' : ''}`
    );
    return texto('Estados y su % de avance:\n' + filas.join('\n'));
  }
);

tool(
  'op_listar_proyectos',
  {
    title: 'Listar proyectos',
    description: 'Lista los proyectos visibles para ti en OpenProject.',
    inputSchema: {},
  },
  async () => {
    const ps = await listProjects();
    if (!ps.length) return texto('No hay proyectos visibles.');
    return texto('Proyectos:\n' + ps.map((p) => `[${p.id}] ${p.name} (${p.identifier})`).join('\n'));
  }
);

tool(
  'op_actualizar_tarea',
  {
    title: 'Actualizar avance de una tarea',
    description:
      'ESCRITURA en OpenProject. Actualiza una tarea: cambia su ESTADO (lo que mueve el % de avance automáticamente) ' +
      'y/o agrega un COMENTARIO de avance a su actividad. Si el salto de estado no está permitido de forma directa, ' +
      'avanza por los estados intermedios automáticamente. Indica al menos uno de los dos.',
    inputSchema: {
      id: z.number().int().describe('ID de la tarea a actualizar.'),
      estado: z
        .string()
        .optional()
        .describe('Nombre del nuevo estado, ej. "In progress", "Tested", "Closed".'),
      comentario: z.string().optional().describe('Comentario de avance que se agrega a la actividad de la tarea.'),
    },
  },
  async ({ id, estado, comentario }) => {
    const res = estado
      ? await avanzarHastaEstado(id, estado, { comentario })
      : await aplicarAvance(id, { comentario });
    const ruta = res.camino?.length > 1 ? `\nRuta seguida: ${res.camino.join(' → ')}` : '';
    return texto(
      `✅ Tarea #${res.id} actualizada.\n` +
        `Estado: ${res.estado}   |   Avance: ${res.avance ?? 0}%\n` +
        `Asunto: ${res.asunto}` +
        ruta
    );
  }
);

tool(
  'op_tareas_proyecto',
  {
    title: 'Listar tareas de un proyecto',
    description:
      'Lista TODAS las tareas de un proyecto (no solo las tuyas) en forma de árbol, con estado y % de avance. ' +
      'Útil para mapear un documento de avances contra las tareas existentes antes de actualizar o crear.',
    inputSchema: {
      proyecto: z.string().describe('Id, identificador o nombre del proyecto, ej. "21", "clima-laboral", "Soporte".'),
    },
  },
  async ({ proyecto }) => {
    const proj = await resolverProyecto(proyecto);
    if (!proj) return texto(`❌ No encontré el proyecto "${proyecto}". Usa op_listar_proyectos para ver los disponibles.`);
    const wps = await projectWorkPackages(proj.id);
    if (!wps.length) return texto(`El proyecto "${proj.name}" no tiene tareas.`);

    const porId = new Map(wps.map((wp) => [wp.id, wp]));
    const hijos = new Map();
    const raices = [];
    for (const wp of wps) {
      const padre = Number(wp._links?.parent?.href?.match(/\/(\d+)$/)?.[1]) || null;
      if (padre && porId.has(padre)) {
        if (!hijos.has(padre)) hijos.set(padre, []);
        hijos.get(padre).push(wp);
      } else raices.push(wp);
    }
    const filas = [];
    const emitir = (wp, nivel) => {
      const sangria = '  '.repeat(nivel);
      filas.push(
        `${sangria}#${wp.id} [${wp.percentageDone ?? 0}%] ${wp._links?.status?.title} — ${wp.subject} (${wp._links?.type?.title})`
      );
      (hijos.get(wp.id) || []).sort((a, b) => a.id - b.id).forEach((h) => emitir(h, nivel + 1));
    };
    raices.sort((a, b) => a.id - b.id).forEach((r) => emitir(r, 0));
    return texto(`Tareas de "${proj.name}" (${wps.length}):\n` + filas.join('\n'));
  }
);

tool(
  'op_buscar_tareas',
  {
    title: 'Buscar tareas por texto',
    description:
      'Busca tareas cuyo título contenga el texto indicado, en toda la instancia o dentro de un proyecto. ' +
      'Útil para encontrar la tarea correcta antes de actualizarla o para evitar crear duplicados.',
    inputSchema: {
      texto: z.string().describe('Texto a buscar en el título de las tareas.'),
      proyecto: z.string().optional().describe('Opcional: id, identificador o nombre del proyecto donde buscar.'),
    },
  },
  async ({ texto: q, proyecto }) => {
    let projectId;
    if (proyecto) {
      const proj = await resolverProyecto(proyecto);
      if (!proj) return texto(`❌ No encontré el proyecto "${proyecto}".`);
      projectId = proj.id;
    }
    const wps = await buscarTareas(q, { projectId });
    if (!wps.length) return texto(`Sin resultados para "${q}".`);
    const filas = wps.map((w) => `#${w.id} [${w.avance ?? 0}%] ${w.estado} — ${w.asunto} (${w.proyecto})`);
    return texto(`${wps.length} resultado(s) para "${q}":\n` + filas.join('\n'));
  }
);

tool(
  'op_crear_tarea',
  {
    title: 'Crear una tarea nueva',
    description:
      'ESCRITURA en OpenProject. Crea una tarea (work package) en un proyecto, con descripción en lenguaje de negocio. ' +
      'Opcionalmente la cuelga de una tarea padre, la lleva a un estado inicial y le agrega un comentario de avance. ' +
      'Antes de crear, considera usar op_buscar_tareas para no duplicar.',
    inputSchema: {
      proyecto: z.string().describe('Id, identificador o nombre del proyecto destino.'),
      titulo: z.string().describe('Título de la tarea (claro y sin tecnicismos).'),
      tipo: z
        .string()
        .default('Feature')
        .describe('Tipo de tarea: Feature (funcionalidad), Task, Epic, Bug, Support... Default: Feature.'),
      padre_id: z.number().int().optional().describe('Opcional: ID de la tarea contenedora (padre).'),
      descripcion: z.string().optional().describe('Descripción en markdown, formato "Qué se hizo / Lo que se logró / Pendiente".'),
      estado: z.string().optional().describe('Opcional: estado inicial, ej. "In progress" o "Tested". Avanza por pasos si hace falta.'),
      comentario: z.string().optional().describe('Opcional: comentario de avance inicial.'),
    },
  },
  async ({ proyecto, titulo, tipo, padre_id, descripcion, estado, comentario }) => {
    const proj = await resolverProyecto(proyecto);
    if (!proj) return texto(`❌ No encontré el proyecto "${proyecto}". Usa op_listar_proyectos.`);
    const t = await resolverTipo(tipo);
    if (!t) return texto(`❌ No existe el tipo "${tipo}". Tipos comunes: Feature, Task, Epic, Bug, Support.`);

    const wp = await crearWorkPackage({
      projectId: proj.id,
      subject: titulo,
      typeHref: t.href,
      parentId: padre_id,
      descripcion,
    });
    let resumen = `✅ Tarea #${wp.id} creada en "${proj.name}": ${titulo} (${t.nombre})`;
    // La tarea YA existe: si el estado/comentario fallan, hay que reportar el id
    // igualmente (si no, el cliente reintenta y crea un duplicado).
    try {
      if (estado) {
        const res = await avanzarHastaEstado(wp.id, estado, { comentario });
        resumen += `\nEstado: ${res.estado} (${res.avance ?? 0}%)`;
        if (res.camino?.length > 1) resumen += `   ·   Ruta: ${res.camino.join(' → ')}`;
      } else if (comentario) {
        await comentar(wp.id, comentario);
        resumen += '\nComentario agregado.';
      }
    } catch (e) {
      resumen += `\n⚠️ La tarea quedó creada, pero no se pudo completar estado/comentario: ${e.message}\n` +
        `NO la vuelvas a crear: usa op_actualizar_tarea sobre #${wp.id}.`;
    }
    return texto(resumen);
  }
);

tool(
  'op_editar_descripcion',
  {
    title: 'Editar la descripción de una tarea',
    description:
      'ESCRITURA en OpenProject. Reemplaza la descripción de una tarea, o agrega una sección al final ' +
      '(modo "agregar", separada con ---). Redacta siempre en lenguaje de negocio.',
    inputSchema: {
      id: z.number().int().describe('ID de la tarea.'),
      descripcion: z.string().describe('Texto markdown de la descripción.'),
      modo: z
        .enum(['reemplazar', 'agregar'])
        .default('reemplazar')
        .describe('"reemplazar" sustituye toda la descripción; "agregar" anexa una sección al final.'),
    },
  },
  async ({ id, descripcion, modo }) => {
    const res =
      modo === 'agregar' ? await agregarADescripcion(id, descripcion) : await actualizarDescripcion(id, descripcion);
    return texto(`✅ Descripción de #${res.id} ${modo === 'agregar' ? 'ampliada' : 'reemplazada'}.\nAsunto: ${res.asunto}`);
  }
);

tool(
  'op_renombrar_tarea',
  {
    title: 'Renombrar una tarea',
    description: 'ESCRITURA en OpenProject. Cambia el título (asunto) de una tarea.',
    inputSchema: {
      id: z.number().int().describe('ID de la tarea.'),
      titulo: z.string().describe('Nuevo título.'),
    },
  },
  async ({ id, titulo }) => {
    const res = await actualizarCampos(id, { subject: titulo });
    return texto(`✅ Tarea #${res.id} renombrada a: "${res.asunto}"`);
  }
);

tool(
  'op_registrar_tiempo',
  {
    title: 'Registrar tiempo en una tarea',
    description:
      'ESCRITURA en OpenProject. Registra horas trabajadas (time entry) en una tarea. ' +
      'Por defecto usa la actividad "Development" y la fecha de hoy.',
    inputSchema: {
      id: z.number().int().describe('ID de la tarea.'),
      horas: z.number().describe('Horas trabajadas (admite decimales, ej. 2.5).'),
      fecha: z.string().optional().describe('Fecha en formato YYYY-MM-DD. Por defecto, hoy.'),
      comentario: z.string().optional().describe('Nota opcional del registro de tiempo.'),
    },
  },
  async ({ id, horas, fecha, comentario }) => {
    const { actividades } = await listTimeActivities(id);
    const dev = actividades.find((a) => a.nombre.toLowerCase() === 'development');
    await registrarTiempo({ workPackageId: id, horas, fecha, comentario, activityHref: dev?.href });
    return texto(`✅ Registradas ${horas} h en la tarea #${id}${fecha ? ` (${fecha})` : ''}.`);
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[openproject-mcp] Servidor MCP listo.');
