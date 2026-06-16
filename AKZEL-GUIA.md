# AKZEL-GUIA — Conectar Claude ⇄ OpenProject (y cómo adaptarlo)

> Guía para **Aksell** y su **Claude Code**. Explica qué es este proyecto, cómo funciona
> por dentro y **cómo adaptarlo a tu propia cuenta/instancia** de OpenProject.
> Está escrita para que tu Claude la lea y te ayude a ponerlo a andar.

---

## 1. ¿Qué hace esto?

Permite **alimentar OpenProject conversando con Claude Code**, sin entrar a la interfaz tarea por tarea:

- Actualizar **estado** y **% de avance** de tareas.
- Agregar **comentarios** y **descripciones** (en **lenguaje de negocio**, no técnico).
- **Crear** tareas y módulos (con su jerarquía).
- **Registrar tiempo** (horas trabajadas).
- Un **flujo de plantilla**: generas un `.md` con tus tareas, lo llenas en tus palabras, y Claude lo traduce y lo sube con vista previa.

La idea: tú escribes tus avances como te salga (incluso técnico) → Claude lo convierte a algo presentable para tu jefe → lo sube a OpenProject, que **ya es el reporte vivo**.

---

## 2. Arquitectura (3 piezas)

| Pieza | Archivo | Qué es |
|---|---|---|
| **Conector** | `src/openproject.js` | Habla con la API REST v3 de OpenProject. **Sin dependencias** (usa `fetch` nativo de Node). |
| **Servidor MCP** | `src/mcp-server.js` | Expone herramientas a Claude Code. Se registra en `.mcp.json`. |
| **Utilidades** | `src/*.js` | Lectura (`arbol`, `verificar`, `verificar-tiempo`), plantilla (`generar-plantilla`), y scripts de operaciones. |

Stack: **Node** (se construyó con Node 24) + el SDK `@modelcontextprotocol/sdk`. Sin base de datos ni servidor: el "cerebro" que razona es **Claude** (tú, su Claude).

---

## 3. Reglas del dominio que DEBES saber (esto nos costó descubrir)

1. **El % de avance lo determina el ESTADO.** `percentageDone` es de **solo lectura**. Para "avanzar" una tarea, cambias su **estado**. Mapeo típico: `New=0, In progress=40, Developed=70, In testing=80, Tested=90, Closed=100`. **Corre `op_listar_estados` para ver el % real de TU instancia** (puede variar).
2. **El flujo de estados depende del TIPO de tarea.** Algunos tipos solo permiten `New → In progress → Closed` (sin 70/80/90). Valida con `estadosPermitidos(id)`; a veces hay que **saltar en pasos** (New → In progress → destino).
3. **TLS corporativo:** si el certificado de tu OpenProject es interno, corre Node con **`--use-system-ca`** (usa el almacén de Windows). Sin él falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Si tu instancia tiene cert público, puedes quitar el flag.
4. **Comentarios (¡ojo!):** NO se pueden mandar dentro del PATCH del work package (se ignoran). 
   - **Crear** comentario: `POST /work_packages/{id}/activities` con `{ "comment": { "raw": "..." } }`.
   - **Editar** comentario: `PATCH /activities/{id}` con `{ "comment": "texto plano" }` ← **distinto** (string, no objeto).
5. **Descripción** SÍ se edita por PATCH del work package: `{ "description": { "raw": "..." } }`.
6. **Tiempo:** `POST /time_entries` con `hours` en ISO 8601 (`"PT2H30M"`), `spentOn`, `_links.workPackage` y `activity` (opcional).
7. **Padres no se recalculan solos:** el estado/% de un Epic/Feature contenedor NO sube automáticamente cuando cierras sus hijos. Hay que cerrarlos a mano.

---

## 4. Cómo adaptarlo a TU instancia (pasos)

1. Instala **Node 18+** (probado en Node 24). Clona este repo.
2. `npm install`.
3. **Genera tu token** en OpenProject: avatar → **Mi cuenta** → **Tokens de acceso** → sección **API** → generar. (Si no aparece la sección API, pide a tu admin que **habilite los tokens de API**.)
4. Copia **`.env.example` → `.env`** y pon **TU** `OPENPROJECT_BASE_URL` (incluye la subruta, p. ej. `.../openproject`) y **TU** `OPENPROJECT_TOKEN`.
5. **Prueba la conexión:** `npm run test:conn` → debe mostrar tu usuario, proyectos y tareas.
6. Edita **`.mcp.json`**: cambia la **ruta absoluta** de `src/mcp-server.js` a donde clonaste el repo. Si tu cert es público, quita `--use-system-ca`.
7. **Reinicia Claude Code** y **aprueba** el servidor `openproject`.
8. Listo. Háblale a Claude: *"lista mis tareas de OpenProject"*, *"pon la 123 en Developed con comentario: …"*, *"registra 2h en la 123"*.

