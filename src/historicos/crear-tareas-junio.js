// Crea las tareas faltantes del documento de junio 2026 (entregables sin tarea
// en OpenProject) y las documenta en lenguaje de negocio.
//   node --use-system-ca src/crear-tareas-junio.js
try { process.loadEnvFile('.env'); } catch {}

import { crearWorkPackage, aplicarAvance, comentar, estadosPermitidos } from '../openproject.js';

const log = (m) => console.log(m);

const CAPITAL_HUMANO = 21;
const CRM = 28;
const FEATURE = '/openproject/api/v3/types/4';

const ORDEN = ['In progress', 'Developed', 'In testing', 'Tested'];

// Lleva una tarea reciÃ©n creada (New) hasta el estado destino, paso a paso,
// saltando los estados que el tipo no permita.
async function avanzarHasta(id, destino) {
  const idxDestino = ORDEN.indexOf(destino);
  for (let i = 0; i <= idxDestino; i++) {
    const objetivo = ORDEN[i];
    try {
      const permitidos = (await estadosPermitidos(id)).map((s) => s.name);
      if (permitidos.includes(objetivo)) {
        await aplicarAvance(id, { estado: objetivo });
      }
    } catch (e) {
      // si un paso intermedio no aplica, seguimos intentando el siguiente
    }
  }
}

