import sqlite3
import json
import os
from typing import List, Optional

PAGE_SIZE = 10

class Blueprint:
    def __init__(self, id: int, json_path: str, tags: dict, title: str, lastUpdatedDate: str, descriptionMarkdown: str, author: str):
        self.id = id
        self.json_path = json_path
        self.tags = tags
        self.title = title
        self.lastUpdatedDate = lastUpdatedDate
        self.descriptionMarkdown = descriptionMarkdown
        self.author = author

    def __repr__(self):
        return f"<Blueprint id={self.id} title={self.title!r}>"

class BlueprintDB:
    def __init__(self, db_path: str = 'blueprints.db'):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self.json_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db-data', 'blueprints')
        os.makedirs(self.json_dir, exist_ok=True)

    def initialize(self):
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS blueprints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                json_path TEXT,
                tags TEXT,
                title TEXT,
                lastUpdatedDate TEXT,
                descriptionMarkdown TEXT,
                author TEXT
            )
        ''')
        self.conn.commit()

    def add_blueprint(self, json_data: dict, tags: dict, title: str, lastUpdatedDate: str, descriptionMarkdown: str, author: str):
        # Save json_data to file
        self.cursor.execute("SELECT MAX(id) FROM blueprints")
        max_id = self.cursor.fetchone()[0]
        next_id = (max_id or 0) + 1
        json_filename = f"blueprint_{next_id}.json"
        json_path = os.path.join(self.json_dir, json_filename)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False)
        rel_json_path = os.path.relpath(json_path, os.path.dirname(os.path.abspath(__file__)))
        self.cursor.execute(
            "INSERT INTO blueprints (json_path, tags, title, lastUpdatedDate, descriptionMarkdown, author) VALUES (?, ?, ?, ?, ?, ?)",
            (
                rel_json_path,
                json.dumps(tags, ensure_ascii=False),
                title,
                lastUpdatedDate,
                descriptionMarkdown,
                author
            )
        )
        self.conn.commit()

    def query_blueprints(self, query: Optional[str] = None, page: int = 0, **kwargs) -> List[Blueprint]:
        sql = "SELECT * FROM blueprints WHERE 1=1"
        params = []
        # Search in tags, title, descriptionMarkdown
        if query:
            sql += " AND (tags LIKE ? OR title LIKE ? OR descriptionMarkdown LIKE ?)"
            like_query = f"%{query}%"
            params.extend([like_query, like_query, like_query])
        # Filter by any other columns (substring search for title, tags, descriptionMarkdown)
        for col, val in kwargs.items():
            if val:
                if col in ["title", "tags", "descriptionMarkdown"]:
                    sql += f" AND {col} LIKE ?"
                    params.append(f"%{val}%")
                else:
                    sql += f" AND {col} = ?"
                    params.append(val)
        self.cursor.execute(sql, params)
        rows = self.cursor.fetchall()
        results = []
        for row in rows:
            id, json_path, tags, title, lastUpdatedDate, descriptionMarkdown, author = row
            results.append(Blueprint(
                id,
                json_path,
                json.loads(tags),
                title,
                lastUpdatedDate,
                descriptionMarkdown,
                author
            ))
        return results

    def close(self):
        if self.conn:
            self.conn.close()
