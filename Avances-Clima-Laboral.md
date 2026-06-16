# Avances del Módulo de Clima Laboral

**Sistema:** Dashboard Ejecutivo de Capital Humano (Vue 3 + Vuetify · Laravel)
**Documento:** Resumen de logros y capacidades construidas
**Fecha:** Junio 2026

---

## 1. Resumen ejecutivo

Se construyó un **módulo completo de medición de Clima Laboral**, de punta a punta: desde la configuración de la encuesta y su publicación, pasando por la **recolección anónima** de respuestas, hasta el **análisis ejecutivo**, la **generación automática de planes de acción y objetivos**, y la **integración con Humand** para difundir las encuestas.

Lo más destacado que ya está funcionando:

- 🔁 **Ciclo anual completo** gestionado desde el sistema (abrir → medir → cerrar → recalcular → nuevo período), conservando histórico.
- 🔒 **Anonimato real garantizado por diseño** (separación de dominios, mínimo de muestra, padrón protegido).
- 📊 **Índice de clima 0–100** general, por factor y por 6 niveles organizacionales, con clasificación automática (Sobresaliente / Regular / Crítico).
- 📈 **Tasa de participación real + confiabilidad** (no un porcentaje "ciego").
- 🤖 **Planes de acción y objetivos auto-generados** para los factores débiles.
- 🖥️ **Tableros ejecutivos** (resumen, vista ejecutiva con mapa de calor, mapa geográfico, radar, rankings) y **tableros de participación en vivo**.
- 📱 **Flujo del encuestado** con código de un solo uso, proyectable en pantalla, totalmente anónimo.
- 🆕 **El índice de clima ya alimenta el dashboard de inicio de Capital Humano y el sistema de alertas por umbral.**

---

## 2. El ciclo de vida (de principio a fin)

```
1. CONFIGURAR        Definir período (encuesta anual) + factores (ejes de medición)
       ↓
2. BANCO DE PREGUNTAS Construir el banco maestro y propagarlo a todas las unidades
       ↓
3. PUBLICAR          Abrir período + publicar en Humand (por unidad o por marca completa)
       ↓
4. RESPONDER         El colaborador entra con un código (anónimo) y contesta
       ↓
5. CALCULAR          Índice general + por factor + por nivel (recálculo bajo demanda)
       ↓
6. ANALIZAR          Dashboards: índice, participación, mapa de calor, rankings
       ↓
7. ACTUAR            Planes de acción + objetivos auto-generados para factores débiles
       ↓
8. CERRAR / RENOVAR  Cerrar período (dispara recálculo) → abrir nuevo año (conserva histórico)
```

---

## 3. Modelo de datos

Se diseñó un esquema relacional dedicado (todas las tablas con prefijo `clima_`):

| Tabla | Propósito |
|---|---|
| `clima_encuestas` | Entidad raíz: la encuesta/período anual (estado, fechas, soft-delete). |
| `clima_factores` | Ejes de medición (Liderazgo, Comunicación, etc.). |
| `clima_modelos_negocio` | Unidades de negocio que participan; cada una con código de acceso y ventana propia. |
| `clima_campanas` | La encuesta concreta de una unidad. |
| `clima_campana_preguntas` | Preguntas (tipos: escala 1–5, opciones Likert, texto libre), ligadas a un factor. |
| `clima_sesiones` | Lotes de aplicación con token y estados (creada → publicada → activa → cerrada). |
| `clima_codigos` | Códigos de un solo uso (disponible → en_proceso → completado / expirado). |
| `clima_respuestas` + `clima_respuesta_items` | La respuesta anónima y el valor por pregunta. |
| `clima_participaciones` | Registro de "quién participó" **sin vínculo** a la respuesta (anonimato). |
| `clima_resultados` | Índices calculados (general y por factor) por unidad/nivel + nº de respuestas. |
| `clima_publicaciones` | Registro de cada publicación en Humand (post_id, audiencia/padrón, segmentación). |
| `clima_planes_accion` | Planes de mejora (estado, avance 0–100, responsable, fecha compromiso). |
| `clima_objetivos` | Objetivos meta-vs-resultado con % de cumplimiento. |
| `clima_estructura` | Jerarquía organizacional (padre-hijo) para navegación y alcance. |
| `clima_user_scope` | Asignación de visibilidad por usuario (RBAC). |

---

## 4. Administración del período y de las encuestas

**Gestión del período** (`ClimaPeriodoController`):

- Consultar estado y conteos del período.
- Editar fechas; **abrir** y **cerrar** el período.
- Al **cerrar**, se dispara automáticamente el recálculo + generación de planes + objetivos.
- **Nuevo período anual**: crea el año siguiente, cierra el anterior, vacía respuestas pero **conserva resultados históricos**.
- **Reiniciar**: limpia respuestas/resultados/planes/objetivos de las unidades elegidas, conservando el banco de preguntas.

**Banco de preguntas compartido**: existe una campaña maestra (banco central). El admin crea/edita/elimina preguntas y, con un clic ("Aplicar a todas"), **propaga el banco completo a todas las unidades** dentro de una transacción segura, garantizando que todas midan con la misma encuesta.

