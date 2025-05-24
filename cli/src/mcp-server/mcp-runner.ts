import { getLogger } from "../log-config";
import { MCPCalculatorServer } from "./calculator";
import { MCPServerInterface } from "./mcp-interface";
import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { MCPBlueprintServer } from "./blueprint";
import { MCPWikiServer } from "./wiki";

const logger = getLogger('mcp-runner');

export enum MCPKind {
  CALCULATOR = "calculator",
  BLUEPRINT_DB = "blueprint-db",
  WIKI = "wiki",
}

export class MCPRunner {
  public port: number = 6975;
  public mcpServer: MCPServerInterface | null = null;

  private app?: ReturnType<typeof express>;
  private httpServer?: ReturnType<ReturnType<typeof express>["listen"]>;

  public constructor(port: number, mcpKind: MCPKind) {
    this.port = port;
    this.setMCPServer(mcpKind);
  }

  public setMCPServer(mcpKind: MCPKind): void {
    logger.debug("Setting MCP server...");
    switch (mcpKind) {
      case MCPKind.CALCULATOR:
        this.mcpServer = new MCPCalculatorServer(mcpKind);
        break;
      case MCPKind.BLUEPRINT_DB:
        this.mcpServer = new MCPBlueprintServer(mcpKind);
        break;
      case MCPKind.WIKI:
        this.mcpServer = new MCPWikiServer(mcpKind);
        break;
      default:
        logger.error(`Unknown MCP kind: ${mcpKind}`);
        throw new Error(`Unknown MCP kind: ${mcpKind}`);
    }
    this.mcpServer.init()
  }


  public async start(): Promise<void> {
    if (!this.mcpServer) {
      logger.error("MCP server is not set. Please call setMCPServer() first.");
      throw new Error("MCP server is not set. Please call setMCPServer() first.");
    }

    const url = `/mcp-${this.mcpServer.name}`;
    logger.info(`Starting MCP Calculator Server on port ${this.port} at ${url}`);

    this.app = express();
    this.app.use(express.json());

    // The stateless POST handler
    this.app.post(url, async (req: Request, res: Response) => {
      if (!this.mcpServer) {
        logger.error("MCP server is not set. Please call setMCPServer() first.");
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
        return;
      }
      try {
        logger.debug(`Handling ${url} POST request, body: ${JSON.stringify(req.body)}`);
        const server = this.mcpServer.server;
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // stateless!
        });

        // Clean up on response close
        res.on("close", () => {
          transport.close();
          server.close();
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error(`Error handling ${url} POST request: ${error}`);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          });
        }
      }
    });

    // 405 for GET and DELETE (stateless servers don't support these)
    const methodNotAllowed = (req: Request, res: Response) => {
      res.writeHead(405).end(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
      }));
    };
    this.app.get(url, methodNotAllowed);
    this.app.delete(url, methodNotAllowed);

    // Start listening
    await new Promise<void>((resolve) => {
      this.httpServer = this.app!.listen(this.port, () => {
        logger.info(`MCP Server is running and listening on port ${this.port}`);
        resolve();
      });
    });

    this.mcpServer.registerServer(`http://localhost:${this.port}${url}`);
  }

  public stop(): void {
    if (this.httpServer) {
      this.httpServer.close(() => {
        logger.info(`MCP server (${this.mcpServer?.name}) on port ${this.port} closed`);
      });
      this.mcpServer?.unregisterServer(); // TODO: Make sure it gets deleted and it stops listening
    }
  }
}