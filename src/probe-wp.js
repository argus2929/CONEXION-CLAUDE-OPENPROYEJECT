// Sonda de capacidad de escritura. NO modifica nada (usa el endpoint /form).
// Uso:  node --use-system-ca src/probe-wp.js 1037
try { process.loadEnvFile('.env'); } catch {}

import { getWorkPackage, getWorkPackageForm, listStatuses } from './openproject.js';

const id = process.argv[2] || '1037';

try {
  const current = await getWorkPackage(id);
  const form = await getWorkPackageForm(id, { lockVersion: current.lockVersion });
  const schema = form?._embedded?.schema || {};

  const campos = ['percentageDone', 'status', 'subject', 'startDate', 'dueDate', 'estimatedTime', 'remainingTime'];
  console.log(`Editabilidad de campos para WP #${id}:`);
  for (const f of campos) {
    const s = schema[f];
    if (s) console.log(`  ${f}: writable=${s.writable}   (${s.name || ''})`);
    else console.log(`  ${f}: (no presente en el schema)`);
  }

  const st = schema.status || {};
  let allowed = st._embedded?.allowedValues;
  if (!allowed && Array.isArray(st._links?.allowedValues)) {
    allowed = st._links.allowedValues.map((l) => ({ name: l.title, _links: { self: { href: l.href } } }));
  }
  allowed = allowed || [];
  console.log('\nEstados permitidos desde el estado actual:');
  for (const s of allowed) console.log(`  - ${s.name}  (${s._links?.self?.href})`);

  console.log('\nTodos los estados del sistema (con % por defecto):');
  for (const s of await listStatuses()) {
    const pct = s.ratio == null ? '—' : `${s.ratio}%`;
    console.log(`  - [${s.id}] ${s.nombre.padEnd(18)} ${pct.padStart(4)}${s.cerrado ? '  (cerrado)' : ''}`);
  }
} catch (e) {
  console.error('❌ Error:', e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 2));
  process.exitCode = 1;
}