const TAREAS = [
  {
    proyecto: CAPITAL_HUMANO,
    subject: 'Asistente IA de Capital Humano',
    estado: 'Tested', // ~90%
    descripcion:
`Asistente conversacional integrado al tablero ejecutivo de Capital Humano.

### âœ… QuÃ© se hizo
Se incorporÃ³ un asistente virtual con el que cualquier usuario autorizado puede preguntar, en lenguaje natural, sobre la informaciÃ³n de Capital Humano y obtener respuestas al instante.

### Lo que se logrÃ³
- Responde preguntas sobre los indicadores clave: personal activo, altas, bajas, rotaciÃ³n, cobertura, vacantes y uso de las plataformas.
- Busca colaboradores y muestra su ficha completa.
- Avisa de alertas cuando algÃºn indicador se sale de lo normal.
- Genera y descarga reportes ejecutivos (PDF o Excel) con un resumen redactado automÃ¡ticamente.
- Respeta niveles de confidencialidad: la informaciÃ³n sensible (sueldos, datos personales) solo se muestra a quien estÃ¡ autorizado; el resto ve Ãºnicamente datos generales.
- El responsable principal puede dar o quitar accesos al asistente desde la propia conversaciÃ³n.

**Pendiente (10%):** asegurar las claves de acceso y afinar el comportamiento en producciÃ³n.`,
    comentario:
'Avance junio 2026: asistente virtual de Capital Humano entregado y funcionando con datos en vivo. Responde indicadores, busca colaboradores, emite alertas y genera reportes ejecutivos, respetando los niveles de confidencialidad. Avance aproximado: 90%.',
  },
  {
    proyecto: CAPITAL_HUMANO,
    subject: 'Tarjetas de dashboard configurables',
    estado: 'In testing', // ~85%
    descripcion:
`Permite definir, desde administraciÃ³n, quÃ© informaciÃ³n muestra cada tablero.

### âœ… QuÃ© se hizo
Se creÃ³ una herramienta para configurar quÃ© tarjetas y secciones aparecen en cada tablero, sin necesidad de programar.

### Lo que se logrÃ³
- Desde "DiseÃ±o de dashboards" se elige quÃ© se muestra en cada vista (Inicio, Ubits, Humand, Fortia, etc.).
- Cada tablero se adapta a lo que cada Ã¡rea necesita ver.

**Pendiente (15%):** ediciÃ³n mÃ¡s fina por perfil de usuario y guardar el orden de las tarjetas.`,
    comentario:
'Junio 2026: herramienta de configuraciÃ³n de tableros entregada. Permite definir quÃ© tarjetas y secciones ve cada tablero desde administraciÃ³n. Avance aproximado: 85%.',
  },
  {
    proyecto: CAPITAL_HUMANO,
    subject: 'Accesos por persona y por mÃ³dulo',
    estado: 'In testing', // ~85%
    descripcion:
`Control de quiÃ©n puede ver y usar cada parte del sistema.

### âœ… QuÃ© se hizo
Se construyÃ³ la administraciÃ³n de accesos que permite habilitar o restringir mÃ³dulos por persona y por perfil.

### Lo que se logrÃ³
- Se define, persona por persona, a quÃ© mÃ³dulos tiene acceso.
- Los tableros nuevos (Ubits, Humand, Fortia) se abren de forma controlada a cada perfil.
- Se reforzÃ³ la seguridad del inicio de sesiÃ³n y el manejo de sesiones.

**Pendiente (15%):** una matriz de permisos por perfil mÃ¡s detallada para los tableros nuevos.`,
    comentario:
'Junio 2026: administraciÃ³n de accesos por persona y por mÃ³dulo entregada, con refuerzo de seguridad en el inicio de sesiÃ³n. Avance aproximado: 85%.',
  },
  {
    proyecto: CRM,
    subject: 'Seguimiento de Vacantes â€” rediseÃ±o (Junio 2026)',
    estado: 'In testing', // ~85%
    descripcion:
`RediseÃ±o completo del seguimiento de vacantes dentro del CRM de Capital Humano.

### âœ… QuÃ© se hizo
Se reorganizÃ³ por completo el seguimiento de vacantes en una vista mÃ¡s clara, Ã¡gil y ordenada, con tarjetas de resumen, filtros y grÃ¡ficas.

### Lo que se logrÃ³
- Vista principal renovada con tarjetas de mÃ©tricas y filtros por departamento, gerente y responsable.
- Captura mÃ¡s Ã¡gil de la informaciÃ³n de cada vacante.
- Vista especial para gerentes, con la jerarquÃ­a de su equipo y sus propias grÃ¡ficas.
- Registro automÃ¡tico de los cambios (auditorÃ­a) sobre cada vacante.
- Las vacantes se actualizan de forma automÃ¡tica.

**Pendiente (15%):** terminar casos especiales por gerente y depurar datos en producciÃ³n.`,
    comentario:
'Junio 2026: rediseÃ±o del seguimiento de vacantes entregado â€” vista renovada, filtros, vista de gerente, auditorÃ­a de cambios y sincronizaciÃ³n automÃ¡tica. Fue el mÃ³dulo mÃ¡s grande del mes. Avance aproximado: 85%.',
  },
  {
    proyecto: CRM,
    subject: 'BitÃ¡cora de Acciones',
    estado: 'In testing', // ~85%
    descripcion:
`Registro de acciones y seguimiento sobre cada vacante.

### âœ… QuÃ© se hizo
Se creÃ³ una bitÃ¡cora donde queda registrada cada acciÃ³n y seguimiento que se realiza sobre las vacantes.

### Lo que se logrÃ³
- Pantalla dedicada para registrar y consultar las acciones tomadas sobre cada vacante.
- Cada registro queda guardado con su historial para dar trazabilidad.
- Organizada segÃºn la estructura de la organizaciÃ³n (quiÃ©n depende de quiÃ©n).

**Pendiente (15%):** filtros avanzados y exportaciÃ³n de la bitÃ¡cora.`,
    comentario:
'Junio 2026: bitÃ¡cora de acciones del CRM entregada. Registra y da trazabilidad a cada seguimiento sobre las vacantes. Avance aproximado: 85%.',
  },
];

async function run() {
  const creadas = [];
  for (const t of TAREAS) {
    try {
      log(`\nâ–¶ Creando "${t.subject}" (proyecto ${t.proyecto})...`);
      const wp = await crearWorkPackage({
        projectId: t.proyecto,
        subject: t.subject,
        typeHref: FEATURE,
        descripcion: t.descripcion,
      });
      const id = wp.id;
      log(`   âœ… creada #${id}`);
      await avanzarHasta(id, t.estado);
      const permitidos = await estadosPermitidos(id); // refresca
      await comentar(id, t.comentario);
      log(`   âœ… comentario agregado`);
      creadas.push({ id, subject: t.subject, estadoDeseado: t.estado });
    } catch (e) {
      log(`   âŒ ${t.subject}: ${e.message}`);
    }
  }

  log('\n=== RESUMEN ===');
  for (const c of creadas) {
    log(`  #${c.id} â€” ${c.subject} (objetivo: ${c.estadoDeseado})`);
  }
  log('\nâœ… Listo.');
}

run();
