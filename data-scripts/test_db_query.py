from blueprint_db import BlueprintDB
from wiki_db import WikiDB

def test_blueprint_db():
    bp_db = BlueprintDB()
    bp_db.initialize()
    keywords = ["science", "train", "circuit"]
    for kw in keywords:
        print(f"\nResults for keyword: '{kw}'")
        results = bp_db.query_blueprints(title=kw)
        for bp in results[:5]:  # Show only first 5 results for brevity
            print(f"ID: {bp.id}, Title: {bp.title}, Author: {bp.author}, Description: {bp.descriptionMarkdown[:60]}...")
        print(f"Total found: {len(results)}")
    bp_db.close()

def test_wiki_db():
    wiki_db = WikiDB()
    wiki_db.initialize()
    wiki_db.cursor.execute("SELECT name, md_path FROM wiki LIMIT 5")
    rows = wiki_db.cursor.fetchall()
    print("\nSample entries from wiki.db:")
    for name, md_path in rows:
        print(f"Name: {name}, Markdown Path: {md_path}")
    print(f"Total entries in wiki.db: {wiki_db.cursor.execute('SELECT COUNT(*) FROM wiki').fetchone()[0]}")
    wiki_db.close()

if __name__ == "__main__":
    # Uncomment the tests you want to run
    test_blueprint_db()
    test_wiki_db()
