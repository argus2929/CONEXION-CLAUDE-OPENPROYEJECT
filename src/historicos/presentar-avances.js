// Deja las tareas "presentables": descripciÃ³n detallada + comentario fechado.
//   node --use-system-ca src/presentar-avances.js
// - REESCRIBE descripciones vacÃ­as/placeholder.
// - ANEXA (conservando lo existente) en las que ya tienen contenido real.
// - El comentario va al endpoint /activities (el mÃ©todo correcto).
try { process.loadEnvFile('.env'); } catch {}

import { actualizarDescripcion, agregarADescripcion, comentar, getActivities } from '../openproject.js';

// --- Descripciones que se REESCRIBEN (estaban vacÃ­as o con texto de prueba) ---
const REESCRIBIR = [
  {
    id: 1037,
    descripcion:
      '**Objetivo:** Levantar y documentar los requerimientos funcionales del mÃ³dulo de Clima Laboral.\n\n' +
      '**Estado: âœ… Completado** â€” los requerimientos fueron levantados e implementados en su totalidad.\n\n' +
      '### Requerimientos levantados y cubiertos\n' +
      '- **Ciclo anual completo:** abrir â†’ medir â†’ cerrar â†’ recalcular â†’ renovar, conservando histÃ³rico.\n' +
      '- **Anonimato garantizado por diseÃ±o:** separaciÃ³n de dominios (participaciÃ³n â‰  respuestas), mÃ­nimo de muestra, padrÃ³n protegido, sin IP ni datos personales.\n' +
      '- **Ãndice de clima 0â€“100:** general, por factor y por 6 niveles organizacionales, con clasificaciÃ³n automÃ¡tica (Sobresaliente / Regular / CrÃ­tico).\n' +
      '- **ParticipaciÃ³n real + confiabilidad:** tasa sobre padrÃ³n con semÃ¡foro de confiabilidad.\n' +
      '- **AcciÃ³n automÃ¡tica:** planes de acciÃ³n y objetivos auto-generados para factores dÃ©biles.\n' +
      '- **IntegraciÃ³n con Humand** para la difusiÃ³n de encuestas.',
    comentario:
      'ðŸ“ Requerimientos levantados e implementados (ciclo anual, anonimato por diseÃ±o, Ã­ndice 0â€“100, participaciÃ³n + confiabilidad, planes/objetivos, integraciÃ³n Humand). Estado â†’ Closed (100%).',
  },
  {
    id: 1038,
    descripcion:
      '**Objetivo:** Definir el alcance funcional del mÃ³dulo de Clima Laboral.\n\n' +
      '**Estado: âœ… Completado** â€” alcance definido e implementado.\n\n' +
      '### Alcance definido\n' +
      '- **Modelo de datos** dedicado (tablas `clima_*`): encuestas, factores, modelos de negocio, campaÃ±as, preguntas, sesiones, cÃ³digos, respuestas, participaciones, resultados, publicaciones, planes, objetivos, estructura y scope.\n' +
      '- **AdministraciÃ³n del perÃ­odo:** abrir / cerrar / nuevo aÃ±o / reiniciar, con banco de preguntas compartido ("Aplicar a todas").\n' +
      '- **RecolecciÃ³n anÃ³nima** pÃºblica por cÃ³digo de un solo uso.\n' +
      '- **AnalÃ­tica:** Ã­ndice, participaciÃ³n, mapa de calor, rankings.\n' +
      '- **Seguridad:** RBAC por nodo organizacional.\n' +
      '- **Endpoints** pÃºblicos (encuestado) y protegidos (administraciÃ³n / anÃ¡lisis).\n' +
      '- **IntegraciÃ³n** con Humand.',
    comentario:
      'ðŸ“ Alcance funcional definido e implementado (modelo `clima_*`, administraciÃ³n de perÃ­odo, recolecciÃ³n anÃ³nima, analÃ­tica, RBAC, endpoints, Humand). Estado â†’ Closed (100%).',
  },
  {
    id: 1151,
    descripcion:
      '**Objetivo:** Construir el mÃ³dulo de Clima Laboral del Dashboard Ejecutivo de Capital Humano.\n\n' +
      '**Estado: âœ… Construido de punta a punta (~85%)** â€” operativo y listo para usarse el prÃ³ximo aÃ±o. Stack: Vue 3 + Vuetify Â· Laravel.\n\n' +
      '### Componentes entregados\n' +
      '1. **Ciclo de vida anual:** configurar â†’ banco de preguntas â†’ publicar (Humand) â†’ responder (anÃ³nimo) â†’ calcular â†’ analizar â†’ actuar â†’ cerrar / renovar.\n' +
      '2. **RecolecciÃ³n anÃ³nima:** flujo pÃºblico con cÃ³digo de un solo uso, vista de cÃ³digos proyectable y pantalla de agradecimiento. Anonimato por diseÃ±o.\n' +
      '3. **AnalÃ­tica:** Ã­ndice 0â€“100 (general, por factor y por 6 niveles), clasificaciÃ³n automÃ¡tica, participaciÃ³n + confiabilidad, recÃ¡lculo "lazy" (sin cron obligatorio).\n' +
      '4. **AcciÃ³n automÃ¡tica:** planes de acciÃ³n y objetivos auto-generados para factores dÃ©biles (idempotentes, editables).\n' +
      '5. **Seguridad:** RBAC por nodo organizacional (`ClimaScopeService`).\n' +
      '6. **IntegraciÃ³n con Humand:** publicaciÃ³n por unidad o por marca completa, con registro de cada publicaciÃ³n.\n' +
      '7. **IntegraciÃ³n con el sistema:** el Ã­ndice alimenta el dashboard de inicio de Capital Humano y dispara alertas por umbral.\n' +
      '8. **CLI:** `clima:calcular`, `clima:generar-planes`, `clima:generar-objetivos`.',
    comentario:
      'ðŸ“ MÃ³dulo construido de punta a punta (~85%): ciclo anual, recolecciÃ³n anÃ³nima, analÃ­tica, planes/objetivos, RBAC e integraciÃ³n Humand. Estado â†’ Closed.',
  },
  {
    id: 1150,
    descripcion:
      '**Objetivo:** Construir los tableros ejecutivos del mÃ³dulo de Clima Laboral.\n\n' +
      '**Estado: âœ… Construidos y operativos (~85%).**\n\n' +
      '### Tableros entregados\n' +
      '- **Dashboard (Resumen):** KPIs (Ã­ndice general, respuestas, planes, objetivos), grÃ¡ficos por factor y por unidad, filtros por perÃ­odo / unidad / fechas.\n' +
      '- **Vista Ejecutiva:** insights automÃ¡ticos, **mapa de calor** factores Ã— unidades, **mapa geogrÃ¡fico de MÃ©xico** coloreado por clima, **velocÃ­metro** del Ã­ndice, **radar de 7 factores** y **ranking** de mejores y peores unidades.\n' +
      '- **ParticipaciÃ³n en vivo:** respuestas, padrÃ³n, tasa %, confiabilidad y alertas (participaciÃ³n < 40 %, unidades sin padrÃ³n).\n' +
      '- **Resultados, Planes y Objetivos** con bloqueo de anonimato.\n' +
      '- **Selector de perÃ­odo** global persistente.\n\n' +
      'AdemÃ¡s, el Ã­ndice de clima ya aparece como KPI en el **dashboard de inicio de Capital Humano** y dispara alertas "Clima laboral en riesgo" por umbral.',
    comentario:
      'ðŸ“ Tableros ejecutivos operativos (Resumen, Vista Ejecutiva con mapa de calor / mapa de MÃ©xico / radar / rankings, ParticipaciÃ³n en vivo). Estado â†’ Closed.',
  },
];

