// Muestra la descripción completa (raw) de cada tarea, para decidir qué preservar.
//   node --use-system-ca src/dump-desc.js
try { process.loadEnvFile('.env'); } catch {}

import { getWorkPackage } from './openproject.js';

const IDS = [1037, 1038, 1039, 1151, 1150, 1036, 1034, 941];

for (const id of IDS) {
  const wp = await getWorkPackage(id);
  console.log(`\n===== #${id} — ${wp.subject} (${wp._links?.status?.title}) =====`);
  console.log(wp.description?.raw?.trim() || '(descripción vacía)');
}
