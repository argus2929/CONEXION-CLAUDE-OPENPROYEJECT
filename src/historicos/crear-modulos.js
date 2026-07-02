// Crea 10 Features (una por mÃ³dulo) bajo Fase 2 (#1148) y las cierra al 100%.
//   node --use-system-ca src/crear-modulos.js
try { process.loadEnvFile('.env'); } catch {}

import { listTypes, crearWorkPackage, aplicarAvance } from '../openproject.js';

const PROYECTO = 37;
const PADRE = 1148; // Fase 2

const MODULOS = [
  {
    subject: 'Modelo de datos (esquema clima_*)',
    descripcion:
      'Esquema relacional dedicado para Clima Laboral (tablas con prefijo `clima_`).\n\n' +
      '### Tablas\n' +
      '- `clima_encuestas` â€” perÃ­odo/encuesta anual.\n' +
      '- `clima_factores` â€” ejes de mediciÃ³n.\n' +
      '- `clima_modelos_negocio` â€” unidades participantes (cÃ³digo + ventana).\n' +
      '- `clima_campanas` / `clima_campana_preguntas` â€” encuesta por unidad y sus preguntas.\n' +
      '- `clima_sesiones` / `clima_codigos` â€” lotes de aplicaciÃ³n y cÃ³digos de un solo uso.\n' +
      '- `clima_respuestas` / `clima_respuesta_items` â€” respuesta anÃ³nima y valor por pregunta.\n' +
      '- `clima_participaciones` â€” quiÃ©n participÃ³ (sin vÃ­nculo a la respuesta).\n' +
      '- `clima_resultados` â€” Ã­ndices calculados.\n' +
      '- `clima_publicaciones` â€” registro de publicaciones en Humand.\n' +
      '- `clima_planes_accion` / `clima_objetivos` â€” mejora y cumplimiento.\n' +
      '- `clima_estructura` / `clima_user_scope` â€” jerarquÃ­a organizacional y RBAC.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'AdministraciÃ³n de perÃ­odo y banco de preguntas',
    descripcion:
      'GestiÃ³n del ciclo del perÃ­odo y del banco de preguntas compartido (`ClimaPeriodoController`).\n\n' +
      '- Consultar estado y conteos del perÃ­odo.\n' +
      '- Abrir y cerrar el perÃ­odo; al cerrar se dispara recÃ¡lculo + planes + objetivos.\n' +
      '- Nuevo perÃ­odo anual (conserva histÃ³rico) y reiniciar (limpia respuestas, conserva banco).\n' +
      '- Banco de preguntas maestro con propagaciÃ³n a todas las unidades ("Aplicar a todas") en transacciÃ³n segura.\n' +
      '- Tipos de pregunta: escala 1â€“5, opciones Likert (5 niveles) y texto libre.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'RecolecciÃ³n anÃ³nima de respuestas',
    descripcion:
      'Flujo pÃºblico del encuestado, sin login, con anonimato garantizado por diseÃ±o.\n\n' +
      '- Ingreso con cÃ³digo de 6 caracteres (un solo uso, validado en vivo).\n' +
      '- Encuesta multisecciÃ³n con barra de progreso y preguntas obligatorias.\n' +
      '- **Anonimato:** separaciÃ³n de dominios (participaciÃ³n â‰  respuestas), mÃ­nimo de muestra (5), padrÃ³n protegido (Ã—2), sin IP/dispositivo, concurrencia segura (`SELECT FOR UPDATE`).\n' +
      '- Vista de cÃ³digos proyectable (auto-refresco 10 s) y pantalla de agradecimiento.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'Motor de analÃ­tica (Ã­ndice, participaciÃ³n, recÃ¡lculo)',
    descripcion:
      'CÃ¡lculo automÃ¡tico del Ã­ndice de clima y mÃ©tricas.\n\n' +
      '- Ãndice 0â€“100 (escala 1â€“5 â†’ promedio/5Ã—100; opciones â†’ favorables/total; Likert flexible normalizado).\n' +
      '- Tres dimensiones: general, por factor y por 6 niveles jerÃ¡rquicos.\n' +
      '- ClasificaciÃ³n: â‰¥85 Sobresaliente, 70â€“84 Regular, <70 CrÃ­tico.\n' +
      '- ParticipaciÃ³n real + semÃ¡foro de confiabilidad (alta/media/baja/sin_padrÃ³n).\n' +
      '- RecÃ¡lculo "lazy" al abrir reportes (sin cron obligatorio), con locks de cachÃ©.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'Planes de acciÃ³n y objetivos automÃ¡ticos',
    descripcion:
      'Convierte hallazgos en acciones, automÃ¡ticamente.\n\n' +
      '- Planes de acciÃ³n cuando un factor cae bajo el umbral (default 80%): tÃ­tulo, descripciÃ³n con % real y brecha, responsable, fecha compromiso (+30 dÃ­as), estado y avance 0â€“100%. Idempotente y editable.\n' +
      '- Objetivos meta-vs-resultado por factor (cumplimiento = min(100, resultado/metaÃ—100)).\n' +
      '- Se regeneran al cerrar el perÃ­odo o de forma "lazy" al abrir el dashboard.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'Seguridad y control de acceso (RBAC)',
    descripcion:
      'Control de visibilidad por usuario (`ClimaScopeService`).\n\n' +
      '- Administrador General/Master: ve todo.\n' +
      '- Resto: solo los nodos organizacionales asignados (`clima_user_scope`) y sus descendientes.\n' +
      '- El filtro de alcance se aplica de forma consistente en dashboard, resultados, planes, objetivos y participaciÃ³n.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'IntegraciÃ³n con Humand',
    descripcion:
      'DifusiÃ³n de encuestas a travÃ©s de Humand.\n\n' +
      '- Publicar encuesta con selecciÃ³n de audiencia, mensaje editable, notificaciÃ³n push y programaciÃ³n.\n' +
      '- Lanzar marca completa: publica a todas las sucursales reemplazando variables de plantilla (`{{unidad}}`, `{{link}}`).\n' +
      '- Cada publicaciÃ³n queda registrada (`clima_publicaciones`) con post_id, audiencia y segmentaciÃ³n.\n' +
      '- Apunta a un workspace de Humand separado, sin tocar la operaciÃ³n corporativa.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'IntegraciÃ³n: dashboard de inicio + alertas',
    descripcion:
      'ConexiÃ³n del Ã­ndice de clima con el resto de Capital Humano.\n\n' +
      '- El Ã­ndice aparece como KPI en el dashboard de inicio (`/capital-humano/dashboard`): Ã­ndice 0â€“100, clasificaciÃ³n, participaciÃ³n y nÂº de respuestas. Defensivo si no hay datos.\n' +
      '- Alertas inteligentes por umbral: si el Ã­ndice cae bajo el umbral (default 70) se genera la alerta "Clima laboral en riesgo" en la campana del header.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'Comandos automatizables (CLI)',
    descripcion:
      'Comandos de consola para procesos batch.\n\n' +
      '- `clima:calcular [--campana_id=ID]` â€” procesa respuestas â†’ Ã­ndices.\n' +
      '- `clima:generar-planes [--umbral=80] [--nivel_ref_id=ID]` â€” crea planes.\n' +
      '- `clima:generar-objetivos [--meta=80] [--nivel_ref_id=ID]` â€” crea objetivos.\n\n' +
      'TambiÃ©n se ejecutan automÃ¡ticamente (recÃ¡lculo "lazy") al abrir reportes o cerrar el perÃ­odo.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
  {
    subject: 'API / Endpoints',
    descripcion:
      'Endpoints del mÃ³dulo de Clima Laboral.\n\n' +
      '**PÃºblicos (encuestado, sin login):** `GET /clima/publica/{code}`, `GET /clima/modelo/{code}/codigos`, `POST /clima/codigos/{codigo}/iniciar`, `POST /clima/responder-sesion`.\n\n' +
      '**AdministraciÃ³n / anÃ¡lisis (protegidos):** `GET /clima/dashboard`, `/clima/participacion`, `/clima/resultados`, `/clima/planes`, `/clima/objetivos`, `/clima/modelos`, `/clima/banco`, `/clima/periodo/{abrir|cerrar|nuevo|reiniciar}`, `/clima/humand/publicar...`.\n\n' +
      '**Estado: âœ… Implementado.**',
  },
];

const tipos = await listTypes();
const feature = tipos.find((t) => t.nombre.toLowerCase() === 'feature');
if (!feature) {
  console.error('No encontrÃ© el tipo "Feature". Tipos disponibles:', tipos.map((t) => t.nombre).join(', '));
  process.exit(1);
}
console.log(`Tipo Feature: ${feature.href}\nCreando ${MODULOS.length} mÃ³dulos bajo Fase 2 (#${PADRE})...\n`);

for (const m of MODULOS) {
  try {
    const wp = await crearWorkPackage({
      projectId: PROYECTO,
      subject: m.subject,
      typeHref: feature.href,
      parentId: PADRE,
      descripcion: m.descripcion,
    });

    // Cerrar al 100% (con salto intermedio si el flujo no permite Newâ†’Closed directo).
    let estadoFinal;
    try {
      estadoFinal = (await aplicarAvance(wp.id, { estado: 'Closed' })).estado;
    } catch {
      await aplicarAvance(wp.id, { estado: 'In progress' });
      estadoFinal = (await aplicarAvance(wp.id, { estado: 'Closed' })).estado;
    }
    console.log(`âœ… #${wp.id}  ${m.subject} â†’ ${estadoFinal}`);
  } catch (e) {
    console.log(`âŒ ${m.subject}: ${e.message}`);
  }
}
