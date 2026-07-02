// Muestra las actividades de tiempo disponibles en la instancia.
//   node --use-system-ca src/probe-tiempo.js
try { process.loadEnvFile('.env'); } catch {}

import { listTimeActivities } from '../openproject.js';

const { requeridaActividad, actividades } = await listTimeActivities(1151);
console.log(`Â¿Actividad obligatoria?: ${requeridaActividad ? 'SÃ' : 'no'}\n`);
if (!actividades.length) {
  console.log('No se encontraron actividades de tiempo.');
} else {
  console.log('Actividades de tiempo disponibles:');
  for (const a of actividades) console.log(`  - ${a.nombre}  ->  ${a.href}`);
}
