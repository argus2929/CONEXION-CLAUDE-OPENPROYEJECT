// Prueba automática del servidor MCP: lo lanza, hace el handshake, lista las
// herramientas y ejecuta una lectura real (op_listar_tareas).
// Uso:  node --use-system-ca src/smoke-mcp.js
import { spawn } from 'node:child_process';
import path from 'node:path';

const server = spawn('node', ['--use-system-ca', path.join(import.meta.dirname, 'mcp-server.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buf = '';
const pending = new Map();
server.stdout.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  }
});

const send = (obj) => server.stdin.write(JSON.stringify(obj) + '\n');
const rpc = (id, method, params) =>
  new Promise((resolve) => { pending.set(id, resolve); send({ jsonrpc: '2.0', id, method, params }); });

try {
  const init = await rpc(1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'smoke', version: '1.0' },
  });
  console.log('1) initialize OK:', JSON.stringify(init.result?.serverInfo));

  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  const tools = await rpc(2, 'tools/list', {});
  console.log('2) Herramientas:', tools.result?.tools?.map((t) => t.name).join(', '));

  const call = await rpc(3, 'tools/call', { name: 'op_listar_tareas', arguments: { solo_abiertas: true } });
  console.log('\n3) op_listar_tareas =>\n' + (call.result?.content?.[0]?.text || JSON.stringify(call.result)));

  console.log('\n✅ Smoke test OK.');
} catch (e) {
  console.error('❌ Smoke test falló:', e.message);
  process.exitCode = 1;
} finally {
  server.kill();
}
