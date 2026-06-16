// Probador de conexión. Ejecuta:  npm run test:conn
// Verifica el token, muestra tu usuario, proyectos y tus tareas abiertas.

try {
  process.loadEnvFile('.env');
} catch {
  console.error('Aviso: no se encontró el archivo .env en esta carpeta.');
}

import { getInstanceInfo, getMe, listProjects, myWorkPackages } from './openproject.js';

async function main() {
  console.log('Conectando a OpenProject...\n');

  const info = await getInstanceInfo();
  console.log('Instancia OK');
  console.log('  Versión (coreVersion):', info.coreVersion || '(desconocida)');

  const me = await getMe();
  console.log(`\nUsuario: ${me.name} (id ${me.id}, login ${me.login})`);

  const projects = await listProjects();
  console.log(`\nProyectos visibles: ${projects.length}`);
  for (const p of projects.slice(0, 15)) {
    console.log(`  - [${p.id}] ${p.name} (${p.identifier})`);
  }

  const wps = await myWorkPackages({ onlyOpen: true });
  console.log(`\nMis tareas abiertas: ${wps.length}`);
  for (const w of wps.slice(0, 20)) {
    console.log(`  #${w.id} [${w.avance ?? 0}%] ${w.estado} — ${w.asunto} (${w.proyecto})`);
  }

  console.log('\n✅ Conexión verificada.');
}

main().catch((e) => {
  console.error('\n❌ Error:', e.message);
  if (e.status === 401) console.error('   → El token es inválido o expiró. Genera uno nuevo.');
  if (e.status === 403) console.error('   → El usuario no tiene permisos para la API.');
  if (e.code === 'ENOTFOUND' || e.cause) console.error('   → Revisa la URL base o tu conexión a la red.');
  process.exitCode = 1;
});
