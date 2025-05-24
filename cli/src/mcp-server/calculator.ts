import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getLogger } from "../log-config";
import { MCPServerInterface } from "./mcp-interface";
import { SharedDB } from '../utils/shared-db';

const logger = getLogger('calculator-server');

export class MCPCalculatorServer implements MCPServerInterface {
  public name: string;
  public server: McpServer;

  constructor(name: string) {
    this.name = name;
    this.server = new McpServer({
      name: this.name,
      version: "0.0.1",
    });
    this.buildMcpServer();
  }

  public async init() {
    // No async initialization needed for this server
  }

  public buildMcpServer(): McpServer {
    this.server.tool(
      "calculator-add",
      "Calculate the sum of two numbers",
      { a: z.number(), b: z.number() },
      async ({ a, b }) => this.add(a, b)
    );
    this.server.tool(
      "calculator-subtract",
      "Calculate the difference of two numbers",
      { a: z.number(), b: z.number() },
      async ({ a, b }) => this.subtract(a, b)
    );
    this.server.tool(
      "calculator-multiply",
      "Calculate the product of two numbers",
      { a: z.number(), b: z.number() },
      async ({ a, b }) => this.multiply(a, b)
    );
    this.server.tool(
      "calculator-divide",
      "Calculate the quotient of two numbers",
      { a: z.number(), b: z.number() },
      async ({ a, b }) => this.divide(a, b)
    );

    return this.server;
  }

  public async add(a: number, b: number): Promise<any> {
    logger.debug(`Adding ${a} and ${b}`);
    const result = a + b;
    return {
      content: [
        {
          type: "text",
          text: `${result}`
        }
      ]
    };
  }

  public async subtract(a: number, b: number): Promise<any> {
    logger.debug(`Subtracting ${b} from ${a}`);
    const result = a - b;
    return {
      content: [
        {
          type: "text",
          text: `${result}`
        }
      ]
    };
  }

  public async multiply(a: number, b: number): Promise<any> {
    logger.debug(`Multiplying ${a} and ${b}`);
    const result = a * b;
    return {
      content: [
        {
          type: "text",
          text: `${result}`
        }
      ]
    };
  }

  public async divide(a: number, b: number): Promise<any> {
    logger.debug(`Dividing ${a} by ${b}`);
    let result;
    if (b === 0) {
      result = 'infinity';
    }
    else {
      result = a / b;
    }
    return {
      content: [
        {
          type: "text",
          text: `${result}`
        }
      ]
    };
  }

  public registerServer(url: string) {
    SharedDB.upsertServer({
      id: this.name,
      url
    });
  }

  public unregisterServer() {
    SharedDB.removeServer(this.name);
  }

  public getServers() {
    return SharedDB.getServers();
  }
}