**Tipos de pregunta soportados:** escala 1–5, opciones tipo Likert (5 niveles) y texto libre.

---

## 5. Recolección de respuestas y anonimato

El flujo del encuestado es **público y sin login**, pensado para máxima accesibilidad:

1. El colaborador entra con un **código de 6 caracteres** (validado en vivo).
2. Contesta una encuesta multisección con barra de progreso y preguntas obligatorias señaladas.
3. Al terminar, el código se marca como **completado** (un solo uso).

**Anonimato garantizado por diseño** — no es solo una promesa, es arquitectura:

- 🔓 **Separación de dominios:** la tabla de *participaciones* (sé quién contestó) **no tiene relación** con la tabla de *respuestas* (qué se contestó). Es imposible reconstruir quién respondió qué.
- 🔐 **Mínimo de muestra (default 5):** los resultados de un segmento con menos de 5 respuestas se **ocultan** en la API, para que nadie pueda inferir respuestas individuales.
- 🔢 **Padrón protegido (×2):** la audiencia se muestra y calcula multiplicada por dos, como capa extra de anonimato.
- 🚫 **Cero rastros:** no se guarda IP, dispositivo ni identificadores personales.
- 🔒 **Concurrencia segura:** al tomar un código se usa una transacción con bloqueo (`SELECT FOR UPDATE`) para evitar duplicados/condiciones de carrera.

**Vista proyectable de códigos:** una pantalla diseñada para proyectarse en salas/auditorios, con auto-refresco cada 10 s y estados por color, para que quien no trae dispositivo pueda tomar un código a la vista.

**Pantalla de agradecimiento** que cierra el ciclo de confianza reafirmando el anonimato.

---

## 6. Analítica (el corazón del módulo)

**Índice de clima 0–100**, calculado automáticamente:

- Escala 1–5 → `(promedio / 5) × 100`.
- Preguntas de opciones → `(respuestas favorables / total) × 100`.
- Texto libre → se omite del índice.
- **Escala Likert flexible:** mapea automáticamente expresiones ("Totalmente de acuerdo"→5, "Excelente"→5, "Siempre"→5, etc.), normalizando mayúsculas y acentos.

**Tres dimensiones de resultado:**

- **General** (todos los factores juntos) — `factor_id = NULL`.
- **Por factor** (Liderazgo, Comunicación, …).
- **Por nivel jerárquico:** dirección, división, región, unidad de negocio, departamento, jefe inmediato.

**Clasificación automática:** **≥ 85 Sobresaliente · 70–84 Regular · < 70 Crítico.**

**Tasa de participación real + confiabilidad** — el número que evita un porcentaje "ciego":

- `participación = respuestas ÷ audiencia × 100`, con la audiencia tomada del padrón.
- **Semáforo de confiabilidad:** alta ≥ 70 %, media 40–69 %, baja < 40 %, o **sin_padron** si no hay denominador. Así el directivo sabe si el dato es estadísticamente confiable.

**Arquitectura de recálculo "lazy" (sin cron obligatorio):** contestar **no** recalcula nada (para no penalizar a los miles que responden). El recálculo se dispara **al abrir cualquier reporte**, y solo para las unidades con respuestas nuevas, protegido con locks de caché. El costo lo pagan los pocos que consultan, no los muchos que contestan.

---

## 7. Planes de acción y objetivos (acción, no solo medición)

El módulo no se queda en medir: **convierte hallazgos en acciones automáticamente**.

- **Planes de acción:** cuando un factor cae por debajo del umbral (default 80 %), se genera un plan con título, descripción (con el % real y la brecha), responsable, fecha compromiso (+30 días), estado (pendiente / en progreso / cumplido) y barra de avance 0–100 %. Es **idempotente** (no duplica) y editable desde la interfaz.
- **Objetivos de cumplimiento:** por cada factor se crea un objetivo meta-vs-resultado, con `cumplimiento = min(100, resultado/meta × 100)` y estado (cumplido / parcial / no_cumplido). Permite rastrear avance entre períodos.

Ambos se regeneran al cerrar el período o de forma "lazy" al abrir el dashboard.

---

## 8. Seguridad y alcance por rol (RBAC)

`ClimaScopeService` controla **qué ve cada usuario**:

- **Administrador General / Master:** ve todo.
- **Resto:** ve solo los nodos organizacionales asignados (`clima_user_scope`) **y sus descendientes** (si tienes una región, ves sus departamentos).

Este filtro de alcance se aplica de forma consistente en **dashboard, resultados, planes, objetivos y participación**.

---

## 9. Frontend — pantallas construidas

**Administración:**

- **Gestión de Modelos de Negocio:** crear/listar/activar/pausar unidades, código de acceso por unidad, contadores en vivo, exportación CSV, programación de ventanas y publicación en Humand.
- **Constructor de Encuestas / Banco de Preguntas:** banco centralizado por factor, 3 tipos de pregunta, agrupación expand/colapsa, gestión del período, botón "Aplicar a todas".

**Flujo del encuestado (público):**

