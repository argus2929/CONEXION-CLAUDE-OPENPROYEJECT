// Crea 10 Features (una por módulo) bajo Fase 2 (#1148) y las cierra al 100%.
//   node --use-system-ca src/crear-modulos.js
try { process.loadEnvFile('.env'); } catch {}

import { listTypes, crearWorkPackage, aplicarAvance } from './openproject.js';

const PROYECTO = 37;
const PADRE = 1148; // Fase 2

const MODULOS = [
  {
    subject: 'Modelo de datos (esquema clima_*)',
    descripcion:
      'Esquema relacional dedicado para Clima Laboral (tablas con prefijo `clima_`).\n\n' +
      '### Tablas\n' +
      '- `clima_encuestas` — período/encuesta anual.\n' +
      '- `clima_factores` — ejes de medición.\n' +
      '- `clima_modelos_negocio` — unidades participantes (código + ventana).\n' +
      '- `clima_campanas` / `clima_campana_preguntas` — encuesta por unidad y sus preguntas.\n' +
      '- `clima_sesiones` / `clima_codigos` — lotes de aplicación y códigos de un solo uso.\n' +
      '- `clima_respuestas` / `clima_respuesta_items` — respuesta anónima y valor por pregunta.\n' +
      '- `clima_participaciones` — quién participó (sin vínculo a la respuesta).\n' +
      '- `clima_resultados` — índices calculados.\n' +
      '- `clima_publicaciones` — registro de publicaciones en Humand.\n' +
      '- `clima_planes_accion` / `clima_objetivos` — mejora y cumplimiento.\n' +
      '- `clima_estructura` / `clima_user_scope` — jerarquía organizacional y RBAC.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Administración de período y banco de preguntas',
    descripcion:
      'Gestión del ciclo del período y del banco de preguntas compartido (`ClimaPeriodoController`).\n\n' +
      '- Consultar estado y conteos del período.\n' +
      '- Abrir y cerrar el período; al cerrar se dispara recálculo + planes + objetivos.\n' +
      '- Nuevo período anual (conserva histórico) y reiniciar (limpia respuestas, conserva banco).\n' +
      '- Banco de preguntas maestro con propagación a todas las unidades ("Aplicar a todas") en transacción segura.\n' +
      '- Tipos de pregunta: escala 1–5, opciones Likert (5 niveles) y texto libre.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Recolección anónima de respuestas',
    descripcion:
      'Flujo público del encuestado, sin login, con anonimato garantizado por diseño.\n\n' +
      '- Ingreso con código de 6 caracteres (un solo uso, validado en vivo).\n' +
      '- Encuesta multisección con barra de progreso y preguntas obligatorias.\n' +
      '- **Anonimato:** separación de dominios (participación ≠ respuestas), mínimo de muestra (5), padrón protegido (×2), sin IP/dispositivo, concurrencia segura (`SELECT FOR UPDATE`).\n' +
      '- Vista de códigos proyectable (auto-refresco 10 s) y pantalla de agradecimiento.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Motor de analítica (índice, participación, recálculo)',
    descripcion:
      'Cálculo automático del índice de clima y métricas.\n\n' +
      '- Índice 0–100 (escala 1–5 → promedio/5×100; opciones → favorables/total; Likert flexible normalizado).\n' +
      '- Tres dimensiones: general, por factor y por 6 niveles jerárquicos.\n' +
      '- Clasificación: ≥85 Sobresaliente, 70–84 Regular, <70 Crítico.\n' +
      '- Participación real + semáforo de confiabilidad (alta/media/baja/sin_padrón).\n' +
      '- Recálculo "lazy" al abrir reportes (sin cron obligatorio), con locks de caché.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Planes de acción y objetivos automáticos',
    descripcion:
      'Convierte hallazgos en acciones, automáticamente.\n\n' +
      '- Planes de acción cuando un factor cae bajo el umbral (default 80%): título, descripción con % real y brecha, responsable, fecha compromiso (+30 días), estado y avance 0–100%. Idempotente y editable.\n' +
      '- Objetivos meta-vs-resultado por factor (cumplimiento = min(100, resultado/meta×100)).\n' +
      '- Se regeneran al cerrar el período o de forma "lazy" al abrir el dashboard.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Seguridad y control de acceso (RBAC)',
    descripcion:
      'Control de visibilidad por usuario (`ClimaScopeService`).\n\n' +
      '- Administrador General/Master: ve todo.\n' +
      '- Resto: solo los nodos organizacionales asignados (`clima_user_scope`) y sus descendientes.\n' +
      '- El filtro de alcance se aplica de forma consistente en dashboard, resultados, planes, objetivos y participación.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Integración con Humand',
    descripcion:
      'Difusión de encuestas a través de Humand.\n\n' +
      '- Publicar encuesta con selección de audiencia, mensaje editable, notificación push y programación.\n' +
      '- Lanzar marca completa: publica a todas las sucursales reemplazando variables de plantilla (`{{unidad}}`, `{{link}}`).\n' +
      '- Cada publicación queda registrada (`clima_publicaciones`) con post_id, audiencia y segmentación.\n' +
      '- Apunta a un workspace de Humand separado, sin tocar la operación corporativa.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Integración: dashboard de inicio + alertas',
    descripcion:
      'Conexión del índice de clima con el resto de Capital Humano.\n\n' +
      '- El índice aparece como KPI en el dashboard de inicio (`/capital-humano/dashboard`): índice 0–100, clasificación, participación y nº de respuestas. Defensivo si no hay datos.\n' +
      '- Alertas inteligentes por umbral: si el índice cae bajo el umbral (default 70) se genera la alerta "Clima laboral en riesgo" en la campana del header.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'Comandos automatizables (CLI)',
    descripcion:
      'Comandos de consola para procesos batch.\n\n' +
      '- `clima:calcular [--campana_id=ID]` — procesa respuestas → índices.\n' +
      '- `clima:generar-planes [--umbral=80] [--nivel_ref_id=ID]` — crea planes.\n' +
      '- `clima:generar-objetivos [--meta=80] [--nivel_ref_id=ID]` — crea objetivos.\n\n' +
      'También se ejecutan automáticamente (recálculo "lazy") al abrir reportes o cerrar el período.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
  {
    subject: 'API / Endpoints',
    descripcion:
      'Endpoints del módulo de Clima Laboral.\n\n' +
      '**Públicos (encuestado, sin login):** `GET /clima/publica/{code}`, `GET /clima/modelo/{code}/codigos`, `POST /clima/codigos/{codigo}/iniciar`, `POST /clima/responder-sesion`.\n\n' +
      '**Administración / análisis (protegidos):** `GET /clima/dashboard`, `/clima/participacion`, `/clima/resultados`, `/clima/planes`, `/clima/objetivos`, `/clima/modelos`, `/clima/banco`, `/clima/periodo/{abrir|cerrar|nuevo|reiniciar}`, `/clima/humand/publicar...`.\n\n' +
      '**Estado: ✅ Implementado.**',
  },
];

const tipos = await listTypes();
const feature = tipos.find((t) => t.nombre.toLowerCase() === 'feature');
if (!feature) {
  console.error('No encontré el tipo "Feature". Tipos disponibles:', tipos.map((t) => t.nombre).join(', '));
  process.exit(1);
}
console.log(`Tipo Feature: ${feature.href}\nCreando ${MODULOS.length} módulos bajo Fase 2 (#${PADRE})...\n`);

for (const m of MODULOS) {
  try {
    const wp = await crearWorkPackage({
      projectId: PROYECTO,
      subject: m.subject,
      typeHref: feature.href,
      parentId: PADRE,
      descripcion: m.descripcion,
    });

    // Cerrar al 100% (con salto intermedio si el flujo no permite New→Closed directo).
    let estadoFinal;
    try {
      estadoFinal = (await aplicarAvance(wp.id, { estado: 'Closed' })).estado;
    } catch {
      await aplicarAvance(wp.id, { estado: 'In progress' });
      estadoFinal = (await aplicarAvance(wp.id, { estado: 'Closed' })).estado;
    }
    console.log(`✅ #${wp.id}  ${m.subject} → ${estadoFinal}`);
  } catch (e) {
    console.log(`❌ ${m.subject}: ${e.message}`);
  }
}
