# OpenProject ⇄ Claude Code

Sistema para alimentar el avance de tareas en OpenProject y generar reportes,
conversando con Claude Code. Claude lee tu markdown de avances, lo traduce a
acciones concretas, te muestra una vista previa y, al confirmar, lo sube a OpenProject.

## Estado actual

- [x] Conector con la API REST v3 de OpenProject (`src/openproject.js`)
- [x] Probador de conexión (`npm run test:conn`)
- [x] Servidor MCP con 6 herramientas (`src/mcp-server.js`)
- [x] Flujo de plantilla: `npm run plantilla` → llenar → vista previa → subir
- [x] Registro de tiempo (horas) en tareas

> ¿Vas a adaptar esto a tu propia instancia? Lee **[AKZEL-GUIA.md](AKZEL-GUIA.md)**.

## Cómo usarlo en Claude Code

El servidor MCP se registra en `.mcp.json`. Para activarlo:

1. **Reinicia Claude Code** (cierra y abre la sesión) para que cargue `.mcp.json`.
2. Cuando pregunte, **aprueba** el servidor `openproject`.
3. Ya puedes pedirle a Claude cosas como:
   - "lista mis tareas de OpenProject"
   - "muéstrame el detalle de la tarea 1037"
   - "pon la tarea 1037 en Developed con el comentario: terminé el levantamiento"

### Herramientas disponibles

| Herramienta | Qué hace |
|---|---|
| `op_listar_tareas` | Tus tareas asignadas con estado y % |
| `op_ver_tarea` | Detalle de una tarea + estados a los que puede cambiar |
| `op_listar_estados` | Estados y el % que representa cada uno |
| `op_listar_proyectos` | Proyectos visibles |
| `op_actualizar_tarea` | **(escritura)** cambia estado y/o agrega comentario |
| `op_registrar_tiempo` | **(escritura)** registra horas trabajadas (actividad Development por defecto) |

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

1. **Leer**: mis tareas, por proyecto, por estado; detalle de una tarea.
2. **Actualizar**: % de avance, comentario, cambio de estado, fechas, registro de tiempo.
3. **Crear** tareas nuevas desde markdown.
4. **Flujo markdown**: plantilla con IDs → la llenas → vista previa → subir.
5. **Reportes**: "qué hice esta semana / este sprint" para tu jefe.
6. **Seguimiento**: tareas vencidas o próximas a vencer.
