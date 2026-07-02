// Aplica el lote de avances de Clima Laboral. Ejecuta:
//   node --use-system-ca src/aplicar-avances.js
// Cambia ESTADO (mueve el % automÃ¡ticamente) y agrega un COMENTARIO detallado.
try { process.loadEnvFile('.env'); } catch {}

import { aplicarAvance } from '../openproject.js';

const ACTUALIZACIONES = [
  {
    id: 1037,
    estado: 'Closed',
    comentario:
      '**Levantamiento de requerimientos completado** y validado contra la implementaciÃ³n del mÃ³dulo de Clima Laboral.\n\n' +
      'Requerimientos cubiertos:\n' +
      '- Ciclo anual completo: abrir â†’ medir â†’ cerrar â†’ recalcular â†’ renovar, conservando histÃ³rico.\n' +
      '- Anonimato garantizado por diseÃ±o (separaciÃ³n de dominios, mÃ­nimo de muestra, padrÃ³n protegido, sin IP/dispositivo).\n' +
      '- Ãndice de clima 0â€“100 general, por factor y por 6 niveles organizacionales, con clasificaciÃ³n automÃ¡tica.\n' +
      '- Tasa de participaciÃ³n real + semÃ¡foro de confiabilidad.\n' +
      '- GeneraciÃ³n automÃ¡tica de planes de acciÃ³n y objetivos para factores dÃ©biles.\n' +
      '- IntegraciÃ³n con Humand para difusiÃ³n de encuestas.',
  },
  {
    id: 1038,
    estado: 'Closed',
    comentario:
      '**Alcance funcional definido e implementado.**\n\n' +
      '- **Modelo de datos** dedicado (tablas `clima_*`): encuestas, factores, modelos de negocio, campaÃ±as, preguntas, sesiones, cÃ³digos, respuestas, participaciones, resultados, publicaciones, planes, objetivos, estructura y scope.\n' +
      '- **AdministraciÃ³n** de perÃ­odo (abrir/cerrar/nuevo/reiniciar) y banco de preguntas compartido ("Aplicar a todas").\n' +
      '- **RecolecciÃ³n anÃ³nima** pÃºblica por cÃ³digo de un solo uso.\n' +
      '- **AnalÃ­tica:** Ã­ndice, participaciÃ³n, mapa de calor, rankings.\n' +
      '- **RBAC** por nodo organizacional.\n' +
      '- **Endpoints** pÃºblicos (encuestado) y protegidos (admin/anÃ¡lisis).\n' +
      '- **IntegraciÃ³n** con Humand.',
  },
  {
    id: 1039,
    estado: 'Closed',
    comentario:
      '**Stakeholders identificados:** Yaralin y Eduardo, los dos administradores que tendrÃ¡n acceso y operarÃ¡n el mÃ³dulo de Clima Laboral.',
  },
  {
    id: 1151,
    estado: 'Tested',
    comentario:
      '**MÃ³dulo de Clima Laboral construido de punta a punta** (Vue 3 + Vuetify Â· Laravel). QuedÃ³ al ~85%, operativo y listo para usarse el prÃ³ximo aÃ±o.\n\n' +
      'Componentes entregados:\n' +
      '1. **Ciclo de vida anual:** configurar â†’ banco de preguntas â†’ publicar (Humand) â†’ responder (anÃ³nimo) â†’ calcular â†’ analizar â†’ actuar â†’ cerrar/renovar.\n' +
      '2. **RecolecciÃ³n anÃ³nima:** flujo pÃºblico con cÃ³digo de un solo uso, vista proyectable de cÃ³digos y pantalla de agradecimiento. Anonimato por diseÃ±o.\n' +
      '3. **AnalÃ­tica:** Ã­ndice 0â€“100 (general, por factor y por 6 niveles), clasificaciÃ³n automÃ¡tica, participaciÃ³n + confiabilidad, recÃ¡lculo "lazy" sin cron.\n' +
      '4. **AcciÃ³n automÃ¡tica:** planes de acciÃ³n y objetivos auto-generados para factores dÃ©biles (idempotentes, editables).\n' +
      '5. **Seguridad:** RBAC por nodo organizacional (`ClimaScopeService`).\n' +
      '6. **IntegraciÃ³n Humand:** publicaciÃ³n por unidad o marca completa, con registro de cada publicaciÃ³n.\n' +
      '7. **Novedades:** el Ã­ndice ya alimenta el dashboard de inicio de Capital Humano y las alertas por umbral.\n' +
      '8. **CLI:** `clima:calcular`, `clima:generar-planes`, `clima:generar-objetivos`.',
  },
  {
    id: 1150,
    estado: 'Tested',
    comentario:
      '**Tableros ejecutivos construidos y operativos.**\n\n' +
      '- **Dashboard (Resumen):** KPIs (Ã­ndice general, respuestas, planes, objetivos), grÃ¡ficos por factor y por unidad, filtros por perÃ­odo/unidad/fechas.\n' +
      '- **Vista Ejecutiva:** insights automÃ¡ticos, **mapa de calor** factores Ã— unidades, **mapa geogrÃ¡fico de MÃ©xico** coloreado por clima, **velocÃ­metro** del Ã­ndice, **radar de 7 factores** y **ranking** de mejores/peores unidades.\n' +
      '- **ParticipaciÃ³n en vivo:** respuestas, padrÃ³n, tasa %, confiabilidad y alertas (participaciÃ³n < 40 %, unidades sin padrÃ³n).\n' +
      '- **Resultados, Planes y Objetivos** con bloqueo de anonimato.\n' +
      '- **Selector de perÃ­odo** global persistente.\n\n' +
      'AdemÃ¡s, el Ã­ndice de clima ya aparece como KPI en el dashboard de inicio de Capital Humano y dispara alertas "Clima laboral en riesgo" por umbral.',
  },
  {
    id: 1036,
    estado: 'Tested',
    comentario:
      'Fase 1 entregada: primera fase del mÃ³dulo de Clima Laboral, construida y operativa (~85%), reservando ajustes para el prÃ³ximo perÃ­odo de uso.',
  },
  {
    id: 1034,
    estado: 'Closed',
    comentario:
      '**SesiÃ³n de seguimiento realizada** con Yaralin y Eduardo (los dos administradores del mÃ³dulo). Ãšnica sesiÃ³n de seguimiento del perÃ­odo.',
  },
  {
    id: 941,
    estado: 'In progress',
    comentario:
      'Seguimiento en curso. Primera y Ãºnica sesiÃ³n realizada hasta ahora, con Yaralin y Eduardo. (SesiÃ³n 2 pendiente / no realizada.)',
  },
];

console.log(`Aplicando ${ACTUALIZACIONES.length} actualizaciones...\n`);
let ok = 0;
for (const u of ACTUALIZACIONES) {
  try {
    const r = await aplicarAvance(u.id, { estado: u.estado, comentario: u.comentario });
    console.log(`âœ… #${r.id} â†’ ${r.estado} (${r.avance ?? 0}%)  â€” ${r.asunto}`);
    ok++;
  } catch (e) {
    console.log(`âŒ #${u.id} (${u.estado}): ${e.message}`);
  }
}
console.log(`\nListo: ${ok}/${ACTUALIZACIONES.length} actualizadas. (#1035 SesiÃ³n 2 se dejÃ³ en New.)`);
