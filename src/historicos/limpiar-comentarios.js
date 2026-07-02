// Reemplaza los comentarios tÃ©cnicos (los que empiezan con ðŸ“) por notas simples.
//   node --use-system-ca src/limpiar-comentarios.js
try { process.loadEnvFile('.env'); } catch {}

import { getActivities, editarComentario } from '../openproject.js';

const NUEVOS = {
  1037: 'ðŸ“ Necesidades del mÃ³dulo levantadas y documentadas. Completado.',
  1038: 'ðŸ“ Alcance del mÃ³dulo definido de principio a fin. Completado.',
  1039: 'ðŸ“ Personas involucradas identificadas: Yaralin y Eduardo (administradores) y las Ã¡reas participantes. Completado.',
  1151: 'ðŸ“ MÃ³dulo de Clima Laboral construido y operativo (~85 %), listo para el prÃ³ximo aÃ±o.',
  1150: 'ðŸ“ Tableros de resultados construidos y funcionando: resumen, vista ejecutiva, mapas y participaciÃ³n.',
  1036: 'ðŸ“ Primera fase terminada (~85 %): necesidad entendida, alcance definido, involucrados identificados y mÃ³dulo construido.',
  1034: 'ðŸ“ SesiÃ³n de seguimiento realizada con Yaralin y Eduardo.',
  941: 'ðŸ“ Primera sesiÃ³n de seguimiento realizada. Seguimiento en curso.',
};

for (const [id, texto] of Object.entries(NUEVOS)) {
  try {
    const acts = await getActivities(Number(id));
    const mio = acts.find((a) => a.comment?.raw?.trim().startsWith('ðŸ“'));
    if (!mio) {
      console.log(`âš ï¸ #${id}: no encontrÃ© el comentario ðŸ“ a editar.`);
      continue;
    }
    await editarComentario(mio._links?.self?.href, texto);
    console.log(`âœ… #${id} comentario actualizado.`);
  } catch (e) {
    console.log(`âŒ #${id}: ${e.message}`);
  }
}
