# Scripts históricos (⚠️ NO re-ejecutar sin revisar)

Scripts de operaciones puntuales **ya ejecutadas** contra la instancia. Se conservan como
referencia de cómo se hizo cada carga, pero tienen **IDs de tareas fijos** de su corrida original:
volver a correrlos duplicaría comentarios o pisaría descripciones.

| Script | Qué hizo (una sola vez) |
|---|---|
| `aplicar-avances.js`, `aplicar-build.js`, `cerrar-build.js` | Cargas iniciales de avances de Clima Laboral |
| `crear-modulos.js` | Creó los 10 módulos de Clima Laboral (#1153–#1162) |
| `ajustar-fases.js`, `rewrite-no-tecnico.js`, `limpiar-comentarios.js` | Reescritura a lenguaje de negocio |
| `arreglar-auditoria.js` | Remediación de los hallazgos de la auditoría |
| `registrar-tiempo.js` | Registro de las 60 h de Clima Laboral |
| `rellenar-nuevos-proyectos.js` | Avances junio 2026 en Soporte y Ubits (#1207–#1213, #844) |
| `crear-tareas-junio.js` | Creó #1219–#1223 (Asistente IA, Tarjetas, Accesos, CRM, Bitácora) |
| `presentar-avances.js`, `dump-desc.js`, `probe-tiempo.js` | Inspección/depuración de esa época |

Para cargas nuevas usa el flujo actual: **`src/aplicar-plan.js`** (plan JSON con vista previa)
o las herramientas MCP desde el chat. Ver `CLAUDE.md` en la raíz.
