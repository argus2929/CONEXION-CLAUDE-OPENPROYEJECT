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
  listStatuses,
  estadosPermitidos,
  aplicarAvance,
  registrarTiempo,
  listTimeActivities,
} from './openproject.js';

const server = new McpServer({ name: 'openproject', version: '0.1.0' });

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
      'y/o agrega un COMENTARIO de avance a su actividad. Indica al menos uno de los dos.',
    inputSchema: {
      id: z.number().int().describe('ID de la tarea a actualizar.'),
      estado: z
        .string()
        .optional()
        .describe('Nombre o id del nuevo estado, ej. "In progress". Debe ser una transición permitida.'),
      comentario: z.string().optional().describe('Comentario de avance que se agrega a la actividad de la tarea.'),
    },
  },
  async ({ id, estado, comentario }) => {
    const res = await aplicarAvance(id, { estado, comentario });
    return texto(
      `✅ Tarea #${res.id} actualizada.\n` +
        `Estado: ${res.estado}   |   Avance: ${res.avance ?? 0}%\n` +
        `Asunto: ${res.asunto}`
    );
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
