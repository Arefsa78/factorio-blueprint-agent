import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open, Database as SqliteDatabase } from "sqlite";
import { getLogger } from "../log-config";
import { MCPServerInterface } from "./mcp-interface";
import { SharedDB } from "../utils/shared-db";

const logger = getLogger("blueprint-server");

// Configurable page size constant
export const BLUEPRINT_PAGE_SIZE = 20;

const DB_PATH = path.join(__dirname, "../../db/blueprints.db");
const BLUEPRINTS_DIR = path.join(__dirname, "../../db");

export class MCPBlueprintServer implements MCPServerInterface {
  public name: string;
  public server: McpServer;
  private db!: SqliteDatabase;

  constructor(name: string) {
    this.name = name;
    // Database will be opened asynchronously in init()
    this.server = new McpServer({
      name: this.name,
      version: "0.0.1",
    });
    // Don't call buildMcpServer here, wait for async init
  }

  public async init() {
    this.db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY,
    });
    this.buildMcpServer();
  }

  public buildMcpServer(): McpServer {
    // Search tool: keyword in title/description, paginated
    this.server.tool(
      "blueprint-search",
      "Search blueprints by keyword in title or description, paginated.",
      { keyword: z.string(), page: z.number().min(1) },
      async ({ keyword, page }) => this.searchBlueprints(keyword, page)
    );
    // Get tool: fetch blueprint JSON by file path
    this.server.tool(
      "blueprint-get",
      "Get blueprint JSON data by file path.",
      { json_path: z.string() },
      async ({ json_path }) => this.getBlueprintJson(json_path)
    );
    return this.server;
  }

  public async searchBlueprints(keyword: string, page: number): Promise<any> {
    const pageSize = BLUEPRINT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const like = `%${keyword.replace(/[%_]/g, "")}%`;
    const results = await this.db.all(
      `SELECT id, json_path, title, descriptionMarkdown, author, tags, lastUpdatedDate
       FROM blueprints
       WHERE title LIKE ? OR descriptionMarkdown LIKE ?
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      like,
      like,
      pageSize,
      offset
    );
    logger.debug(`Blueprint search for '${keyword}' page ${page}: ${results.length} results`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results),
        },
      ],
    };
  }

  public async getBlueprintJson(json_path: string): Promise<any> {
    const absPath = path.join(BLUEPRINTS_DIR, json_path);
    if (!fs.existsSync(absPath)) {
      logger.warn(`Blueprint JSON not found: ${absPath}`);
      return {
        content: [
          {
            type: 'text',
            text: `Blueprint JSON not found: ${json_path}`,
          },
        ],
      };
    }
    const jsonData = JSON.parse(fs.readFileSync(absPath, "utf-8"));
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(jsonData),
        },
      ],
    };
  }

  public registerServer(url: string) {
    SharedDB.upsertServer({
      id: this.name,
      url,
    });
  }

  public unregisterServer() {
    SharedDB.removeServer(this.name);
  }

  public getServers() {
    return SharedDB.getServers();
  }
}
