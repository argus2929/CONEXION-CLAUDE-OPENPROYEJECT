// Deja las tareas "presentables": descripción detallada + comentario fechado.
//   node --use-system-ca src/presentar-avances.js
// - REESCRIBE descripciones vacías/placeholder.
// - ANEXA (conservando lo existente) en las que ya tienen contenido real.
// - El comentario va al endpoint /activities (el método correcto).
try { process.loadEnvFile('.env'); } catch {}

import { actualizarDescripcion, agregarADescripcion, comentar, getActivities } from './openproject.js';

// --- Descripciones que se REESCRIBEN (estaban vacías o con texto de prueba) ---
const REESCRIBIR = [
  {
    id: 1037,
    descripcion:
      '**Objetivo:** Levantar y documentar los requerimientos funcionales del módulo de Clima Laboral.\n\n' +
      '**Estado: ✅ Completado** — los requerimientos fueron levantados e implementados en su totalidad.\n\n' +
      '### Requerimientos levantados y cubiertos\n' +
      '- **Ciclo anual completo:** abrir → medir → cerrar → recalcular → renovar, conservando histórico.\n' +
      '- **Anonimato garantizado por diseño:** separación de dominios (participación ≠ respuestas), mínimo de muestra, padrón protegido, sin IP ni datos personales.\n' +
      '- **Índice de clima 0–100:** general, por factor y por 6 niveles organizacionales, con clasificación automática (Sobresaliente / Regular / Crítico).\n' +
      '- **Participación real + confiabilidad:** tasa sobre padrón con semáforo de confiabilidad.\n' +
      '- **Acción automática:** planes de acción y objetivos auto-generados para factores débiles.\n' +
      '- **Integración con Humand** para la difusión de encuestas.',
    comentario:
      '📝 Requerimientos levantados e implementados (ciclo anual, anonimato por diseño, índice 0–100, participación + confiabilidad, planes/objetivos, integración Humand). Estado → Closed (100%).',
  },
  {
    id: 1038,
    descripcion:
      '**Objetivo:** Definir el alcance funcional del módulo de Clima Laboral.\n\n' +
      '**Estado: ✅ Completado** — alcance definido e implementado.\n\n' +
      '### Alcance definido\n' +
      '- **Modelo de datos** dedicado (tablas `clima_*`): encuestas, factores, modelos de negocio, campañas, preguntas, sesiones, códigos, respuestas, participaciones, resultados, publicaciones, planes, objetivos, estructura y scope.\n' +
      '- **Administración del período:** abrir / cerrar / nuevo año / reiniciar, con banco de preguntas compartido ("Aplicar a todas").\n' +
      '- **Recolección anónima** pública por código de un solo uso.\n' +
      '- **Analítica:** índice, participación, mapa de calor, rankings.\n' +
      '- **Seguridad:** RBAC por nodo organizacional.\n' +
      '- **Endpoints** públicos (encuestado) y protegidos (administración / análisis).\n' +
      '- **Integración** con Humand.',
    comentario:
      '📝 Alcance funcional definido e implementado (modelo `clima_*`, administración de período, recolección anónima, analítica, RBAC, endpoints, Humand). Estado → Closed (100%).',
  },
  {
    id: 1151,
    descripcion:
      '**Objetivo:** Construir el módulo de Clima Laboral del Dashboard Ejecutivo de Capital Humano.\n\n' +
      '**Estado: ✅ Construido de punta a punta (~85%)** — operativo y listo para usarse el próximo año. Stack: Vue 3 + Vuetify · Laravel.\n\n' +
      '### Componentes entregados\n' +
      '1. **Ciclo de vida anual:** configurar → banco de preguntas → publicar (Humand) → responder (anónimo) → calcular → analizar → actuar → cerrar / renovar.\n' +
      '2. **Recolección anónima:** flujo público con código de un solo uso, vista de códigos proyectable y pantalla de agradecimiento. Anonimato por diseño.\n' +
      '3. **Analítica:** índice 0–100 (general, por factor y por 6 niveles), clasificación automática, participación + confiabilidad, recálculo "lazy" (sin cron obligatorio).\n' +
      '4. **Acción automática:** planes de acción y objetivos auto-generados para factores débiles (idempotentes, editables).\n' +
      '5. **Seguridad:** RBAC por nodo organizacional (`ClimaScopeService`).\n' +
      '6. **Integración con Humand:** publicación por unidad o por marca completa, con registro de cada publicación.\n' +
      '7. **Integración con el sistema:** el índice alimenta el dashboard de inicio de Capital Humano y dispara alertas por umbral.\n' +
      '8. **CLI:** `clima:calcular`, `clima:generar-planes`, `clima:generar-objetivos`.',
    comentario:
      '📝 Módulo construido de punta a punta (~85%): ciclo anual, recolección anónima, analítica, planes/objetivos, RBAC e integración Humand. Estado → Closed.',
  },
  {
    id: 1150,
    descripcion:
      '**Objetivo:** Construir los tableros ejecutivos del módulo de Clima Laboral.\n\n' +
      '**Estado: ✅ Construidos y operativos (~85%).**\n\n' +
      '### Tableros entregados\n' +
      '- **Dashboard (Resumen):** KPIs (índice general, respuestas, planes, objetivos), gráficos por factor y por unidad, filtros por período / unidad / fechas.\n' +
      '- **Vista Ejecutiva:** insights automáticos, **mapa de calor** factores × unidades, **mapa geográfico de México** coloreado por clima, **velocímetro** del índice, **radar de 7 factores** y **ranking** de mejores y peores unidades.\n' +
      '- **Participación en vivo:** respuestas, padrón, tasa %, confiabilidad y alertas (participación < 40 %, unidades sin padrón).\n' +
      '- **Resultados, Planes y Objetivos** con bloqueo de anonimato.\n' +
      '- **Selector de período** global persistente.\n\n' +
      'Además, el índice de clima ya aparece como KPI en el **dashboard de inicio de Capital Humano** y dispara alertas "Clima laboral en riesgo" por umbral.',
    comentario:
      '📝 Tableros ejecutivos operativos (Resumen, Vista Ejecutiva con mapa de calor / mapa de México / radar / rankings, Participación en vivo). Estado → Closed.',
  },
];

