// Cierra los vacíos detectados en Migración Viáticos (jul 2026):
// asigna las tareas nuevas al usuario, pone el proyecto "En curso" y
// actualiza la descripción de la portada.
//   node --use-system-ca src/historicos/cerrar-vacios-viaticos.js
try { process.loadEnvFile('.env'); } catch {}

import { getMe, listProjects, asignarTarea, actualizarProyecto } from '../openproject.js';

const log = (m) => console.log(m);
const NUEVAS = [1266, 1267, 1268, 1269, 1270, 1271, 1272, 1273];

const DESC_PROYECTO = `Proyecto enfocado en la migración del sistema de Viáticos hacia nuevas tecnologías (Vue.js, Laravel y MySQL). El objetivo principal es habilitar que los roles de viajero y supervisor puedan utilizar la plataforma desde dispositivos móviles para crear solicitudes, realizar comprobaciones de gastos, así como llevar a cabo procesos de revisión y supervisión.

**Avance (julio 2026):** el ciclo completo del viático (solicitar → autorizar → comprobar → supervisar → liquidar) ya está construido y probado en la nueva plataforma, junto con la administración, los catálogos y un portal de auditoría que ya está en uso. Pendiente: terminar las pantallas restantes, la salida a producción y el encendido del timbrado fiscal real. El detalle vive en la tarea "Estado general de la migración".`;

const EXPLICACION = 'El ciclo completo del viático ya está construido y probado en la nueva plataforma; el portal de auditoría ya está en uso. En camino a producción (ver la tarea "Estado general de la migración").';

const me = await getMe();
log(`Usuario: ${me.name} (id ${me.id})\n`);

log('1) Asignando las tareas nuevas...');
for (const id of NUEVAS) {
  try {
    const r = await asignarTarea(id, me.id);
    log(`   ✅ #${id} → ${me.name} (${r.asunto})`);
  } catch (e) {
    log(`   ❌ #${id}: ${e.message}`);
  }
}

log('\n2) Portada del proyecto (estado + descripción)...');
try {
  const proj = (await listProjects()).find((p) => p.identifier === 'migracion-viaticos');
  if (!proj) throw new Error('no encontré el proyecto migracion-viaticos');
  await actualizarProyecto(proj.id, {
    estado: 'on_track',
    explicacion: EXPLICACION,
    descripcion: DESC_PROYECTO,
  });
  log(`   ✅ Proyecto [${proj.id}] "${proj.name}" → En curso, descripción actualizada`);
} catch (e) {
  log(`   ❌ Proyecto: ${e.message}`);
}

log('\nListo.');
