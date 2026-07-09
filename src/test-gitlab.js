// Prueba de conexión a GitLab:  npm run test:git
try { process.loadEnvFile('.env'); } catch {}

import { gitGetMe, gitListProjects } from './gitlab.js';

const me = await gitGetMe();
console.log(`✅ Conectado a GitLab como: ${me.name} (@${me.username})`);

const ps = await gitListProjects();
console.log(`\nProyectos visibles (${ps.length}):`);
for (const p of ps.slice(0, 15)) {
  console.log(`  [${p.id}] ${p.ruta}  (rama principal: ${p.rama_principal ?? '—'})`);
}