// --- Descripciones a las que se ANEXA (conservando el contenido existente) ---
const ANEXAR = [
  {
    id: 1039,
    extra:
      '### ✅ Resultado\n' +
      'Stakeholders identificados. **Administradores del módulo (acceso directo):** Yaralin y Eduardo. ' +
      'Grupos involucrados confirmados: Dirección y Jefas de Capital Humano, Coordinadoras BP, Gerentes de Plaza, Directores, Colaboradores (encuestados) y equipo Integra TI.',
    comentario:
      '📝 Stakeholders identificados: Yaralin y Eduardo (administradores del módulo) + grupos involucrados. Estado → Closed (100%).',
  },
  {
    id: 1036,
    extra:
      '### ✅ Avance — Fase 1 entregada (~85%)\n' +
      'Primera fase del módulo de Clima Laboral: descubrimiento, definición funcional y construcción base, operativa. ' +
      'Incluye el levantamiento de requerimientos (#1037), la definición del alcance funcional (#1038), la identificación de stakeholders (#1039) y la construcción del módulo (#1151) y sus tableros (#1150). Se reservan ajustes para el próximo período de uso.',
    comentario: '📝 Fase 1 entregada (~85%): descubrimiento, definición funcional y construcción base. Estado → Tested (90%).',
  },
  {
    id: 1034,
    extra:
      '### ✅ Sesión realizada\n' +
      'Sesión de seguimiento realizada con **Yaralin** y **Eduardo**, los dos administradores que tendrán acceso al módulo de Clima Laboral.',
    comentario: '📝 Sesión de seguimiento realizada con Yaralin y Eduardo. Estado → Closed (100%).',
  },
  {
    id: 941,
    extra:
      '### Avance\n' +
      'En curso. Se realizó la **primera sesión** de seguimiento (con Yaralin y Eduardo). **Sesión 2 pendiente.**',
    comentario: '📝 Primera sesión de seguimiento realizada (Yaralin y Eduardo). Seguimiento en curso. Estado → In progress (40%).',
  },
];

async function contarComentarios(id) {
  const acts = await getActivities(id);
  return acts.filter((a) => a.comment?.raw?.trim()).length;
}

console.log('Reescribiendo descripciones vacías/placeholder...\n');
for (const t of REESCRIBIR) {
  try {
    await actualizarDescripcion(t.id, t.descripcion);
    await comentar(t.id, t.comentario);
    const n = await contarComentarios(t.id);
    console.log(`✅ #${t.id}  descripción reescrita + comentario (total comentarios: ${n})`);
  } catch (e) {
    console.log(`❌ #${t.id}: ${e.message}`);
  }
}

console.log('\nAnexando avance a descripciones existentes...\n');
for (const t of ANEXAR) {
  try {
    await agregarADescripcion(t.id, t.extra);
    await comentar(t.id, t.comentario);
    const n = await contarComentarios(t.id);
    console.log(`✅ #${t.id}  avance anexado + comentario (total comentarios: ${n})`);
  } catch (e) {
    console.log(`❌ #${t.id}: ${e.message}`);
  }
}

console.log('\nListo.');
