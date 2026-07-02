// Ejecuta un PLAN de avances contra OpenProject: primero en VISTA PREVIA
// (solo lectura, valida todo) y con --aplicar escribe los cambios.
//
//   node --use-system-ca src/aplicar-plan.js <plan.json>            → vista previa
//   node --use-system-ca src/aplicar-plan.js <plan.json> --aplicar  → aplica
//   (o: npm run plan -- <plan.json> [--aplicar])
//
// Formato del plan (lo genera Claude a partir del .md de avances del programador):
// {
//   "titulo": "Avances junio 2026",
//   "operaciones": [
//     { "accion": "actualizar", "id": 1207, "estado": "In testing",
//       "titulo": "opcional: renombrar", "descripcion": "opcional",
//       "modo_descripcion": "reemplazar" | "agregar", "comentario": "opcional" },
//     { "accion": "crear", "proyecto": "21 | identificador | nombre", "titulo": "…",
//       "tipo": "Feature", "padre_id": 1207, "descripcion": "…",
//       "estado": "Tested", "comentario": "…" },
//     { "accion": "tiempo", "id": 1156, "horas": 2.5, "fecha": "2026-06-18", "comentario": "…" }
//   ]
// }
try { process.loadEnvFile('.env'); } catch {}

import { readFileSync } from 'node:fs';
import {
  getWorkPackage,
  simplifyWP,
  estadosPermitidos,
  avanzarHastaEstado,
  aplicarAvance,
  actualizarDescripcion,
  agregarADescripcion,
  actualizarCampos,
  comentar,
  crearWorkPackage,
  registrarTiempo,
  listTimeActivities,
  listStatuses,
  resolverProyecto,
  resolverTipo,
} from './openproject.js';

const archivo = process.argv[2];
const aplicar = process.argv.includes('--aplicar');

if (!archivo) {
  console.log('Uso: node --use-system-ca src/aplicar-plan.js <plan.json> [--aplicar]');
  process.exit(1);
}

let plan;
try {
  plan = JSON.parse(readFileSync(archivo, 'utf8'));
} catch (e) {
  console.error(`❌ No pude leer el plan "${archivo}": ${e.message}`);
  process.exit(1);
}

const ops = plan.operaciones || [];
if (!ops.length) {
  console.error('❌ El plan no tiene operaciones.');
  process.exit(1);
}

const log = (m) => console.log(m);
const recorte = (s, n = 70) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

// ── VISTA PREVIA ─────────────────────────────────────────────────────────────
async function preview() {
  log(`\n📋 VISTA PREVIA — ${plan.titulo || archivo}  (${ops.length} operaciones)\n`);
  const estados = await listStatuses();
  const nombresEstado = estados.map((s) => s.nombre.toLowerCase());
  let errores = 0;

  for (const [i, op] of ops.entries()) {
    const n = `${i + 1}.`;
    try {
      if (op.accion === 'actualizar') {
        const wp = simplifyWP(await getWorkPackage(op.id));
        log(`${n} ACTUALIZAR #${op.id} — ${wp.asunto} (${wp.proyecto})`);
        log(`   Ahora: ${wp.estado} (${wp.avance ?? 0}%)`);
        if (op.estado) {
          if (!nombresEstado.includes(String(op.estado).toLowerCase())) {
            log(`   ⚠️ El estado "${op.estado}" no existe en la instancia.`);
            errores++;
          } else {
            const permitidos = (await estadosPermitidos(op.id)).map((s) => s.name);
            const directo = permitidos.some((p) => p.toLowerCase() === String(op.estado).toLowerCase());
            log(`   Estado → ${op.estado}${directo ? '' : ' (avanzará por pasos intermedios)'}`);
          }
        }
        if (op.titulo) log(`   Renombrar → "${op.titulo}"`);
        if (op.descripcion) log(`   Descripción (${op.modo_descripcion || 'reemplazar'}): ${recorte(op.descripcion)}`);
        if (op.comentario) log(`   Comentario: ${recorte(op.comentario)}`);
        if (!op.estado && !op.titulo && !op.descripcion && !op.comentario) {
          log('   ⚠️ Operación vacía: no indica ningún cambio.');
          errores++;
        }
      } else if (op.accion === 'crear') {
        const proj = await resolverProyecto(op.proyecto);
        if (!proj) { log(`${n} CREAR "${op.titulo}" — ❌ proyecto "${op.proyecto}" no encontrado`); errores++; continue; }
        const t = await resolverTipo(op.tipo || 'Feature');
        if (!t) { log(`${n} CREAR "${op.titulo}" — ❌ tipo "${op.tipo}" no existe`); errores++; continue; }
        log(`${n} CREAR en "${proj.name}": ${op.titulo} (${t.nombre})`);
        if (op.padre_id) {
          try {
            const padre = simplifyWP(await getWorkPackage(op.padre_id));
            log(`   Padre: #${padre.id} — ${padre.asunto}`);
          } catch { log(`   ⚠️ Padre #${op.padre_id} no existe.`); errores++; }
        }
        if (op.estado) log(`   Estado inicial → ${op.estado}`);
        if (op.descripcion) log(`   Descripción: ${recorte(op.descripcion)}`);
        if (op.comentario) log(`   Comentario: ${recorte(op.comentario)}`);
        if (!op.descripcion) { log('   ⚠️ Sin descripción: la tarea quedaría vacía.'); errores++; }
      } else if (op.accion === 'tiempo') {
        const wp = simplifyWP(await getWorkPackage(op.id));
        if (!(Number(op.horas) > 0)) { log(`${n} TIEMPO #${op.id} — ❌ horas inválidas: ${op.horas}`); errores++; continue; }
        if (op.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(op.fecha)) {
          log(`${n} TIEMPO #${op.id} — ❌ fecha inválida: ${op.fecha} (usa YYYY-MM-DD)`); errores++; continue;
        }
        log(`${n} TIEMPO #${op.id} — ${wp.asunto}: ${op.horas} h${op.fecha ? ` (${op.fecha})` : ' (hoy)'}`);
        if (op.comentario) log(`   Nota: ${recorte(op.comentario)}`);
      } else {
        log(`${n} ❌ Acción desconocida: "${op.accion}" (usa actualizar | crear | tiempo)`);
        errores++;
      }
    } catch (e) {
      log(`${n} ❌ ${op.accion} ${op.id ?? op.titulo ?? ''}: ${e.message}`);
      errores++;
    }
    log('');
  }

  if (errores) {
    log(`⚠️ ${errores} problema(s) detectado(s). Corrige el plan antes de aplicar.`);
    process.exitCode = 1;
  } else {
    log('✅ Plan válido. Para aplicarlo:');
    log(`   npm run plan -- ${archivo} --aplicar`);
  }
}

