# OpenProject ⇄ Claude Code

Sistema para alimentar el avance de tareas en OpenProject conversando con Claude Code.
**Le pasas tu markdown de avances (o la ruta del archivo), Claude lo entiende, te hace un
par de preguntas para completar lo que falte, te muestra la vista previa y lo sube.**

## El flujo (así de simple)

```
Tú:      aquí están mis avances → C:\...\MIS-AVANCES.md
Claude:  (lee el md, revisa los proyectos y tareas en OpenProject)
Claude:  ¿A qué estado llevo X? ¿Cuántas horas le metiste a Y? ...   ← entrevista corta
Claude:  [vista previa: qué tarea se toca, qué estado queda, qué texto se sube]
Tú:      dale
Claude:  ✅ sube todo y te muestra la verificación final
```

El detalle de este flujo vive en [CLAUDE.md](CLAUDE.md) (Claude lo sigue automáticamente
en cada sesión dentro de esta carpeta).

## Estado actual

- [x] Conector con la API REST v3 de OpenProject (`src/openproject.js`)
- [x] Probador de conexión (`npm run test:conn`)
- [x] Servidor MCP con **11 herramientas** (`src/mcp-server.js`)
- [x] Flujo "pásame tu MD" con entrevista + vista previa (ver [CLAUDE.md](CLAUDE.md))
- [x] Motor de planes: `npm run plan -- plan.json` (vista previa) → `--aplicar`
- [x] Flujo de plantilla: `npm run plantilla` → llenar → vista previa → subir
- [x] Registro de tiempo (horas) en tareas
- [x] Crear tareas, editar descripciones y renombrar desde el chat
- [x] Avance de estado con saltos automáticos (New → … → Tested sin fallar)

> ¿Vas a adaptar esto a tu propia instancia? Lee **[AKZEL-GUIA.md](AKZEL-GUIA.md)**.

## Cómo usarlo en Claude Code

El servidor MCP se registra en `.mcp.json`. Para activarlo:

1. **Reinicia Claude Code** (cierra y abre la sesión) para que cargue `.mcp.json`.
2. Cuando pregunte, **aprueba** el servidor `openproject`.
3. Ya puedes pedirle a Claude cosas como:
   - "aquí están mis avances: `C:\ruta\a\MIS-AVANCES.md`" ← **el flujo principal**
   - "lista mis tareas de OpenProject"
   - "muéstrame las tareas del proyecto Soporte"
   - "pon la tarea 1037 en Developed con el comentario: terminé el levantamiento"
   - "crea una tarea 'Asistente IA' en Capital Humano y documéntala con esto: …"

### Herramientas disponibles (16)

| Herramienta | Qué hace |
|---|---|
| `op_listar_tareas` | Tus tareas asignadas con estado y % |
| `op_ver_tarea` | Detalle de una tarea + estados a los que puede cambiar |
| `op_tareas_proyecto` | Árbol completo de tareas de un proyecto (para mapear avances) |
| `op_buscar_tareas` | Busca tareas por texto (evita duplicados) |
| `op_listar_estados` | Estados y el % que representa cada uno |
| `op_listar_proyectos` | Proyectos visibles |
| `op_actualizar_tarea` | **(escritura)** cambia estado (con saltos automáticos) y/o comenta |
| `op_crear_tarea` | **(escritura)** crea tarea con descripción, padre, estado y comentario |
| `op_editar_descripcion` | **(escritura)** reemplaza o amplía la descripción |
| `op_renombrar_tarea` | **(escritura)** cambia el título |
| `op_registrar_tiempo` | **(escritura)** registra horas trabajadas (actividad Development por defecto) |
| `git_listar_proyectos` | Proyectos de GitLab donde eres miembro |
| `git_ramas` | Ramas de un proyecto (detecta la convención `op-<id>`) |
| `git_merge_requests` | Merge requests (el "filtro extra") por estado |
| `git_crear_rama` | **(escritura)** crea la rama `op-<id>-<slug>` de una tarea |
| `op_git_triangulo` | Cruce OpenProject ⇄ GitLab: situación git de cada tarea + sugerencias |

## 🔺 El triángulo: local ⇄ GitLab ⇄ OpenProject

Cada tarea se trabaja en **su propia rama** (`op-<id-tarea>-<slug>`). GitLab es el **filtro
extra** (merge request = revisión) y el **merge a la rama principal es el filtro final**: lo
fusionado es lo que "ya está bien". OpenProject refleja esa realidad:

| Situación en git | Estado sugerido en OpenProject |
|---|---|
| Rama creada, sin MR | In progress (40%) |
| Merge request abierto | In testing (80%) |
| MR fusionado a la principal | Closed (100%) |

- `crea la rama de la tarea 1266 en viaticos-2.0` → nace `op-1266-comprobacion-de-gastos...`
- `cómo va el triángulo de viaticos-2.0 contra Migración Viáticos` → reporte cruzado con sugerencias
- El detalle del flujo vive en [CLAUDE.md](CLAUDE.md).

> **Nota clave:** esta instancia calcula el % de avance **por estado** (New=0%, In progress=40%,
> Developed=70%, Tested=90%, Closed=100%, etc.). Por eso "avanzar" una tarea = cambiar su estado.
> El `%` no se puede fijar a mano.

## Configuración

1. `npm install`.
2. Copia **`.env.example` → `.env`** y pon tu `OPENPROJECT_BASE_URL` y tu `OPENPROJECT_TOKEN`.
   - Genera el token en OpenProject: **Mi cuenta → Tokens de acceso → API**.
3. Verifica la conexión:

   ```
   npm run test:conn
   ```

   Debe mostrar tu usuario, tus proyectos y tus tareas abiertas.

## Seguridad

- El token vive solo en `.env` (ignorado por git, ver `.gitignore`).
- Empezamos contra la instancia **QA** (`wmsqa`) para probar sin riesgo.
- Toda escritura a OpenProject pasa por una **vista previa + confirmación**.

## Roadmap ("todo lo que se pueda")

1. ~~**Leer**: mis tareas, por proyecto, por estado; detalle de una tarea.~~ ✅
2. ~~**Actualizar**: % de avance, comentario, cambio de estado, registro de tiempo.~~ ✅
3. ~~**Crear** tareas nuevas desde markdown.~~ ✅
4. ~~**Flujo markdown**: me pasas tu MD → entrevista → vista previa → subir.~~ ✅
5. **Reportes**: "qué hice esta semana / este sprint" para tu jefe.
6. **Seguimiento**: tareas vencidas o próximas a vencer.
