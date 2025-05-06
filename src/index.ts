#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "mcp-server-ts",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [] };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "name_of_tool") {
    return {};
  }
  throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);