- **Responder:** ingreso de código + encuesta multisección anónima.
- **Vista de Códigos proyectable** (salas de espera).
- **Pantalla de Agradecimiento.**

**Tableros ejecutivos:**

- **Dashboard (Resumen):** KPIs (índice general, respuestas, planes, objetivos), gráficos por factor y por unidad, filtros por período/unidad/fechas, control de apertura/cierre.
- **Vista Ejecutiva:** insights automáticos en texto, **mapa de calor factores × unidades**, **mapa geográfico de México** coloreado por clima, **velocímetro** del índice, **radar de 7 factores**, **ranking** de mejores y peores unidades.
- **Tablero de Participación en vivo:** respuestas, padrón, tasa %, confiabilidad, barras por unidad y alertas (⚠️ participación < 40 %, unidades sin padrón).
- **Resultados** (por factor, con bloqueo de anonimato), **Planes** (editables) y **Objetivos** (cumplimiento).
- **Selector de Período** global persistente (recuerda la selección en el navegador).

**Estado compartido:** un store Pinia centraliza los datos del módulo entre todas las vistas, con persistencia del período activo.

---

## 10. Integración con Humand

- **Publicar encuesta en Humand** con selección de audiencia (todos o segmentaciones), mensaje editable, notificación push y programación (ahora o fecha futura).
- **Lanzar marca completa:** publica de un clic a **todas las sucursales** de una marca, reemplazando variables de plantilla (`{{unidad}}`, `{{link}}`) por cada una.
- Cada publicación queda registrada (`clima_publicaciones`) con su `post_id`, audiencia y segmentación.
- Apunta a un **workspace de Humand separado**, sin tocar la operación corporativa.

---

## 11. Novedades recientes (integración con el resto del sistema)

- **El índice de clima ya aparece en el dashboard de inicio de Capital Humano** (`/capital-humano/dashboard`): índice 0–100, clasificación, participación y nº de respuestas, como un KPI más junto a los de Fortia/Humand. Defensivo: si no hay datos, muestra 0/—  sin romper.
- **Alertas inteligentes por umbral:** el sistema de alertas evalúa el índice de clima contra un umbral configurable (default 70). Si cae por debajo, genera una alerta **"Clima laboral en riesgo"** visible en la campana del header, junto con las de rotación, cobertura y adopción Humand.

---

## 12. Comandos automatizables (CLI)

| Comando | Función |
|---|---|
| `clima:calcular [--campana_id=ID]` | Procesa respuestas → índices general y por factor. |
| `clima:generar-planes [--umbral=80] [--nivel_ref_id=ID]` | Crea planes para factores por debajo del umbral. |
| `clima:generar-objetivos [--meta=80] [--nivel_ref_id=ID]` | Crea objetivos meta-vs-resultado por factor. |

> Estos comandos también se ejecutan automáticamente (recálculo lazy) al abrir reportes o al cerrar el período, por lo que **no requieren un cron obligatorio**.

---

## 13. Endpoints principales (API)

**Públicos (encuestado, sin login):**

- `GET /clima/publica/{code}` — encuesta pública por código.
- `GET /clima/modelo/{code}/codigos` — códigos de la sesión activa.
- `POST /clima/codigos/{codigo}/iniciar` — toma un código (transacción segura).
- `POST /clima/responder-sesion` — guarda respuesta anónima + participación.

**Administración / análisis (protegidos):**

- `GET /clima/dashboard` — índice general, por nivel y por factor (+ filtros).
- `GET /clima/participacion` · `POST /clima/participacion/padron` — tasa real y padrón.
- `GET /clima/resultados` · `GET /clima/planes` · `PATCH /clima/planes/{id}` · `GET /clima/objetivos`.
- `GET/POST /clima/modelos` · `PATCH /clima/modelos/{id}/toggle` — unidades.
- `GET /clima/banco` · `POST /clima/banco/aplicar` — banco de preguntas.
- `GET /clima/periodo` · `POST /clima/periodo/{abrir|cerrar|nuevo|reiniciar}` — ciclo.
- `POST /clima/humand/publicar/{modeloId}` · `POST /clima/humand/publicar-marca` — difusión.

---

## 14. Estado y valor entregado

El módulo de Clima Laboral está **operativo de punta a punta**: configurar, difundir, recolectar (anónimo), analizar y actuar. Aporta a la organización:

- Una **medición confiable y anónima** del clima, segmentada por toda la estructura.
- **Transparencia estadística** (participación + confiabilidad), evitando decisiones sobre datos no representativos.
- **Acción automática** (planes y objetivos) que convierte la medición en mejora continua.
- **Visibilidad ejecutiva** inmediata (tableros, mapa de calor, alertas) y conexión con el resto del Capital Humano (dashboard de inicio + alertas).

---

*Documento generado a partir del análisis del código real del módulo (migraciones `clima_*`, controladores `ClimaLaboralController`, `ClimaEncuestasController`, `ClimaSessionesController`, `ClimaPeriodoController`, `ClimaHumandController`, servicios `ClimaScopeService` y `ClimaRecalculoService`, comandos `clima:*`, y vistas `views/apps/humand/clima/`).*
