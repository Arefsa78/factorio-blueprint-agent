import base64
import os
import re
import zlib
import json
from blueprint_db import BlueprintDB

DATA_PATH = "data-bp/"

def make_json(bp_string):
    """
    Convert a base64-encoded, zlib-compressed string to a JSON object.
    
    Args:
        bp_string (str): The base64-encoded, zlib-compressed string.
        
    Returns:
        dict: The JSON object.
    """
    # Remove the first character if it's a version byte
    if bp_string[0] in "0123456789":
        bp_data = bp_string[1:]
    else:
        bp_data = bp_string
    
    try:
        # Decode and decompress
        decoded = base64.b64decode(bp_data)
        decompressed = zlib.decompress(decoded)
        json_str = decompressed.decode('utf-8')
    except (base64.binascii.Error, zlib.error, UnicodeDecodeError) as e:
        print(f"Error decoding or decompressing: {e}")
        return None
    # Decode to string and parse JSON
    json_data = json.loads(json_str)
    
    return json_data

# Initialize DB
bp_db = BlueprintDB()
bp_db.initialize()

# MARK: LIST ALL FILES
directories = os.listdir(DATA_PATH)
all_files = []
for i, directory in enumerate(directories):
    print(f"\rProcessing directory {i+1}/{len(directories)}: {directory}", end="", flush=True)
    # list all files in the directory
    files = os.listdir(os.path.join(DATA_PATH, directory))
    for file in files:
        if not file.endswith(".json"):
            continue
        all_files.append(os.path.join(DATA_PATH, directory, file))

print()

# MARK: TO JSON
n_files = len(all_files)
for i, file in enumerate(all_files[:]):
    print(f"\rProcessing file {i+1}/{n_files}: {file}", end="", flush=True)
    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)

    bp_string = data.get("blueprintString", None)
    if not bp_string:
        print(f"File {file} does not contain a blueprint string.")
        continue
    
    # Convert the blueprint string to JSON
    json_data = make_json(bp_string)
    if not json_data:
        print(f"File {file} does not contain a valid blueprint string.")
        continue
    
    tags = data.get("tags", {})
    title = data.get("title", "")
    lastUpdatedDate = data.get("lastUpdatedDate", "")
    descriptionMarkdown = data.get("descriptionMarkdown", "")
    author = data.get("author", "")
    if isinstance(author, dict):
        author = author.get("userID", "")

    # Save to DB using the class
    bp_db.add_blueprint(json_data, tags, title, lastUpdatedDate, descriptionMarkdown, author)

bp_db.close()