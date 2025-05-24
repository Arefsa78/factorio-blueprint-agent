import Database from 'better-sqlite3';
import path from 'path';
import { getLogger } from '../log-config';

const logger = getLogger('shared-db');

export interface MCPServerInfo {
    id: string;
    url: string;
}

export class SharedDB {
    private static dbPath = path.join(__dirname, '../../shared-db.sqlite');
    private static db: Database.Database;

    static {
        SharedDB.db = new Database(SharedDB.dbPath);
        SharedDB.db.exec(`CREATE TABLE IF NOT EXISTS mcp_servers (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL
        )`);
    }

    static upsertServer(info: MCPServerInfo) {
        const stmt = SharedDB.db.prepare(`INSERT INTO mcp_servers (id, url) VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET url=excluded.url`);
        stmt.run(info.id, info.url);
        logger.debug(`Upserting server with id: ${info.id}, url: ${info.url}`);
    }

    static getServers(): MCPServerInfo[] {
        const stmt = SharedDB.db.prepare(`SELECT * FROM mcp_servers`);
        const results = stmt.all() as MCPServerInfo[];
        logger.debug(`Fetching all servers, ${results.length} found`);
        return results;
    }

    static removeServer(id: string) {
        const stmt = SharedDB.db.prepare(`DELETE FROM mcp_servers WHERE id = ?`);
        stmt.run(id);
        logger.debug(`Removing server with id: ${id}`);
    }
}
