import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SharedDB } from '../utils/shared-db';

export interface MCPServerInterface {
    name: string;
    server: McpServer;
    init: () => Promise<void>;
    buildMcpServer: () => McpServer;
    registerServer: (url: string) => void;
    unregisterServer: () => void;
    getServers: () => { id: string, url: string }[];
};
