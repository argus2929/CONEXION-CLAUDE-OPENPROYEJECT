# Guía rápida — cómo pedirle avances a Claude

> Le hablas a **este mismo Claude Code** (con el MCP `openproject` activo).
> El % de avance lo mueve el **ESTADO** de la tarea, no se fija a mano.

## ⭐ El flujo principal: pásale tu MD

Escribe tus avances como te salga (técnico o no) en un `.md` y dale la ruta a Claude:

```
aquí están mis avances de junio: C:\Users\TU-USUARIO\Desktop\MIS-AVANCES.md
```

Claude hace el resto:
1. Lo lee y revisa los proyectos/tareas reales en OpenProject.
2. Te hace **2–4 preguntas** para completar lo que falte (estado, horas, pendientes) — para que ninguna tarea quede a medias.
3. Te muestra la **vista previa** (qué tarea se toca, qué estado queda, qué texto se sube).
4. Cuando digas "dale", lo sube todo y te enseña la verificación final.

No importa el formato del MD: puede ser una lista de viñetas, un reporte con tablas o
notas sueltas. Claude lo traduce a lenguaje de negocio (nada técnico llega a OpenProject).

## Estados y el % que representan

`New 0` · `In specification 10` · `Specified / Confirmed / Scheduled 20` · `In progress 40`
· `Developed 70` · `In testing 80` · `Tested 90` · `Closed 100` · `On hold 0` · `Rejected 0`

> Los saltos de estado se resuelven solos: si pides "Tested" desde "New", Claude pasa
> por los estados intermedios automáticamente.

## Frases sueltas que puedes usar (copia y pega)

**Consultar**
- `lista mis tareas de OpenProject`
- `muéstrame las tareas del proyecto Soporte`
- `busca tareas que digan "dashboard"`
- `muéstrame el detalle de la tarea 1219`

**Actualizar**
- `marca la tarea 1210 como Closed, comentario: mejoras visuales entregadas`
- `agrega a la 1211 el comentario: canal de soporte conectado`
- `reescribe la descripción de la 1213 con esto: …`
- `renombra la 1207 a "Fase 1 — Soporte y monitoreo"`

**Crear**
- `crea una tarea "Reporteador mensual" en el proyecto CRM, tipo Feature, y documéntala con esto: …`

**Tiempo**
- `registra 3 horas en la tarea 1222 con fecha 2026-06-17`

## Otras herramientas

- **Plantilla por proyecto**: `npm run plantilla -- soporte` genera `seguimiento-soporte.md`
  con todas las tareas listas para llenar; luego dile a Claude "aplica este seguimiento".
- **Planes JSON** (lotes grandes): Claude genera un `plan-*.json` y lo corre con
  `npm run plan -- plan.json` (vista previa) → `npm run plan -- plan.json --aplicar`.
