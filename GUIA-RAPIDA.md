# Guía rápida — cómo pedirle avances a Claude (proyecto Clima Laboral)

> Le hablas a **este mismo Claude Code** (con el MCP `openproject` activo). No hay un Claude
> aparte por proyecto. El % de avance lo mueve el **ESTADO** de la tarea.

## Tus tareas actuales (Clima Laboral, proyecto 37)

| # | Tarea | Estado | % |
|---|---|---|---|
| 1037 | Levantamiento de Requerimientos | In progress | 40% |
| 1038 | Definición del alcance funcional del módulo | In progress | 40% |
| 1039 | Identificar stakeholders involucrados | In progress | 40% |
| 1036 | Fase 1 | New | 0% |
| 1150 | Dashboard | New | 0% |
| 1151 | Creación módulo | New | 0% |
| 941  | Sesiones de Seguimiento | New | 0% |
| 1034 | Sesión 1 | New | 0% |
| 1035 | Sesión 2 | New | 0% |

## Estados y el % que representan

`New 0` · `In specification 10` · `Specified / Confirmed / Scheduled 20` · `In progress 40`
· `Developed 70` · `In testing 80` · `Tested 90` · `Closed 100` · `On hold 0` · `Rejected 0`

## Frases que puedes usar (copia y pega)

**Consultar**
- `lista mis tareas de OpenProject`
- `muéstrame el detalle de la tarea 1037`
- `qué estados hay y qué % representa cada uno`

**Actualizar (estado + comentario)**
- `marca la tarea 1036 como In progress, comentario: arranqué la fase 1`
- `pasa la 1037 a Developed, comentario: terminé el levantamiento de requerimientos`
- `cierra la tarea 1039, comentario: stakeholders identificados y validados`

**Solo comentar (sin cambiar estado)**
- `agrega a la 1038 el comentario: avancé el alcance, falta validar con dirección`

**Avance narrativo (lo traduce a varias tareas)**
```
este es mi avance, actualiza mis tareas de Clima Laboral según esto:
- terminé el levantamiento de requerimientos
- ya identifiqué a todos los stakeholders
- empecé a armar el dashboard
```
Claude te mostrará una **vista previa** y subirá los cambios cuando confirmes.