---

## 5. Herramientas MCP disponibles (6)

| Herramienta | Qué hace |
|---|---|
| `op_listar_tareas` | Tus tareas asignadas (estado y %) |
| `op_ver_tarea` | Detalle de una tarea + estados a los que puede cambiar |
| `op_listar_estados` | Estados y el % que representa cada uno (en tu instancia) |
| `op_listar_proyectos` | Proyectos visibles |
| `op_actualizar_tarea` | **(escritura)** cambia estado y/o agrega comentario |
| `op_registrar_tiempo` | **(escritura)** registra horas en una tarea |

> El **conector** sabe hacer más de lo que expone el MCP (crear tareas, editar/renombrar descripciones, editar comentarios, generar plantilla). Esas se usan hoy por **script**; ver "Pendientes".

---

## 6. El flujo de plantilla (la forma recomendada de alimentar avances)

1. `npm run plantilla -- <id-o-identificador-del-proyecto>` → genera `seguimiento-<proyecto>.md` con tus tareas.
2. **Llénalo** en tus palabras (solo lo que cambió; lo vacío no se toca).
3. Dile a Claude: **"aplica este seguimiento"** → Claude lo **traduce a lenguaje de negocio**, te muestra **vista previa** y lo sube.

La plantilla sigue el estilo que pide el jefe: **Objetivo / Actividades / Entregable / Criterio de aceptación / Lo que se logró**.

---

## 7. "Ahora que se paga": ¿usar el MCP NATIVO de OpenProject?

Si tu OpenProject es **Enterprise ≥ 17.2**, trae un **MCP nativo** (Administración → Inteligencia Artificial → Model Context Protocol). Considera:

- ⚠️ El MCP nativo es de **SOLO LECTURA** hoy. Para **escribir avances** (el objetivo) **sigues necesitando este conector** (API REST v3).
- En la instancia QA donde se construyó esto, `/mcp` daba **404** (no disponible), por eso se hizo el conector propio.
- **Recomendación:** puedes usar **ambos** — el nativo para que Claude *consulte* con auto-discovery, y este conector para *escribir*. O simplemente quédate con este, que ya hace lectura y escritura.

---

## 8. Pendientes conocidos (de una auditoría interna)

- Faltan herramientas MCP de **escritura**: `crear_tarea`, `editar_descripcion`, `renombrar` (hoy solo por script). Envolverlas es directo (ya existen en `openproject.js`).
- El **"aplicar plantilla"** lo interpreta Claude a mano; falta un parser automático (`aplicar-seguimiento.js`).
- **Consolidar** los scripts de un solo uso (hay varios con IDs fijos de la corrida original; revisa antes de re-ejecutar).
- `isoAHoras` ignora el componente de días en duraciones (no afecta hoy, ninguna entrada supera 24h).

---

## 9. Mapa del repo

```
src/
  openproject.js        ← Conector (API REST v3). El núcleo.
  mcp-server.js         ← Servidor MCP (6 herramientas).
  test-connection.js    ← Prueba de conexión (npm run test:conn).
  arbol.js              ← Árbol de tareas de un proyecto.
  verificar.js          ← Estado/%/comentarios/descripción de tareas.
  verificar-tiempo.js   ← Total de horas registradas.
  generar-plantilla.js  ← Genera el .md de seguimiento por proyecto.
  (otros scripts de operaciones puntuales — revisar IDs antes de re-correr)
.env.example            ← Plantilla de configuración (copia a .env).
.mcp.json               ← Registro del servidor MCP para Claude Code.
README.md               ← Guía general.
GUIA-RAPIDA.md          ← Frases listas para usar.
AKZEL-GUIA.md           ← Este documento.
```

---

## 10. Seguridad

- El **token** vive **solo en `.env`** (ignorado por git). **Nunca** lo subas al repo.
- Si compartes este repo, hazlo **privado** o revisa que no queden URLs/datos internos.
- Para rotar el token: OpenProject → Mi cuenta → Tokens de acceso → regenerar.
