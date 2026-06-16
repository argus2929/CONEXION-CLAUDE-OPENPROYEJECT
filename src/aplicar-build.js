// Lleva #1151 y #1150 a ~85% saltando en dos pasos (New -> In progress -> Tested),
// porque su flujo no permite New -> Tested directo. El comentario se pone en el paso final.
//   node --use-system-ca src/aplicar-build.js
try { process.loadEnvFile('.env'); } catch {}

import { aplicarAvance, estadosPermitidos } from './openproject.js';

const PREFERENCIA = ['Tested', 'In testing', 'Developed']; // hacia ~85%, sin cerrar

const OBJETIVOS = [
  {
    id: 1151,
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
    comentario:
      '**Tableros ejecutivos construidos y operativos.**\n\n' +
      '- **Dashboard (Resumen):** KPIs (índice general, respuestas, planes, objetivos), gráficos por factor y por unidad, filtros por período/unidad/fechas.\n' +
      '- **Vista Ejecutiva:** insights automáticos, **mapa de calor** factores × unidades, **mapa geográfico de México** coloreado por clima, **velocímetro** del índice, **radar de 7 factores** y **ranking** de mejores/peores unidades.\n' +
      '- **Participación en vivo:** respuestas, padrón, tasa %, confiabilidad y alertas (participación < 40 %, unidades sin padrón).\n' +
      '- **Resultados, Planes y Objetivos** con bloqueo de anonimato.\n' +
      '- **Selector de período** global persistente.\n\n' +
      'Además, el índice de clima ya aparece como KPI en el dashboard de inicio de Capital Humano y dispara alertas "Clima laboral en riesgo" por umbral.',
  },
];

for (const o of OBJETIVOS) {
  try {
    // Paso 1: a In progress (sin comentario, solo para habilitar el salto).
    await aplicarAvance(o.id, { estado: 'In progress' });

    // Paso 2: elegir el mejor estado permitido hacia ~85%.
    const permitidos = (await estadosPermitidos(o.id)).map((s) => s.name);
    const elegido = PREFERENCIA.find((p) => permitidos.includes(p));

    if (elegido) {
      const r = await aplicarAvance(o.id, { estado: elegido, comentario: o.comentario });
      console.log(`✅ #${r.id} → ${r.estado} (${r.avance ?? 0}%)  — ${r.asunto}`);
    } else {
      const r = await aplicarAvance(o.id, { comentario: o.comentario });
      console.log(
        `⚠️ #${r.id} quedó en ${r.estado} (${r.avance ?? 0}%); el flujo no permitía un estado más alto sin cerrar. ` +
          `Permitidos: ${permitidos.join(', ')}`
      );
    }
  } catch (e) {
    console.log(`❌ #${o.id}: ${e.message}`);
  }
}
