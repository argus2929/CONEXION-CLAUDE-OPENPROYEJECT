# 🔺 Flujo de trabajo — local ⇄ GitLab ⇄ OpenProject

> Documento de referencia del flujo completo, con cada punto **🔧 afinable** marcado.
> Última actualización: julio 2026.

---

## 1. La idea en una imagen

```
                       LOCAL (tu máquina)
                      el trabajo NACE aquí
                     /                    \
             commits / ramas          tú hablas con Claude
             op-<id>-<slug>           (/op, /openproject, natural)
                   /                          \
                  ▼                            ▼
   GITLAB  ◄──── op_git_triangulo ────►  OPENPROJECT
   el FILTRO                             lo que ve el
   · MR abierto  = revisión (filtro extra)    supervisor
   · MR fusionado = filtro final              (estados, %, negocio)
```

**Principios (el contrato del flujo):**
1. **Commits primero** — nada "existe" si se quedó en tu máquina; si hay trabajo local sin subir, Claude pregunta qué subir (tú decides, nunca él).
2. **OpenProject nunca va por delante de git** — no se cierra tarea cuyo MR no se fusionó (excepto tareas sin código).
3. **El % lo determina el ESTADO** — no se fija a mano.
4. **El detalle vive en tareas hoja** — los contenedores agrupan.
5. **A OpenProject solo llega lenguaje de negocio** — cero tecnicismos.
6. **Todo se verifica releyendo** — el reporte final trae los estados reales, no los deseados.

---

## 2. Las piezas

| Pieza | Dónde | Qué es |
|---|---|---|
| Conector OpenProject | `src/openproject.js` | API REST v3: tareas, estados, descripciones, comentarios, tiempo, asignación, proyectos |
| Conector GitLab | `src/gitlab.js` | API v4: proyectos, ramas, MRs, cruce con tareas |
| Servidor MCP | `src/mcp-server.js` | **16 herramientas** (11 `op_*` + 5 `git_*`), registrado a nivel usuario (todas las sesiones) |
| Agente global | `~/.claude/agents/openproject.md` | El "cerebro" con el playbook, invocable desde cualquier proyecto |
| `/op` | `~/.claude/commands/op.md` | Modo interactivo: entrevista → vista previa → aplicar |
| `/openproject` | `~/.claude/commands/openproject.md` | Modo autónomo: ve todo, analiza todo, sube todo, solo reporta |
| Motor de planes | `src/aplicar-plan.js` | Lotes grandes por JSON: `npm run plan -- plan.json [--aplicar]` |
| Plantilla | `src/generar-plantilla.js` | `.md` por proyecto para llenar a mano |
| Playbook | `CLAUDE.md` (repo) | Las reglas que cualquier sesión en esta carpeta sigue sola |

---

## 3. Vida de UNA tarea (el ciclo del triángulo)

| Paso | Quién | Acción | Estado en OpenProject |
|---|---|---|---|
| 0 | Claude | **Commits primero**: ¿hay trabajo local sin commit/push? → pregunta qué subir | — |
| 1 | Tú/Claude | `git_crear_rama` → nace `op-<id>-<slug>` desde main | **In progress (40%)** |
| 2 | Tú | Trabajas en local; commits `[#<id>] mensaje` → push a la rama | In progress |
| 3 | Tú | Abres **Merge Request** (filtro extra: revisión) | **In testing (80%)** |
| 4 | Revisor | Fusiona el MR a main (**filtro final**) | **Closed (100%)** + comentario citando el MR |
| 5 | Claude | Si todos los hijos de un contenedor cierran → cierra el contenedor a mano | — |

**🔧 Afinables de este ciclo:**
- **A1. Rama activa sin MR mucho tiempo** — hoy no hay alerta de "rama estancada". ¿Cuántos días sin commit deberían encender un foco en el reporte?
- **A2. Draft MRs** — GitLab distingue MR borrador vs listo; hoy ambos cuentan como "en revisión" (80%). ¿Mapear Draft = Developed 70%?
- **A3. `main` NO está protegida** — se puede pushear directo brincándose el filtro. Proteger rama en GitLab (config, 2 min, la haces tú o el admin).
- **A4. El cierre al fusionar es manual** — hay que correr el cruce. La mejora natural: job de CI en GitLab que cierre la tarea al momento del merge (sin infraestructura extra).
- **A5. Enlaces cruzados** — hoy la unión es solo el nombre de la rama. Falta: comentario en la tarea con link al MR y descripción del MR con link a la tarea.

---

## 4. Flujo `/openproject` (autónomo) — paso a paso

