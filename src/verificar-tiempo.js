// Verifica en vivo el tiempo registrado en el proyecto Clima Laboral (37).
//   node --use-system-ca src/verificar-tiempo.js
try { process.loadEnvFile('.env'); } catch {}

import { listTimeEntries, isoAHoras } from './openproject.js';

const entries = await listTimeEntries(37);
const porDia = {};
let total = 0;
for (const e of entries) {
  const h = isoAHoras(e.hours);
  total += h;
  porDia[e.spentOn] = (porDia[e.spentOn] || 0) + h;
}

console.log(`Entradas de tiempo en Clima Laboral: ${entries.length}`);
console.log(`Total de horas: ${total}\n`);
console.log('Por día:');
for (const dia of Object.keys(porDia).sort()) {
  console.log(`  ${dia}: ${porDia[dia]} h`);
}
