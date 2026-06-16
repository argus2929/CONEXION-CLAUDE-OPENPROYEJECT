// Cierra #1151 y #1150 (Closed 100%) con una nota breve. Ya tienen el comentario detallado.
//   node --use-system-ca src/cerrar-build.js
try { process.loadEnvFile('.env'); } catch {}

import { aplicarAvance } from './openproject.js';

const ITEMS = [
  { id: 1151, comentario: 'Cerrada: construcción del módulo terminada (~85%). Se reserva para uso y ajustes del próximo año.' },
  { id: 1150, comentario: 'Cerrada: tableros terminados y operativos (~85%). Se reservan ajustes para el próximo año.' },
];

for (const i of ITEMS) {
  try {
    const r = await aplicarAvance(i.id, { estado: 'Closed', comentario: i.comentario });
    console.log(`✅ #${r.id} → ${r.estado} (${r.avance ?? 0}%)  — ${r.asunto}`);
  } catch (e) {
    console.log(`❌ #${i.id}: ${e.message}`);
  }
}
