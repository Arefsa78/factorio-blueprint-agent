import sqlite3
import os

class WikiDB:
    def __init__(self, db_path: str = 'wiki.db'):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self.md_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db-data', 'wiki')
        os.makedirs(self.md_dir, exist_ok=True)

    def initialize(self):
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS wiki (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                md_path TEXT
            )
        ''')
        self.conn.commit()

    def add_wiki_page(self, name: str, md_text: str):
        md_filename = f"{name.replace('/', '_').replace(' ', '_')}.md"
        md_path = os.path.join(self.md_dir, md_filename)
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_text)
        rel_md_path = os.path.relpath(md_path, os.path.dirname(os.path.abspath(__file__)))
        self.cursor.execute(
            "INSERT OR REPLACE INTO wiki (name, md_path) VALUES (?, ?)",
            (name, rel_md_path)
        )
        self.conn.commit()

    def close(self):
        if self.conn:
            self.conn.close()
