// Aplica el lote de avances de Clima Laboral. Ejecuta:
//   node --use-system-ca src/aplicar-avances.js
// Cambia ESTADO (mueve el % automáticamente) y agrega un COMENTARIO detallado.
try { process.loadEnvFile('.env'); } catch {}

import { aplicarAvance } from './openproject.js';

const ACTUALIZACIONES = [
  {
    id: 1037,
    estado: 'Closed',
    comentario:
      '**Levantamiento de requerimientos completado** y validado contra la implementación del módulo de Clima Laboral.\n\n' +
      'Requerimientos cubiertos:\n' +
      '- Ciclo anual completo: abrir → medir → cerrar → recalcular → renovar, conservando histórico.\n' +
      '- Anonimato garantizado por diseño (separación de dominios, mínimo de muestra, padrón protegido, sin IP/dispositivo).\n' +
      '- Índice de clima 0–100 general, por factor y por 6 niveles organizacionales, con clasificación automática.\n' +
      '- Tasa de participación real + semáforo de confiabilidad.\n' +
      '- Generación automática de planes de acción y objetivos para factores débiles.\n' +
      '- Integración con Humand para difusión de encuestas.',
  },
  {
    id: 1038,
    estado: 'Closed',
    comentario:
      '**Alcance funcional definido e implementado.**\n\n' +
      '- **Modelo de datos** dedicado (tablas `clima_*`): encuestas, factores, modelos de negocio, campañas, preguntas, sesiones, códigos, respuestas, participaciones, resultados, publicaciones, planes, objetivos, estructura y scope.\n' +
      '- **Administración** de período (abrir/cerrar/nuevo/reiniciar) y banco de preguntas compartido ("Aplicar a todas").\n' +
      '- **Recolección anónima** pública por código de un solo uso.\n' +
      '- **Analítica:** índice, participación, mapa de calor, rankings.\n' +
      '- **RBAC** por nodo organizacional.\n' +
      '- **Endpoints** públicos (encuestado) y protegidos (admin/análisis).\n' +
      '- **Integración** con Humand.',
  },
  {
    id: 1039,
    estado: 'Closed',
    comentario:
      '**Stakeholders identificados:** Yaralin y Eduardo, los dos administradores que tendrán acceso y operarán el módulo de Clima Laboral.',
  },
  {
    id: 1151,
    estado: 'Tested',
    comentario:
      '**Módulo de Clima Laboral construido de punta a punta** (Vue 3 + Vuetify · Laravel). Quedó al ~85%, operativo y listo para usarse el próximo año.\n\n' +
      'Componentes entregados:\n' +
      '1. **Ciclo de vida anual:** configurar → banco de preguntas → publicar (Humand) → responder (anónimo) → calcular → analizar → actuar → cerrar/renovar.\n' +
      '2. **Recolección anónima:** flujo público con código de un solo uso, vista proyectable de códigos y pantalla de agradecimiento. Anonimato por diseño.\n' +
      '3. **Analítica:** índice 0–100 (general, por factor y por 6 niveles), clasificación automática, participación + confiabilidad, recálculo "lazy" sin cron.\n' +
      '4. **Acción automática:** planes de acción y objetivos auto-generados para factores débiles (idempotentes, editables).\n' +
      '5. **Seguridad:** RBAC por nodo organizacional (`ClimaScopeService`).\n' +
      '6. **Integración Humand:** publicación por unidad o marca completa, con registro de cada publicación.\n' +
      '7. **Novedades:** el índice ya alimenta el dashboard de inicio de Capital Humano y las alertas por umbral.\n' +
      '8. **CLI:** `clima:calcular`, `clima:generar-planes`, `clima:generar-objetivos`.',
  },
  {
    id: 1150,
    estado: 'Tested',
    comentario:
      '**Tableros ejecutivos construidos y operativos.**\n\n' +
      '- **Dashboard (Resumen):** KPIs (índice general, respuestas, planes, objetivos), gráficos por factor y por unidad, filtros por período/unidad/fechas.\n' +
      '- **Vista Ejecutiva:** insights automáticos, **mapa de calor** factores × unidades, **mapa geográfico de México** coloreado por clima, **velocímetro** del índice, **radar de 7 factores** y **ranking** de mejores/peores unidades.\n' +
      '- **Participación en vivo:** respuestas, padrón, tasa %, confiabilidad y alertas (participación < 40 %, unidades sin padrón).\n' +
      '- **Resultados, Planes y Objetivos** con bloqueo de anonimato.\n' +
      '- **Selector de período** global persistente.\n\n' +
      'Además, el índice de clima ya aparece como KPI en el dashboard de inicio de Capital Humano y dispara alertas "Clima laboral en riesgo" por umbral.',
  },
  {
    id: 1036,
    estado: 'Tested',
    comentario:
      'Fase 1 entregada: primera fase del módulo de Clima Laboral, construida y operativa (~85%), reservando ajustes para el próximo período de uso.',
  },
  {
    id: 1034,
    estado: 'Closed',
    comentario:
      '**Sesión de seguimiento realizada** con Yaralin y Eduardo (los dos administradores del módulo). Única sesión de seguimiento del período.',
  },
  {
    id: 941,
    estado: 'In progress',
    comentario:
      'Seguimiento en curso. Primera y única sesión realizada hasta ahora, con Yaralin y Eduardo. (Sesión 2 pendiente / no realizada.)',
  },
];

console.log(`Aplicando ${ACTUALIZACIONES.length} actualizaciones...\n`);
let ok = 0;
for (const u of ACTUALIZACIONES) {
  try {
    const r = await aplicarAvance(u.id, { estado: u.estado, comentario: u.comentario });
    console.log(`✅ #${r.id} → ${r.estado} (${r.avance ?? 0}%)  — ${r.asunto}`);
    ok++;
  } catch (e) {
    console.log(`❌ #${u.id} (${u.estado}): ${e.message}`);
  }
}
console.log(`\nListo: ${ok}/${ACTUALIZACIONES.length} actualizadas. (#1035 Sesión 2 se dejó en New.)`);
