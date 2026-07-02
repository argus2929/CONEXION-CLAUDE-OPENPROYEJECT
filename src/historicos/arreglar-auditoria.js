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
} from '../openproject.js';

const log = (m) => console.log(m);

// --- 1) Reescribir descripciones (sin ~85%, sin tecnicismos, sin redundancia) ---
const DESCRIPCIONES = [
  {
    id: 1036,
    descripcion:
      'Descubrimiento y DefiniciÃ³n Funcional\n\n---\n\n### âœ… Fase 1 entregada\n' +
      'Primera fase del mÃ³dulo de Clima Laboral: se entendiÃ³ la necesidad, se definiÃ³ el alcance, se identificaron los involucrados y se construyÃ³ el mÃ³dulo con sus tableros. Entregada y en uso.',
  },
  {
    id: 1148,
    descripcion:
      '### Fase 2 â€” ConstrucciÃ³n\n' +
      'ConstrucciÃ³n del mÃ³dulo de Clima Laboral y todas sus funcionalidades: configuraciÃ³n de encuestas, anonimato, Ã­ndice de clima, participaciÃ³n, planes y objetivos de mejora, control de acceso, difusiÃ³n y conexiÃ³n con el tablero de Capital Humano.\n\nâœ… Entregada y en uso.',
  },
  {
    id: 1150,
    descripcion:
      'Se construyeron los tableros para consultar los resultados de un vistazo.\n\n' +
      '**Lo que se logrÃ³:**\n' +
      '- Un resumen general con los indicadores principales.\n' +
      '- Una vista ejecutiva con mapa de calor y mapa de MÃ©xico por regiÃ³n.\n' +
      '- GrÃ¡ficas comparativas y rankings de las mejores y peores Ã¡reas.\n' +
      '- Un tablero de participaciÃ³n en vivo.\n\nâœ…',
  },
  {
    id: 1151,
    descripcion:
      'Se construyÃ³ el mÃ³dulo completo de Clima Laboral, listo para usarse.\n\n' +
      '**Lo que se logrÃ³:** un sistema que permite crear y publicar la encuesta, recoger las respuestas de forma totalmente anÃ³nima, calcular el clima de la organizaciÃ³n y mostrar los resultados con planes de mejora automÃ¡ticos. QuedÃ³ operativo y listo para el prÃ³ximo aÃ±o.\n\nâœ…',
  },
  {
    id: 1161,
    descripcion:
      'Se usa Humand **Ãºnicamente para compartir/publicar el post de la encuesta**, ligado a cada unidad de negocio. Cada publicaciÃ³n queda registrada por unidad.\n\nâœ… Terminado.',
  },
];

// #1149: renombrar (quita tecnicismo + espacio final) y descripcion real
const RENOMBRAR = [
  {
    id: 1149,
    subject: 'ConstrucciÃ³n base del mÃ³dulo (plataforma y tableros)',
    descripcion:
      'ConstrucciÃ³n de la base del mÃ³dulo de Clima Laboral: la plataforma y los tableros sobre los que operan las demÃ¡s funcionalidades.\n\nâœ… Entregado.',
  },
];

// --- 2) Editar comentarios que mencionan ~85% ---
const COMENTARIOS = [
  { id: 1036, contiene: '85', nuevo: 'ðŸ“ Primera fase terminada: necesidad entendida, alcance definido, involucrados identificados y mÃ³dulo construido.' },
  { id: 1148, contiene: '85', nuevo: 'Fase de construcciÃ³n entregada: los 10 mÃ³dulos estÃ¡n terminados y en uso.' },
  { id: 1151, contiene: '85', nuevo: 'ðŸ“ MÃ³dulo de Clima Laboral construido y operativo, listo para usarse.' },
  { id: 1149, contiene: '85', nuevo: 'ConstrucciÃ³n base entregada: tablero principal y mÃ³dulo.' },
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
    try { await actualizarCampos(d.id, { descripcion: d.descripcion }); log(`   âœ… #${d.id} descripciÃ³n`); }
    catch (e) { log(`   âŒ #${d.id}: ${e.message}`); }
  }
  for (const r of RENOMBRAR) {
    try { await actualizarCampos(r.id, { subject: r.subject, descripcion: r.descripcion }); log(`   âœ… #${r.id} renombrado â†’ "${r.subject}"`); }
    catch (e) { log(`   âŒ #${r.id}: ${e.message}`); }
  }

  log('2) Comentarios con ~85%...');
  for (const c of COMENTARIOS) {
    try {
      const acts = await getActivities(c.id);
      const act = acts.find((a) => a.comment?.raw?.includes(c.contiene));
      if (!act) { log(`   âš ï¸ #${c.id}: no hallÃ© comentario con "${c.contiene}"`); continue; }
      await editarComentario(act._links?.self?.href, c.nuevo);
      log(`   âœ… #${c.id} comentario editado`);
    } catch (e) { log(`   âŒ #${c.id}: ${e.message}`); }
  }

  log('3) Checklists [ ] -> [x]...');
  for (const id of CHECKLISTS) {
    try {
      const wp = await getWorkPackage(id);
      const raw = wp.description?.raw || '';
      const nuevo = raw.split('[ ]').join('[x]');
      if (nuevo === raw) { log(`   âš ï¸ #${id}: sin casillas`); continue; }
      await actualizarDescripcion(id, nuevo);
      log(`   âœ… #${id} casillas marcadas`);
    } catch (e) { log(`   âŒ #${id}: ${e.message}`); }
  }

  log('4) Comentario de cierre en los 10 mÃ³dulos...');
  for (const id of MODULOS) {
    try { await comentar(id, 'ðŸ“ Entregado y validado.'); log(`   âœ… #${id}`); }
    catch (e) { log(`   âŒ #${id}: ${e.message}`); }
  }

  log('5) Cerrar contenedores al 100%...');
  for (const id of CERRAR) {
    try { const r = await aplicarAvance(id, { estado: 'Closed' }); log(`   âœ… #${r.id} â†’ ${r.estado} (${r.avance ?? 0}%)`); }
    catch (e) { log(`   âŒ #${id}: ${e.message}`); }
  }

  log('\nListo.');
}

run();