// ── APLICAR ──────────────────────────────────────────────────────────────────
async function ejecutar() {
  log(`\n🚀 APLICANDO — ${plan.titulo || archivo}  (${ops.length} operaciones)\n`);
  let fallos = 0;
  const tocadas = new Set();

  for (const [i, op] of ops.entries()) {
    const n = `${i + 1}.`;
    try {
      if (op.accion === 'actualizar') {
        if (op.titulo || op.descripcion) {
          if (op.descripcion && op.modo_descripcion === 'agregar') {
            await agregarADescripcion(op.id, op.descripcion);
            if (op.titulo) await actualizarCampos(op.id, { subject: op.titulo });
          } else {
            await actualizarCampos(op.id, { subject: op.titulo, descripcion: op.descripcion });
          }
        }
        if (op.estado) await avanzarHastaEstado(op.id, op.estado, { comentario: op.comentario });
        else if (op.comentario) await aplicarAvance(op.id, { comentario: op.comentario });
        tocadas.add(op.id);
        log(`${n} ✅ #${op.id} actualizada`);
      } else if (op.accion === 'crear') {
        const proj = await resolverProyecto(op.proyecto);
        if (!proj) throw new Error(`proyecto "${op.proyecto}" no encontrado`);
        const t = await resolverTipo(op.tipo || 'Feature');
        if (!t) throw new Error(`tipo "${op.tipo}" no existe`);
        const wp = await crearWorkPackage({
          projectId: proj.id,
          subject: op.titulo,
          typeHref: t.href,
          parentId: op.padre_id,
          descripcion: op.descripcion,
        });
        if (op.estado) await avanzarHastaEstado(wp.id, op.estado, { comentario: op.comentario });
        else if (op.comentario) await comentar(wp.id, op.comentario);
        tocadas.add(wp.id);
        log(`${n} ✅ creada #${wp.id} — ${op.titulo}`);
      } else if (op.accion === 'tiempo') {
        const { actividades } = await listTimeActivities(op.id);
        const dev = actividades.find((a) => a.nombre.toLowerCase() === 'development');
        await registrarTiempo({
          workPackageId: op.id,
          horas: op.horas,
          fecha: op.fecha,
          comentario: op.comentario,
          activityHref: dev?.href,
        });
        tocadas.add(op.id);
        log(`${n} ✅ ${op.horas} h registradas en #${op.id}`);
      } else {
        throw new Error(`acción desconocida "${op.accion}"`);
      }
    } catch (e) {
      log(`${n} ❌ ${op.accion} ${op.id ?? op.titulo ?? ''}: ${e.message}`);
      fallos++;
    }
  }

  log('\n=== VERIFICACIÓN FINAL ===');
  for (const id of [...tocadas].sort((a, b) => a - b)) {
    try {
      const wp = simplifyWP(await getWorkPackage(id));
      log(`  #${wp.id} [${wp.avance ?? 0}%] ${wp.estado} — ${wp.asunto} (${wp.proyecto})`);
    } catch { /* la verificación no debe tumbar el resumen */ }
  }
  log(fallos ? `\n⚠️ Terminado con ${fallos} fallo(s).` : '\n✅ Todo aplicado sin errores.');
  if (fallos) process.exitCode = 1;
}

await (aplicar ? ejecutar() : preview());
