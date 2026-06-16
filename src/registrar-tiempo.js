// Registra ~60 h (semana y media, 9–5) repartidas por tarea y por día hábil.
//   node --use-system-ca src/registrar-tiempo.js
try { process.loadEnvFile('.env'); } catch {}

import { listTimeActivities, registrarTiempo } from './openproject.js';

// horas ponderadas por esfuerzo (suman 60)
const ENTRADAS = [
  { id: 1156, horas: 8, subject: 'Motor de analítica' },
  { id: 1155, horas: 6, subject: 'Recolección anónima de respuestas' },
  { id: 1150, horas: 6, subject: 'Dashboard' },
  { id: 1157, horas: 5, subject: 'Planes de acción y objetivos' },
  { id: 1159, horas: 5, subject: 'Integración con Humand' },
  { id: 1037, horas: 4, subject: 'Levantamiento de Requerimientos' },
  { id: 1153, horas: 4, subject: 'Modelo de datos' },
  { id: 1154, horas: 4, subject: 'Administración de período y banco' },
  { id: 1160, horas: 4, subject: 'Integración dashboard de inicio + alertas' },
  { id: 1162, horas: 4, subject: 'API / Endpoints' },
  { id: 1038, horas: 3, subject: 'Definición del alcance funcional' },
  { id: 1158, horas: 3, subject: 'Seguridad y control de acceso (RBAC)' },
  { id: 1039, horas: 2, subject: 'Identificar stakeholders' },
  { id: 1161, horas: 2, subject: 'Comandos automatizables (CLI)' },
];

// Días hábiles de la última semana y media (todos en el pasado).
const DIAS = ['2026-06-03', '2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'];

// Reparte cada entrada en el día con menos carga (balancea ~7.5 h/día).
const carga = DIAS.map(() => 0);
const orden = [...ENTRADAS].sort((a, b) => b.horas - a.horas);
for (const e of orden) {
  let min = 0;
  for (let i = 1; i < carga.length; i++) if (carga[i] < carga[min]) min = i;
  e.fecha = DIAS[min];
  carga[min] += e.horas;
}

// Actividad "Development".
const { actividades } = await listTimeActivities(1151);
const dev = actividades.find((a) => a.nombre.toLowerCase() === 'development');
if (!dev) {
  console.error('No encontré la actividad "Development". Disponibles:', actividades.map((a) => a.nombre).join(', '));
  process.exit(1);
}

console.log(`Registrando ${ENTRADAS.length} entradas de tiempo (Development)...\n`);
let total = 0;
for (const e of ENTRADAS) {
  try {
    await registrarTiempo({
      workPackageId: e.id,
      horas: e.horas,
      fecha: e.fecha,
      comentario: `Desarrollo: ${e.subject}`,
      activityHref: dev.href,
    });
    console.log(`✅ #${e.id}  ${e.horas} h  (${e.fecha})  — ${e.subject}`);
    total += e.horas;
  } catch (err) {
    console.log(`❌ #${e.id}: ${err.message}`);
  }
}
console.log(`\nTotal registrado: ${total} h en ${DIAS.length} días hábiles.`);
