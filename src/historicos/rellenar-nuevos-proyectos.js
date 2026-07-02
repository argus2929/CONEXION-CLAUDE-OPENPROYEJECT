// Rellena los proyectos Soporte y Alerta Training Ubits con avances de junio 2026.
// node --use-system-ca src/rellenar-nuevos-proyectos.js
try { process.loadEnvFile('.env'); } catch {}

import { actualizarCampos, actualizarDescripcion, aplicarAvance, comentar } from '../openproject.js';

const log = (m) => console.log(m);

// â”€â”€ SOPORTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SOPORTE_FASE1_DESC = `Primera fase del mÃ³dulo de Soporte integrado al Tablero Ejecutivo de Capital Humano (junio 2026).

### âœ… QuÃ© se hizo
Se construyÃ³ la infraestructura de soporte y monitoreo del sistema: alertas automÃ¡ticas, bÃºsqueda de colaboradores, fichas individuales, canal de atenciÃ³n y renovaciÃ³n visual completa de la plataforma.

### Lo que se logrÃ³
- El sistema avisa de forma automÃ¡tica cuando un indicador clave supera los umbrales establecidos (rotaciÃ³n, cobertura, adopciÃ³n de plataformas).
- Cualquier usuario puede buscar a un colaborador desde cualquier mÃ³dulo y ver su perfil completo con datos de todas las fuentes.
- El canal de soporte quedÃ³ construido y configurado, listo para conectarse al medio de comunicaciÃ³n que defina el Ã¡rea.
- La plataforma se renovÃ³ visualmente y ya funciona de forma correcta en computadora, tableta y celular.

**Pendiente:** afinar los niveles de alerta y conectar el canal de soporte a un medio externo real.`;

const SOPORTE_MEJORAS_DESC = `RenovaciÃ³n visual y adaptaciÃ³n del sistema para todos los dispositivos.

### âœ… QuÃ© se hizo
Se rediseÃ±Ã³ completamente la interfaz del tablero ejecutivo: desde la pantalla de inicio de sesiÃ³n hasta cada una de las tablas y grÃ¡ficas del sistema.

### Lo que se logrÃ³
- DiseÃ±o renovado, consistente y profesional en todo el sistema.
- El tablero funciona correctamente en computadora, tableta y celular.
- Cada tabla cuenta ahora con barra de herramientas propia: bÃºsqueda, selecciÃ³n de columnas y exportaciÃ³n (Excel, CSV, PDF).
- Las pantallas de acceso (inicio de sesiÃ³n, registro, recuperaciÃ³n) se rediseÃ±aron con imagen unificada.
- Los nÃºmeros en los indicadores tienen animaciÃ³n suave para que los cambios sean fÃ¡ciles de percibir.

**Pendiente:** ajustes finos en tamaÃ±os de pantalla intermedios (tableta).`;

const SOPORTE_MANT_DESC = `Herramientas de soporte operativo integradas al tablero de Capital Humano.

### âœ… QuÃ© se hizo
Se construyeron las funciones de soporte que permiten al equipo administrador monitorear y atender la plataforma sin salir del tablero.

### Lo que se logrÃ³
- Sistema de alertas visible en el encabezado: notifica cuando algÃºn indicador supera el umbral definido.
- BÃºsqueda de colaboradores disponible desde cualquier secciÃ³n.
- Ficha 360 por colaborador con informaciÃ³n de todas las plataformas integradas en una sola vista.
- Canal de soporte configurado y listo para conectarse al medio de atenciÃ³n que defina el Ã¡rea.

**Pendiente:** definir el canal de atenciÃ³n externo y afinar los umbrales de alerta.`;

// â”€â”€ ALERTA TRAINING UBITS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const UBITS_EPIC_DESC = `Mantenimiento y mejoras del mÃ³dulo de CapacitaciÃ³n (Ubits) en el Tablero Ejecutivo.

### âœ… QuÃ© se hizo
Se construyÃ³ el tablero de resumen de Ubits con sus indicadores de capacitaciÃ³n, y se mantiene seguimiento sobre las incidencias de datos identificadas en la plataforma.

### Lo que se logrÃ³
- Tablero de capacitaciÃ³n disponible en el sistema con indicadores de uso de la plataforma Ubits.
- Acceso controlado: visible Ãºnicamente para el perfil Master; se puede abrir a otros roles desde la configuraciÃ³n de accesos.
- El hallazgo de inconsistencias en los datos de la API queda bajo seguimiento activo.

**Pendiente:** apertura progresiva a mÃ¡s roles y validaciÃ³n final de datos contra el entorno de producciÃ³n.`;

const UBITS_MANT_DESC = `Tablero de CapacitaciÃ³n â€” Ubits

### âœ… QuÃ© se hizo
Se construyÃ³ el tablero de resumen de la plataforma de capacitaciÃ³n Ubits, con sus secciones de cursos, avance y participaciÃ³n.