// --- Descripciones a las que se ANEXA (conservando el contenido existente) ---
const ANEXAR = [
  {
    id: 1039,
    extra:
      '### âœ… Resultado\n' +
      'Stakeholders identificados. **Administradores del mÃ³dulo (acceso directo):** Yaralin y Eduardo. ' +
      'Grupos involucrados confirmados: DirecciÃ³n y Jefas de Capital Humano, Coordinadoras BP, Gerentes de Plaza, Directores, Colaboradores (encuestados) y equipo Integra TI.',
    comentario:
      'ðŸ“ Stakeholders identificados: Yaralin y Eduardo (administradores del mÃ³dulo) + grupos involucrados. Estado â†’ Closed (100%).',
  },
  {
    id: 1036,
    extra:
      '### âœ… Avance â€” Fase 1 entregada (~85%)\n' +
      'Primera fase del mÃ³dulo de Clima Laboral: descubrimiento, definiciÃ³n funcional y construcciÃ³n base, operativa. ' +
      'Incluye el levantamiento de requerimientos (#1037), la definiciÃ³n del alcance funcional (#1038), la identificaciÃ³n de stakeholders (#1039) y la construcciÃ³n del mÃ³dulo (#1151) y sus tableros (#1150). Se reservan ajustes para el prÃ³ximo perÃ­odo de uso.',
    comentario: 'ðŸ“ Fase 1 entregada (~85%): descubrimiento, definiciÃ³n funcional y construcciÃ³n base. Estado â†’ Tested (90%).',
  },
  {
    id: 1034,
    extra:
      '### âœ… SesiÃ³n realizada\n' +
      'SesiÃ³n de seguimiento realizada con **Yaralin** y **Eduardo**, los dos administradores que tendrÃ¡n acceso al mÃ³dulo de Clima Laboral.',
    comentario: 'ðŸ“ SesiÃ³n de seguimiento realizada con Yaralin y Eduardo. Estado â†’ Closed (100%).',
  },
  {
    id: 941,
    extra:
      '### Avance\n' +
      'En curso. Se realizÃ³ la **primera sesiÃ³n** de seguimiento (con Yaralin y Eduardo). **SesiÃ³n 2 pendiente.**',
    comentario: 'ðŸ“ Primera sesiÃ³n de seguimiento realizada (Yaralin y Eduardo). Seguimiento en curso. Estado â†’ In progress (40%).',
  },
];

async function contarComentarios(id) {
  const acts = await getActivities(id);
  return acts.filter((a) => a.comment?.raw?.trim()).length;
}

console.log('Reescribiendo descripciones vacÃ­as/placeholder...\n');
for (const t of REESCRIBIR) {
  try {
    await actualizarDescripcion(t.id, t.descripcion);
    await comentar(t.id, t.comentario);
    const n = await contarComentarios(t.id);
    console.log(`âœ… #${t.id}  descripciÃ³n reescrita + comentario (total comentarios: ${n})`);
  } catch (e) {
    console.log(`âŒ #${t.id}: ${e.message}`);
  }
}

console.log('\nAnexando avance a descripciones existentes...\n');
for (const t of ANEXAR) {
  try {
    await agregarADescripcion(t.id, t.extra);
    await comentar(t.id, t.comentario);
    const n = await contarComentarios(t.id);
    console.log(`âœ… #${t.id}  avance anexado + comentario (total comentarios: ${n})`);
  } catch (e) {
    console.log(`âŒ #${t.id}: ${e.message}`);
  }
}

console.log('\nListo.');
