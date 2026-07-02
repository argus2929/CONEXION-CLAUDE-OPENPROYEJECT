// Ajusta el estado de los "padres" que quedaron en 0% sobre trabajo terminado.
//   node --use-system-ca src/ajustar-fases.js
try { process.loadEnvFile('.env'); } catch {}

import { aplicarAvance, estadosPermitidos } from '../openproject.js';

// Lleva la tarea al mejor estado disponible segÃºn un orden de preferencia.
async function ajustar(id, preferencias, comentario) {
  const permitidos = (await estadosPermitidos(id)).map((s) => s.name.toLowerCase());
  let elegido = preferencias.find((p) => permitidos.includes(p.toLowerCase()));
  if (elegido) return aplicarAvance(id, { estado: elegido, comentario });

  // Si no se puede directo, saltar a In progress y reintentar.
  if (permitidos.includes('in progress')) {
    await aplicarAvance(id, { estado: 'In progress' });
    const permitidos2 = (await estadosPermitidos(id)).map((s) => s.name.toLowerCase());
    elegido = preferencias.find((p) => permitidos2.includes(p.toLowerCase()));
    if (elegido) return aplicarAvance(id, { estado: elegido, comentario });
    return aplicarAvance(id, { comentario }); // quedÃ³ en In progress
  }
  throw new Error(`Sin transiciÃ³n posible. Permitidos: ${permitidos.join(', ')}`);
}

const TAREAS = [
  {
    id: 1148,
    pref: ['Tested', 'In testing', 'Developed'],
    com: 'Fase de construcciÃ³n entregada (~85%): los 10 mÃ³dulos estÃ¡n terminados. Se reserva para uso y ajustes del prÃ³ximo aÃ±o.',
  },
  {
    id: 1149,
    pref: ['Tested', 'In testing', 'Developed', 'Closed'],
    com: 'ConstrucciÃ³n base entregada (Dashboard y mÃ³dulo, ~85%).',
  },
];

for (const t of TAREAS) {
  try {
    const r = await ajustar(t.id, t.pref, t.com);
    console.log(`âœ… #${r.id} â†’ ${r.estado} (${r.avance ?? 0}%)  â€” ${r.asunto}`);
  } catch (e) {
    console.log(`âŒ #${t.id}: ${e.message}`);
  }
}
