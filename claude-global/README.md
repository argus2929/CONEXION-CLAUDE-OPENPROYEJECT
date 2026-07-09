# Acceso global (desde cualquier proyecto)

Para usar el sistema sin estar en esta carpeta:

1. Registra el MCP a nivel usuario (ajusta la ruta a donde clonaste el repo):
   claude mcp add-json openproject '{"command":"node","args":["--use-system-ca","C:/RUTA/AL/REPO/src/mcp-server.js"]}' --scope user
2. Copia `agente-openproject.md` a `~/.claude/agents/openproject.md` (ajusta rutas internas).
3. Copia `comando-op.md` a `~/.claude/commands/op.md`.
4. Reinicia Claude Code. Desde cualquier proyecto: `/op <lo que necesites>`.