1. **Reconocimiento local**: remote, rama, últimos 30 commits, docs de avance (BITACORA, CHANGELOG, AVANCES…). Si le pasas un `.md`, ese manda.
2. **Commits primero** (pregunta permitida #2): trabajo local sin commit/push → pregunta qué subir.
3. **Mapeo**: deduce el proyecto de OpenProject (pregunta permitida #1 si no puede), baja el árbol completo, distingue hojas vs contenedores, cruza el triángulo si el remote es GitLab.
4. **Decisiones por evidencia** (prioridad): MR fusionado → Closed · MR abierto → In testing · rama activa → In progress · doc dice "terminado y probado" → Tested · sin evidencia → In progress + pendiente anotado.
5. **Sube todo**: descripciones de negocio en hojas, resúmenes cortos en contenedores, comentarios "Mes año: … Avance: N%".
6. **Reporte final**: tabla con estados reales + "no toqué / requiere confirmación" + "vacíos detectados".

**Salvaguardas fijas**: no toca tareas con contenido de otras personas · no sube tecnicismos · 403 se reporta y sigue · fallos tal cual.

**🔧 Afinables:**
- **A6. ¿Qué evidencia basta para "Tested"?** Hoy: que el doc diga terminado+probado. ¿Debería exigir además pruebas en verde o MR fusionado?
- **A7. Política de horas** — el modo autónomo NO registra tiempo (no puede inventarlo). ¿Debería proponer una repartición desde las fechas de los commits y preguntarte solo el total?
- **A8. Frecuencia** — hoy corre cuando tú lo invocas. ¿Programarlo (p. ej. viernes por la tarde) para que el proyecto nunca se atrase?

---

## 5. Flujo `/op` (interactivo) — cuándo usarlo

Para acciones puntuales o cuando quieres control: entrevista (2–4 preguntas: estados, horas, pendientes, dónde colgar) → **vista previa** → tu "dale" → aplica → verifica. Ideal para: cerrar una tarea específica, subir un MD con contexto raro, decisiones delicadas.

**🔧 A9.** ¿La entrevista pregunta lo correcto? Hoy: estado destino, horas/fechas, pendientes, ubicación de tareas nuevas. ¿Falta algo que tu supervisor siempre pide (¿fechas compromiso?, ¿responsables de otras personas?)?

---

## 6. Jerarquía (el flujo de OpenProject se respeta)

```
Epic (módulo/fase)              ← resumen 3-6 líneas, SIN detalle, SIN horas, SIN rama
 └─ Summary task (agrupador)    ← 1-3 líneas; se cierra cuando cierran sus hijos
     └─ Task / Feature / Bug / Support   ← EL TRABAJO: descripción completa,
        (hojas)                            horas, estados finos, rama op-<id>
```

- `git_crear_rama` **rechaza** contenedores (te manda a la hoja).
- Contenedores suelen tener flujo corto (New→In progress→Closed): si una hoja "terminada pero sin producción" no admite Tested, la hoja se cierra y el **Epic padre marca el 90%**.

**🔧 Afinables:**
- **A10. Deuda de jerarquía**: #1210/#1211 (Soporte) y #1213 (Ubits) son Summary tasks con el detalle adentro y sin hijas (lo subí así en junio, antes de la regla). Reestructura propuesta y en pausa: crear ~7 hijas Feature y mover el detalle.
- **A11. ¿"Terminado sin producción" = hoja Closed?** Así lo resolvimos en Viáticos (hijas Closed, Epic 90%). Alternativa: dejar hojas en In progress hasta producción. ¿Cuál prefiere tu supervisor?

---

## 7. Reglas de lenguaje (lo que llega a OpenProject)

- Descripción: título + `### ✅ Qué se hizo` + `### Lo que se logró` (viñetas) + `**Pendiente:**`
- Comentario: `"<Mes> <año>: <resumen 1-3 frases>. Avance aproximado: N%."`
- Prohibido: archivos, clases, tablas, endpoints, commits, ramas, librerías.
- **🔧 A12.** ¿Los comentarios deberían citar SIEMPRE el MR (`!12`) aunque sea "técnico"? Hoy sí se cita al cerrar por merge — es el único tecnicismo permitido. ¿Lo quiere ver tu supervisor o lo quitamos?

---

## 8. Vacíos abiertos hoy (deuda viva)

| # | Vacío | Dueño |
|---|---|---|
| V1 | 60 h de Migración Viáticos sin registrar (403 permisos) | Admin: habilitar "Registrar tiempo" |
| V2 | Portada del proyecto "No empezado" + descripción vieja (403) | Admin: "Editar proyecto" |
| V3 | FORTIA #1208/#1209 y Humand #1205/#1206 vacías (avances de junio) | Tú dices "llénalas" |
| V4 | `viaticos-2.0` sin ramas `op-*` — el triángulo estrenado pero sin uso | Próxima tarea que arranques |
| V5 | Token GitLab sin rotar (viajó por chat) + GitLab va por http | Tú (1 min en GitLab) |
| V6 | Reestructura Soporte/Ubits (A10) en pausa | Tú decides |
| V7 | Bugs conocidos de `aplicar-plan.js` (AKZEL-GUIA §8): preview no valida rutas de estado, actividad "Development" fija, truncados >200/>50 sin aviso | Yo, cuando digas |
| V8 | Reporte semanal para el jefe — no construido (roadmap) | Yo, cuando digas |
| V9 | Multi-repo: una tarea con código en 2 repos (api+web) solo cruza uno | Yo, cuando digas |

---

## 9. Resumen de decisiones que me debes (para afinar)

1. **A3** — ¿Protegemos `main` de viaticos-2.0 ya? (tú/admin, config GitLab)
2. **A4+A5** — ¿Construyo el cierre automático al merge (CI) y los enlaces cruzados? (mi recomendación: sí, juntos)
3. **A2** — ¿Draft MR = Developed 70%?
4. **A6** — ¿Qué evidencia mínima para Tested?
5. **A7** — ¿Horas propuestas desde commits (te pregunto solo el total)?
6. **A8** — ¿`/openproject` programado cada viernes?
7. **A10/V6** — ¿Reestructuro Soporte/Ubits a jerarquía correcta?
8. **A11** — ¿"Hecho sin producción": hoja Closed + Epic 90% (actual) o hojas en In progress?
9. **A12** — ¿Citar el MR en el comentario de cierre: sí o no?
10. **V3** — ¿Lleno FORTIA y Humand con lo de junio?
