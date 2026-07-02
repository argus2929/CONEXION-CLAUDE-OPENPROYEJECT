// Lleva #1151 y #1150 a ~85% saltando en dos pasos (New -> In progress -> Tested),
// porque su flujo no permite New -> Tested directo. El comentario se pone en el paso final.
//   node --use-system-ca src/aplicar-build.js
try { process.loadEnvFile('.env'); } catch {}

import { aplicarAvance, estadosPermitidos } from '../openproject.js';

const PREFERENCIA = ['Tested', 'In testing', 'Developed']; // hacia ~85%, sin cerrar

const OBJETIVOS = [
  {
    id: 1151,
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
    comentario:
      '**Tableros ejecutivos construidos y operativos.**\n\n' +
      '- **Dashboard (Resumen):** KPIs (Ã­ndice general, respuestas, planes, objetivos), grÃ¡ficos por factor y por unidad, filtros por perÃ­odo/unidad/fechas.\n' +
      '- **Vista Ejecutiva:** insights automÃ¡ticos, **mapa de calor** factores Ã— unidades, **mapa geogrÃ¡fico de MÃ©xico** coloreado por clima, **velocÃ­metro** del Ã­ndice, **radar de 7 factores** y **ranking** de mejores/peores unidades.\n' +
      '- **ParticipaciÃ³n en vivo:** respuestas, padrÃ³n, tasa %, confiabilidad y alertas (participaciÃ³n < 40 %, unidades sin padrÃ³n).\n' +
      '- **Resultados, Planes y Objetivos** con bloqueo de anonimato.\n' +
      '- **Selector de perÃ­odo** global persistente.\n\n' +
      'AdemÃ¡s, el Ã­ndice de clima ya aparece como KPI en el dashboard de inicio de Capital Humano y dispara alertas "Clima laboral en riesgo" por umbral.',
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
      console.log(`âœ… #${r.id} â†’ ${r.estado} (${r.avance ?? 0}%)  â€” ${r.asunto}`);
    } else {
      const r = await aplicarAvance(o.id, { comentario: o.comentario });
      console.log(
        `âš ï¸ #${r.id} quedÃ³ en ${r.estado} (${r.avance ?? 0}%); el flujo no permitÃ­a un estado mÃ¡s alto sin cerrar. ` +
          `Permitidos: ${permitidos.join(', ')}`
      );
    }
  } catch (e) {
    console.log(`âŒ #${o.id}: ${e.message}`);
  }
}
