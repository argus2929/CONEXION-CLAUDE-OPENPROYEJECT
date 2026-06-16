// Reemplaza los comentarios técnicos (los que empiezan con 📝) por notas simples.
//   node --use-system-ca src/limpiar-comentarios.js
try { process.loadEnvFile('.env'); } catch {}

import { getActivities, editarComentario } from './openproject.js';

const NUEVOS = {
  1037: '📝 Necesidades del módulo levantadas y documentadas. Completado.',
  1038: '📝 Alcance del módulo definido de principio a fin. Completado.',
  1039: '📝 Personas involucradas identificadas: Yaralin y Eduardo (administradores) y las áreas participantes. Completado.',
  1151: '📝 Módulo de Clima Laboral construido y operativo (~85 %), listo para el próximo año.',
  1150: '📝 Tableros de resultados construidos y funcionando: resumen, vista ejecutiva, mapas y participación.',
  1036: '📝 Primera fase terminada (~85 %): necesidad entendida, alcance definido, involucrados identificados y módulo construido.',
  1034: '📝 Sesión de seguimiento realizada con Yaralin y Eduardo.',
  941: '📝 Primera sesión de seguimiento realizada. Seguimiento en curso.',
};

for (const [id, texto] of Object.entries(NUEVOS)) {
  try {
    const acts = await getActivities(Number(id));
    const mio = acts.find((a) => a.comment?.raw?.trim().startsWith('📝'));
    if (!mio) {
      console.log(`⚠️ #${id}: no encontré el comentario 📝 a editar.`);
      continue;
    }
    await editarComentario(mio._links?.self?.href, texto);
    console.log(`✅ #${id} comentario actualizado.`);
  } catch (e) {
    console.log(`❌ #${id}: ${e.message}`);
  }
}
