// Remediacion de los hallazgos de la auditoria (coherencia + lenguaje de negocio).
//   node --use-system-ca src/arreglar-auditoria.js
try { process.loadEnvFile('.env'); } catch {}

import {
  getWorkPackage,
  getActivities,
  editarComentario,
  actualizarCampos,
  actualizarDescripcion,
  comentar,
  aplicarAvance,
} from './openproject.js';

const log = (m) => console.log(m);

// --- 1) Reescribir descripciones (sin ~85%, sin tecnicismos, sin redundancia) ---
const DESCRIPCIONES = [
  {
    id: 1036,
    descripcion:
      'Descubrimiento y Definición Funcional\n\n---\n\n### ✅ Fase 1 entregada\n' +
      'Primera fase del módulo de Clima Laboral: se entendió la necesidad, se definió el alcance, se identificaron los involucrados y se construyó el módulo con sus tableros. Entregada y en uso.',
  },
  {
    id: 1148,
    descripcion:
      '### Fase 2 — Construcción\n' +
      'Construcción del módulo de Clima Laboral y todas sus funcionalidades: configuración de encuestas, anonimato, índice de clima, participación, planes y objetivos de mejora, control de acceso, difusión y conexión con el tablero de Capital Humano.\n\n✅ Entregada y en uso.',
  },
  {
    id: 1150,
    descripcion:
      'Se construyeron los tableros para consultar los resultados de un vistazo.\n\n' +
      '**Lo que se logró:**\n' +
      '- Un resumen general con los indicadores principales.\n' +
      '- Una vista ejecutiva con mapa de calor y mapa de México por región.\n' +
      '- Gráficas comparativas y rankings de las mejores y peores áreas.\n' +
      '- Un tablero de participación en vivo.\n\n✅',
  },
  {
    id: 1151,
    descripcion:
      'Se construyó el módulo completo de Clima Laboral, listo para usarse.\n\n' +
      '**Lo que se logró:** un sistema que permite crear y publicar la encuesta, recoger las respuestas de forma totalmente anónima, calcular el clima de la organización y mostrar los resultados con planes de mejora automáticos. Quedó operativo y listo para el próximo año.\n\n✅',
  },
  {
    id: 1161,
    descripcion:
      'Se usa Humand **únicamente para compartir/publicar el post de la encuesta**, ligado a cada unidad de negocio. Cada publicación queda registrada por unidad.\n\n✅ Terminado.',
  },
];

// #1149: renombrar (quita tecnicismo + espacio final) y descripcion real
const RENOMBRAR = [
  {
    id: 1149,
    subject: 'Construcción base del módulo (plataforma y tableros)',
    descripcion:
      'Construcción de la base del módulo de Clima Laboral: la plataforma y los tableros sobre los que operan las demás funcionalidades.\n\n✅ Entregado.',
  },
];

// --- 2) Editar comentarios que mencionan ~85% ---
const COMENTARIOS = [
  { id: 1036, contiene: '85', nuevo: '📝 Primera fase terminada: necesidad entendida, alcance definido, involucrados identificados y módulo construido.' },
  { id: 1148, contiene: '85', nuevo: 'Fase de construcción entregada: los 10 módulos están terminados y en uso.' },
  { id: 1151, contiene: '85', nuevo: '📝 Módulo de Clima Laboral construido y operativo, listo para usarse.' },
  { id: 1149, contiene: '85', nuevo: 'Construcción base entregada: tablero principal y módulo.' },
];

// --- 3) Marcar checklists [ ] -> [x] en tareas cerradas ---
const CHECKLISTS = [1034, 1039];

// --- 4) Comentario de cierre en los 10 modulos ---
const MODULOS = [1153, 1154, 1155, 1156, 1157, 1158, 1159, 1160, 1161, 1162];

// --- 5) Cerrar contenedores al 100% ---
const CERRAR = [1036, 1149, 1148];

async function run() {
  log('1) Descripciones...');
  for (const d of [...DESCRIPCIONES]) {
    try { await actualizarCampos(d.id, { descripcion: d.descripcion }); log(`   ✅ #${d.id} descripción`); }
    catch (e) { log(`   ❌ #${d.id}: ${e.message}`); }
  }
  for (const r of RENOMBRAR) {
    try { await actualizarCampos(r.id, { subject: r.subject, descripcion: r.descripcion }); log(`   ✅ #${r.id} renombrado → "${r.subject}"`); }
    catch (e) { log(`   ❌ #${r.id}: ${e.message}`); }
  }

  log('2) Comentarios con ~85%...');
  for (const c of COMENTARIOS) {
    try {
      const acts = await getActivities(c.id);
      const act = acts.find((a) => a.comment?.raw?.includes(c.contiene));
      if (!act) { log(`   ⚠️ #${c.id}: no hallé comentario con "${c.contiene}"`); continue; }
      await editarComentario(act._links?.self?.href, c.nuevo);
      log(`   ✅ #${c.id} comentario editado`);
    } catch (e) { log(`   ❌ #${c.id}: ${e.message}`); }
  }

  log('3) Checklists [ ] -> [x]...');
  for (const id of CHECKLISTS) {
    try {
      const wp = await getWorkPackage(id);
      const raw = wp.description?.raw || '';
      const nuevo = raw.split('[ ]').join('[x]');
      if (nuevo === raw) { log(`   ⚠️ #${id}: sin casillas`); continue; }
      await actualizarDescripcion(id, nuevo);
      log(`   ✅ #${id} casillas marcadas`);
    } catch (e) { log(`   ❌ #${id}: ${e.message}`); }
  }

  log('4) Comentario de cierre en los 10 módulos...');
  for (const id of MODULOS) {
    try { await comentar(id, '📝 Entregado y validado.'); log(`   ✅ #${id}`); }
    catch (e) { log(`   ❌ #${id}: ${e.message}`); }
  }

  log('5) Cerrar contenedores al 100%...');
  for (const id of CERRAR) {
    try { const r = await aplicarAvance(id, { estado: 'Closed' }); log(`   ✅ #${r.id} → ${r.estado} (${r.avance ?? 0}%)`); }
    catch (e) { log(`   ❌ #${id}: ${e.message}`); }
  }

  log('\nListo.');
}

run();
