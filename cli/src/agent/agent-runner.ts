import * as readline from 'node:readline/promises';

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { AgentInterface } from "./agent-interface";
import { TollCallAgent } from "./tool-call";
import { SharedDB } from '../utils/shared-db';
import { getLogger } from "../log-config";
import { SimpleMemory } from './memory/simple-memory';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

const logger = getLogger('agent-runner');

export enum AgentKind {
    ToolCall = "tool-call",
}

export class AgentRunner {
    public agent: AgentInterface | null = null;
    public clients: Client[] = [];
    public memory: SimpleMemory = new SimpleMemory();

    public async initialize(agent: AgentKind) {
        const tools = await this.getTools();
        switch (agent) {
            case AgentKind.ToolCall:
                this.agent = new TollCallAgent(tools);
                break;
            default:
                throw new Error(`Unknown agent kind: ${agent}`);
        }
        logger.info(`Agent ${agent} initialized`);
    }

    private async getTools() {
        const servers = SharedDB.getServers();
        if (servers.length === 0) {
            throw new Error("No MCP servers found. Please start a MCP server first.");
        }

        const tools = [];
        for (const server of servers) {
            logger.debug(`Connecting to MCP server: ${server.url}`);
            const url = new URL(`${server.url}`);
            const transport: Transport = new StreamableHTTPClientTransport(url);
            logger.debug(`Transport created: ${transport}`);
            const client = new Client({ name: server.id, version: "1.0.0" });
            await client.connect(transport);
            logger.debug(`Client connected: ${client}`);
            this.clients.push(client);
            logger.debug(`Connected to MCP server: ${server.id} at ${server.url}`);

            const mcpTools = await loadMcpTools(server.id, client);
            logger.debug(`Loaded MCP tools: ${mcpTools}`);
            tools.push(...mcpTools);
        }
        logger.debug(`Loaded ${tools.length} tools`);
        return tools;
    }

    public async run(): Promise<void> {
        if (!this.agent) {
            throw new Error("Agent is not initialized. Please call initilize() first.");
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        while (true) {
            const prompt = await rl.question("You: ")
            if (prompt.toLowerCase() === "exit") {
                break;
            }
            this.memory.addMessage(new HumanMessage(prompt));
            logger.debug(`User prompt: ${prompt}`);
            const response = await this.agent.invoke(this.memory.getMessages());
            this.memory.addMessage(new AIMessage(response));
            console.log(`Agent: ${response}`);
        };
        this.memory.saveMessagesToMarkdown();
        rl.close();
    }
}