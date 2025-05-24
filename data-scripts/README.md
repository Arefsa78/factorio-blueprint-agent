# Data Scripts Documentation

This directory contains scripts for processing blueprint and wiki data for the Factorio Meow project.

## `git_to_json.py`

This script reads all blueprint files from the `data-bp/` directory (which should be populated by cloning the relevant git repository), decodes and decompresses the blueprint strings, and stores the resulting JSON data in a SQLite database (`blueprints.db`).

- **Input:** Blueprint `.json` files in subdirectories of `data-bp/`.
- **Process:**
  - Reads each file, extracts the `blueprintString`, decodes it from base64, decompresses it with zlib, and parses the JSON.
  - Collects metadata such as tags, title, last updated date, description, and author.
  - Stores the blueprint data and metadata in the `blueprints.db` database using the `BlueprintDB` class.
- **Output:** `blueprints.db` SQLite database containing all processed blueprints.

## `wiki_extractor.py`

This script scrapes the Factorio wiki to extract information and stores it in a SQLite database (`wiki.db`).

- **Input:** List of wiki page links in `data-wiki/links.json`.
- **Process:**
  - For each link, fetches the corresponding wiki page.
  - Extracts the content of the infobox (if present) and formats it as Markdown.
  - Stores the extracted information in the `wiki.db` database using the `WikiDB` class.
- **Output:** `wiki.db` SQLite database containing structured wiki information.

---

Both scripts require their respective database classes (`blueprint_db.py` and `wiki_db.py`) to be present in the same directory. Make sure to install any required dependencies (e.g., `beautifulsoup4`, `requests`) before running the scripts.
