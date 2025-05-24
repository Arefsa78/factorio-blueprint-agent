import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open, Database as SqliteDatabase } from "sqlite";
import { getLogger } from "../log-config";
import { MCPServerInterface } from "./mcp-interface";
import { SharedDB } from "../utils/shared-db";

const logger = getLogger("wiki-server");

export const WIKI_PAGE_SIZE = 20;

const DB_PATH = path.join(__dirname, "../../db/wiki.db");
const WIKI_DIR = path.join(__dirname, "../../db");

export class MCPWikiServer implements MCPServerInterface {
  public name: string;
  public server: McpServer;
  private db!: SqliteDatabase;

  constructor(name: string) {
    this.name = name;
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
    // Search tool: keyword in name, paginated
    this.server.tool(
      "wiki-search",
      "Search wiki pages by keyword in name, paginated.",
      { keyword: z.string(), page: z.number().min(1) },
      async ({ keyword, page }) => this.searchWiki(keyword, page)
    );
    // Get tool: fetch wiki Markdown by file path
    this.server.tool(
      "wiki-get",
      "Get wiki Markdown content by file path.",
      { md_path: z.string() },
      async ({ md_path }) => this.getWikiMarkdown(md_path)
    );
    return this.server;
  }

  private async searchWiki(keyword: string, page: number): Promise<any> {
    const pageSize = WIKI_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    const like = `%${keyword.replace(/[%_]/g, "")}%`;
    const results = await this.db.all(
      `SELECT id, name, md_path FROM wiki WHERE name LIKE ? ORDER BY id ASC LIMIT ? OFFSET ?`,
      like,
      pageSize,
      offset
    );
    logger.debug(`Wiki search for '${keyword}' page ${page}: ${results.length} results`);
    logger.debug(JSON.stringify(results));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results),
        },
      ],
    };
  }

  private async getWikiMarkdown(md_path: string): Promise<any> {
    const absPath = path.join(WIKI_DIR, md_path);
    if (!fs.existsSync(absPath)) {
      logger.warn(`Wiki Markdown not found: ${absPath}`);
      return {
        content: [
          {
            type: "text",
            text: `Wiki Markdown not found: ${md_path}`,
          },
        ],
      };
    }
    const mdData = fs.readFileSync(absPath, "utf-8");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(mdData).replace(/\n/g, '').replace(/"/g, '\"'),
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