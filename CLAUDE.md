# CLAUDE.md — Flujo de avances hacia OpenProject

Este proyecto conecta Claude Code con OpenProject (instancia `wmsqa.alerta.com.mx/openproject`).
Tu trabajo aquí: **recibir avances de un programador (normalmente un `.md` o una ruta a uno)
y dejarlos perfectamente documentados en OpenProject**, en lenguaje de negocio.

## FLUJO PRINCIPAL — cuando te pasen un `.md` de avances (o su ruta)

Sigue estos pasos EN ORDEN. No te saltes la entrevista ni la vista previa.

### 1. Lee y entiende
- Lee el `.md` completo. Identifica cada entregable/avance, su % o estado, fechas y horas si vienen.
- Detecta el alcance: ¿qué proyectos de OpenProject toca? (usa `op_listar_proyectos`).

### 2. Mapea contra OpenProject
- Por cada proyecto implicado: `op_tareas_proyecto` para ver el árbol real.
- Por cada avance decide: ¿actualiza una **tarea existente** o requiere una **tarea nueva**?
- Antes de crear, usa `op_buscar_tareas` para no duplicar.
- ⚠️ NO toques tareas que ya tienen contenido propio con otro formato (checklists del jefe,
  nombres de personas, fórmulas) sin confirmarlo con el usuario.

### 3. ENTREVISTA (obligatoria) — que no queden huecos
Antes de mostrar la vista previa, revisa qué falta para dejar cada tarea COMPLETA:
estado destino, horas trabajadas, fechas, "qué se logró", y qué queda pendiente.
**Haz 2–4 preguntas concretas con AskUserQuestion** (no más; agrupa lo que puedas). Típicas:
- "¿A qué estado llevo X? (In progress 40% / In testing 80% / Tested 90% / Closed 100%)"
- "¿Cuántas horas le dedicaste a X y en qué fechas, para registrar el tiempo?"
- "El documento no dice qué quedó pendiente en X, ¿qué falta para el 100%?"
- "¿En qué proyecto cuelgo la tarea nueva Y?"
Si el documento ya trae todo, di explícitamente que no hizo falta preguntar nada.

### 4. Traduce a lenguaje de negocio (regla dura)
NUNCA subas tecnicismos: ni nombres de archivos, clases, tablas, endpoints, commits, ramas ni librerías.

| ❌ Técnico | ✅ Negocio |
|---|---|
| "Se creó `AsistenteController.php` (542 líneas)" | "Se incorporó un asistente virtual que responde preguntas sobre la información de Capital Humano" |
| "Migración `add_bot_acceso_total_to_users`" | "Ahora se puede autorizar, persona por persona, quién tiene acceso completo" |
| "Cron agendado 06:30 en Kernel" | "La información se actualiza sola cada mañana" |

Formato de descripción: título breve + `### ✅ Qué se hizo` + `### Lo que se logró` (viñetas) + `**Pendiente:**`.
Formato de comentario: `"<Mes> <año>: <resumen en 1-3 frases>. Avance aproximado: N%."`

### 5. Vista previa (obligatoria)
Muestra una tabla: tarea (# o "NUEVA") → proyecto → acción → estado destino → resumen del texto.
**Espera la confirmación del usuario antes de escribir nada.**

### 6. Aplica
- Con las herramientas MCP (`op_actualizar_tarea`, `op_crear_tarea`, `op_editar_descripcion`,
  `op_renombrar_tarea`, `op_registrar_tiempo`), o
- Para lotes grandes: genera un `plan-*.json` y córrelo con
  `npm run plan -- plan.json` (vista previa) → `npm run plan -- plan.json --aplicar`.
  El formato del plan está documentado en `src/aplicar-plan.js`.

### 7. Verifica y reporta
Relee las tareas tocadas y muestra la tabla final (estado y % reales). Reporta cualquier fallo tal cual.

## Reglas del dominio (no negociables)

1. **El % lo determina el ESTADO** (`percentageDone` es de solo lectura):
   `New 0` · `In specification 10` · `Specified/Confirmed/Scheduled 20` · `In progress 40`
   · `Developed 70` · `In testing 80` · `Tested 90` · `Closed 100`.
2. **Los saltos de estado dependen del tipo** de tarea. `op_actualizar_tarea` y
   `avanzarHastaEstado()` ya avanzan por pasos intermedios automáticamente.
3. **Todo comando node lleva `--use-system-ca`** (certificado corporativo). Sin él: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
4. Los **padres NO se recalculan solos**: si cierras todos los hijos, cierra el padre a mano.
5. Comentarios: crear = `POST /activities` con `{comment:{raw}}`; editar = `{comment:"texto"}` plano.
6. El **token vive solo en `.env`** (gitignored). Jamás lo escribas en archivos versionados ni en OpenProject.

## Mapa rápido del repo

- `src/openproject.js` — conector API REST v3 (núcleo, sin dependencias).
- `src/mcp-server.js` — servidor MCP (11 herramientas). Registrado en `.mcp.json`.
- `src/aplicar-plan.js` — ejecuta planes JSON con vista previa (`npm run plan`).
- `src/generar-plantilla.js` — plantilla de seguimiento por proyecto (`npm run plantilla`).
- `src/historicos/` — scripts de operaciones ya ejecutadas (IDs fijos; NO re-correr sin revisar).
- `npm run test:conn` — prueba de conexión. `npm run smoke:mcp` — prueba del MCP.
