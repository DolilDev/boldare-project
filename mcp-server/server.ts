import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isToolError, tools } from "../lib/tools";

/**
 * Serwer MCP (transport stdio) wystawiający DOKŁADNIE te same narzędzia,
 * co web-agent. Logika narzędzi żyje w lib/tools — tutaj tylko ją rejestrujemy.
 */
const server = new McpServer({
  name: "solar-copilot",
  version: "1.0.0",
});

for (const tool of tools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema.shape,
    },
    async (args) => {
      const result = await tool.execute(args as Parameters<typeof tool.execute>[0]);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: isToolError(result),
      };
    },
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Komunikat diagnostyczny idzie na stderr, żeby nie zaśmiecać kanału stdio (JSON-RPC).
  process.stderr.write("Serwer MCP solar-copilot uruchomiony (stdio).\n");
}

main().catch((error) => {
  process.stderr.write(`Błąd serwera MCP: ${String(error)}\n`);
  process.exit(1);
});
