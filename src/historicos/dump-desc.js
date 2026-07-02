// Muestra la descripciÃ³n completa (raw) de cada tarea, para decidir quÃ© preservar.
//   node --use-system-ca src/dump-desc.js
try { process.loadEnvFile('.env'); } catch {}

import { getWorkPackage } from '../openproject.js';

const IDS = [1037, 1038, 1039, 1151, 1150, 1036, 1034, 941];

for (const id of IDS) {
  const wp = await getWorkPackage(id);
  console.log(`\n===== #${id} â€” ${wp.subject} (${wp._links?.status?.title}) =====`);
  console.log(wp.description?.raw?.trim() || '(descripciÃ³n vacÃ­a)');
}
