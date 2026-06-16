// Genera un .md de seguimiento para LLENAR, según el proyecto elegido.
//   node --use-system-ca src/generar-plantilla.js <id-o-identificador>
//   (sin argumento: lista los proyectos disponibles)
try { process.loadEnvFile('.env'); } catch {}

import { writeFileSync } from 'node:fs';
import { listProjects, projectWorkPackages } from './openproject.js';

const arg = process.argv[2];
const projects = await listProjects();

if (!arg) {
  console.log('Uso: node --use-system-ca src/generar-plantilla.js <id-o-identificador>\n');
  console.log('Proyectos disponibles:');
  for (const p of projects) console.log(`  - ${p.id}\t${p.identifier}\t(${p.name})`);
  process.exit(0);
}

const proj = projects.find((p) => String(p.id) === arg || p.identifier === arg);
if (!proj) {
  console.error(`No encontré el proyecto "${arg}". Corre sin argumento para ver la lista.`);
  process.exit(1);
}

const wps = await projectWorkPackages(proj.id);
const byId = new Map();
for (const wp of wps) {
  byId.set(wp.id, {
    id: wp.id,
    subject: wp.subject,
    type: wp._links?.type?.title,
    status: wp._links?.status?.title,
    pct: wp.percentageDone,
    parent: wp._links?.parent?.href ? Number(wp._links.parent.href.match(/\/(\d+)$/)?.[1]) : null,
    children: [],
  });
}
const roots = [];
for (const n of byId.values()) {
  if (n.parent && byId.has(n.parent)) byId.get(n.parent).children.push(n);
  else roots.push(n);
}

const hoy = new Date().toISOString().slice(0, 10);
const L = [];
L.push(`# Seguimiento de avances — ${proj.name}`);
L.push('');
L.push('> Llena solo lo que aplique. Lo que dejes vacío NO se toca.');
L.push('> Escribe en tus palabras (aunque sea técnico): yo lo traduzco a lenguaje de negocio,');
L.push('> te muestro una vista previa y lo subo a OpenProject.');
L.push('>');
L.push('> Cuando termines, dime: **"aplica este seguimiento"**.');
L.push('');
L.push(`**Proyecto:** ${proj.name} (id ${proj.id})  ·  **Fecha:** ${hoy}`);
L.push('');
L.push('**Estados posibles:** New · In progress · Developed · Tested · Closed  _(el % lo pone el estado)_');
L.push('');
L.push('---');
L.push('');
L.push('## Tareas existentes');
L.push('');

function emit(n, ruta) {
  const breadcrumb = ruta.length ? ruta.join(' › ') + ' › ' : 'raíz';
  L.push(`### #${n.id} · ${n.subject}`);
  L.push(`<!-- ${n.type} · estado actual: ${n.status} (${n.pct ?? 0}%) · ubicación: ${breadcrumb} -->`);
  L.push('- Nuevo estado: ');
  L.push('- Horas dedicadas: ');
  L.push('- Qué se hizo: ');
  L.push('- Qué se logró: ');
  L.push('');
  n.children.sort((a, b) => a.id - b.id).forEach((c) => emit(c, [...ruta, n.subject]));
}
roots.sort((a, b) => a.id - b.id).forEach((r) => emit(r, []));

L.push('---');
L.push('');
L.push('## Nuevas tareas / submódulos (opcional)');
L.push('');
L.push('> Duplica este bloque por cada tarea nueva. Borra el bloque si no agregas nada.');
L.push('');
L.push('### Nueva: <título de la tarea>');
L.push('- Padre (id o nombre de la tarea contenedora): ');
L.push('- Tipo: Feature / Task');
L.push('- Estado: ');
L.push('- Horas dedicadas: ');
L.push('- Qué se hizo: ');
L.push('- Qué se logró: ');
L.push('');

const file = `seguimiento-${proj.identifier}.md`;
writeFileSync(file, L.join('\n'), 'utf8');
console.log(`✅ Plantilla generada: ${file}  (${wps.length} tareas del proyecto "${proj.name}")`);
