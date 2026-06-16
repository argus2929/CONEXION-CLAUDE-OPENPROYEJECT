// Verifica contra el servidor en vivo el estado, % y comentarios de cada tarea.
//   node --use-system-ca src/verificar.js
try { process.loadEnvFile('.env'); } catch {}

import { getWorkPackage, getActivities } from './openproject.js';

const IDS = [1037, 1038, 1039, 1151, 1150, 1036, 1034, 941, 1035];

for (const id of IDS) {
  try {
    const wp = await getWorkPackage(id);
    const acts = await getActivities(id);
    const comentarios = acts.filter((a) => a.comment?.raw?.trim());
    const ultimo = comentarios[comentarios.length - 1];

    console.log(`#${wp.id} — ${wp.subject}`);
    console.log(`   Estado: ${wp._links?.status?.title}  |  Avance: ${wp.percentageDone ?? 0}%  |  comentarios: ${comentarios.length}`);
    const desc = (wp.description?.raw || '(descripción vacía)').replace(/\s+/g, ' ').trim();
    console.log(`   Descripción: ${desc.slice(0, 70)}${desc.length > 70 ? '…' : ''}`);
    if (ultimo) {
      const txt = ultimo.comment.raw.replace(/\s+/g, ' ').trim().slice(0, 100);
      console.log(`   Último comentario: "${txt}…"`);
    }
    console.log('');
  } catch (e) {
    console.log(`#${id} — ❌ ${e.message}\n`);
  }
}
