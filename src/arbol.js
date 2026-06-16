// Muestra el árbol de paquetes de trabajo del proyecto Clima Laboral (id 37).
//   node --use-system-ca src/arbol.js
try { process.loadEnvFile('.env'); } catch {}

import { projectWorkPackages } from './openproject.js';

const wps = await projectWorkPackages(37);
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

function print(n, depth) {
  console.log('  '.repeat(depth) + `#${n.id} [${n.type}] ${n.subject} — ${n.status} (${n.pct ?? 0}%)`);
  n.children.sort((a, b) => a.id - b.id).forEach((c) => print(c, depth + 1));
}

roots.sort((a, b) => a.id - b.id).forEach((r) => print(r, 0));
console.log(`\nTotal: ${wps.length} paquetes`);