### Lo que se logrÃ³
- Vista de indicadores de capacitaciÃ³n con datos de activos, inactivos y avance por unidad de negocio.
- InformaciÃ³n tomada directamente de la plataforma Ubits.
- Acceso disponible para el perfil Master; se abre a otros perfiles desde la administraciÃ³n de accesos.

**Pendiente:** validaciÃ³n de datos en producciÃ³n y apertura progresiva a mÃ¡s perfiles de usuario.`;

async function run() {
  log('=== SOPORTE ===\n');

  log('1) #1207 Fase 1 â€” descripciÃ³n + estado...');
  try {
    await actualizarDescripcion(1207, SOPORTE_FASE1_DESC);
    log('   âœ… descripciÃ³n');
    const r = await aplicarAvance(1207, { estado: 'In testing' });
    log(`   âœ… estado â†’ ${r.estado} (${r.avance ?? 0}%)`);
    await comentar(1207, 'Avance junio 2026: primera fase entregada â€” alertas, bÃºsqueda de colaboradores, canal de soporte y renovaciÃ³n visual del sistema. Cobertura global aproximada: 85%.');
    log('   âœ… comentario');
  } catch (e) { log(`   âŒ ${e.message}`); }

  log('2) #1210 Mejoras visuales â€” descripciÃ³n + estado...');
  try {
    await actualizarDescripcion(1210, SOPORTE_MEJORAS_DESC);
    log('   âœ… descripciÃ³n');
    const r = await aplicarAvance(1210, { estado: 'In progress' });
    log(`   âœ… estado â†’ ${r.estado} (${r.avance ?? 0}%)`);
    await comentar(1210, 'Junio 2026: renovaciÃ³n visual completa entregada. El sistema funciona en computadora, tableta y celular. Pendiente solo afinar algunos tamaÃ±os intermedios. Avance aproximado: 90%.');
    log('   âœ… comentario');
  } catch (e) { log(`   âŒ ${e.message}`); }

  log('3) #1211 Mantenimiento / Soporte â€” descripciÃ³n + estado...');
  try {
    await actualizarDescripcion(1211, SOPORTE_MANT_DESC);
    log('   âœ… descripciÃ³n');
    const r = await aplicarAvance(1211, { estado: 'In progress' });
    log(`   âœ… estado â†’ ${r.estado} (${r.avance ?? 0}%)`);
    await comentar(1211, 'Junio 2026: alertas automÃ¡ticas, bÃºsqueda de colaboradores y ficha 360 construidos y funcionando. Canal de soporte configurado, pendiente de conectar a canal externo. Avance aproximado: 80%.');
    log('   âœ… comentario');
  } catch (e) { log(`   âŒ ${e.message}`); }

  log('\n=== ALERTA TRAINING UBITS ===\n');

  log('4) #844 Incidencias en la API â€” comentario + estado...');
  try {
    const r = await aplicarAvance(844, { estado: 'In progress' });
    log(`   âœ… estado â†’ ${r.estado} (${r.avance ?? 0}%)`);
    await comentar(844, 'Junio 2026: se construyÃ³ el tablero de Ubits que consume los datos de la plataforma. Se identificÃ³ que en el ambiente local algunos campos no coinciden con producciÃ³n (fecha de Ãºltimo acceso, cumpleaÃ±os, antigÃ¼edad, estado). La validaciÃ³n final se realizarÃ¡ directamente en el entorno de producciÃ³n. Incidencia en seguimiento activo.');
    log('   âœ… comentario');
  } catch (e) { log(`   âŒ ${e.message}`); }

  log('5) #1212 Mantenimiento / Soporte (Epic) â€” descripciÃ³n + estado...');
  try {
    await actualizarDescripcion(1212, UBITS_EPIC_DESC);
    log('   âœ… descripciÃ³n');
    const r = await aplicarAvance(1212, { estado: 'In testing' });
    log(`   âœ… estado â†’ ${r.estado} (${r.avance ?? 0}%)`);
    await comentar(1212, 'Junio 2026: tablero de capacitaciÃ³n Ubits entregado. Acceso habilitado para perfil Master. Pendiente: validaciÃ³n en producciÃ³n y apertura a otros perfiles. Avance aproximado: 80%.');
    log('   âœ… comentario');
  } catch (e) { log(`   âŒ ${e.message}`); }

  log('6) #1213 Mantenimiento â€” descripciÃ³n + estado...');
  try {
    await actualizarDescripcion(1213, UBITS_MANT_DESC);
    log('   âœ… descripciÃ³n');
    const r = await aplicarAvance(1213, { estado: 'In progress' });
    log(`   âœ… estado â†’ ${r.estado} (${r.avance ?? 0}%)`);
    await comentar(1213, 'Junio 2026: tablero de resumen de Ubits construido con indicadores de cursos y participaciÃ³n por unidad de negocio. Pendiente validaciÃ³n en producciÃ³n.');
    log('   âœ… comentario');
  } catch (e) { log(`   âŒ ${e.message}`); }

  log('\nâœ… Listo.');
}

run();
