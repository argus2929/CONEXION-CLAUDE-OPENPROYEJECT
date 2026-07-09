---
description: Modo AUTOMÁTICO — analiza el proyecto actual completo (git, docs, triángulo), mapea contra la jerarquía de OpenProject y sube todo el avance sin preguntar; solo entrega el reporte final
---

Ejecuta el pipeline completo de avances en MODO AUTÓNOMO sobre el proyecto actual.
NO hagas entrevista, NO muestres vista previa de OpenProject, NO esperes confirmación: analiza,
decide y sube. Al final entrega solo el reporte de verificación. SOLO hay 2 preguntas permitidas:
(a) no poder determinar el proyecto de OpenProject, (b) trabajo local que no está en git (paso 1.5).
Argumento opcional del usuario (ruta de un .md de avances, nombre del proyecto de OpenProject,
o instrucciones extra): $ARGUMENTS

## 1. Reconocimiento local (vea todo)
- `git remote -v`, rama actual, `git log --oneline -30` y fechas (¿qué se hizo recientemente?).
- Lee los documentos de avance del repo si existen: BITACORA.md, CHANGELOG.md, PLAN*.md,
  AVANCES*.md, README.md (sección de estado). Si $ARGUMENTS trae una ruta .md, ese documento manda.
- Con eso arma la lista de AVANCES: qué se construyó, qué está en curso, qué está bloqueado.

## 1.5 Commits primero — el triángulo EMPIEZA en local (obligatorio)
El estado en OpenProject nunca va por delante de git, así que primero asegura la esquina local→GitLab:
- `git status --short` → ¿hay cambios SIN COMMITEAR?
- `git log @{u}..HEAD --oneline` (o contra la rama remota) → ¿hay commits SIN PUSH?
- Si hay trabajo local que NO está en GitLab: **PREGUNTA al usuario (AskUserQuestion) qué subir**
  — nunca decidas tú qué se commitea. Opciones típicas: subir todo a la rama actual / subirlo a una
  rama nueva `op-<id>-<slug>` de su tarea / elegir qué / no subir nada y documentar solo lo que ya
  está en GitLab. Ejecuta lo que decida (commit con mensaje `[#<id>] ...` + push) y continúa.
- Si no hay nada pendiente en local, sigue sin preguntar.

## 2. Mapeo contra OpenProject (analice todo)
- `op_listar_proyectos` → deduce el proyecto por el nombre del repo/remote/tema. Si NO puedes
  determinarlo con confianza, esa es la ÚNICA pregunta permitida (AskUserQuestion, 1 pregunta).
- `op_tareas_proyecto` → árbol completo. Distingue jerarquía: hojas (Task/Feature/Bug/Support)
  vs contenedores (Epic/Summary task/Milestone).
- Si el remote es gitlab.alerta.com.mx: `op_git_triangulo` (ramas op-<id> + MRs) para conocer la
  situación git de cada tarea.

## 3. Decisiones (vea la jerarquía) — decide tú, sin preguntar
- Cada avance → tarea HOJA existente (usa `op_buscar_tareas` para no duplicar) o hoja NUEVA
  (`op_crear_tarea` tipo Feature/Task, con `padre_id` del contenedor correcto).
- Estado por evidencia, en este orden de prioridad:
  1. MR fusionado a la principal → Closed (comentario citando el MR).
  2. MR abierto → In testing. Rama op-<id> activa sin MR → In progress.
  3. El documento dice terminado+probado → Tested (si el tipo no lo admite: cerrar la hoja y
     que el contenedor padre Epic marque el 90).
  4. En curso / sin evidencia clara → In progress y anota el faltante en **Pendiente:**.
- Contenedores: NUNCA llevan el detalle ni horas. Resumen de 1-3 líneas. Si todos los hijos
  quedaron Closed, cierra el contenedor a mano (no se recalcula solo).
- ⚠️ NO modifiques tareas con contenido con formato de otra persona (checklists del jefe, nombres,
  fórmulas): déjalas intactas y lístalas en el reporte como "requieren confirmación".

## 4. Sube todo
- Descripciones en LENGUAJE DE NEGOCIO (nada de archivos, clases, tablas, endpoints, commits,
  ramas ni librerías): título + `### ✅ Qué se hizo` + `### Lo que se logró` (viñetas) + `**Pendiente:**`.
- Comentario por tarea tocada: `"<Mes> <año>: <resumen 1-3 frases>. Avance aproximado: N%."`
- Aplica con `op_actualizar_tarea`, `op_editar_descripcion`, `op_crear_tarea`, `op_renombrar_tarea`.
- Si una escritura da 403 (permisos), anótala y continúa con el resto.

## 5. Reporte final (lo único que ve el usuario)
- Tabla: tarea (# o NUEVA) → acción realizada → estado y % REALES (releídos con `op_tareas_proyecto`).
- Sección "No toqué / requiere tu confirmación" (contenido ajeno, 403, ambigüedades).
- Sección "Vacíos detectados" (avances sin evidencia suficiente, ramas fuera del triángulo,
  contenedores con hijos incompletos).
- Todo fallo se reporta tal cual, sin suavizarlo.
