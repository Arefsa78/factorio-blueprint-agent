import json
import zlib
import base64

# Remove possible BOM and comments from o.json (UTF-16 LE)
with open('o.json', 'r', encoding='utf-16') as f:
    lines = f.readlines()
    filtered = ''.join(line for line in lines if not line.strip().startswith('//'))
    data = json.loads(filtered)

# Stringify JSON (no whitespace)
json_str = json.dumps(data, separators=(',', ':'))

# Compress with zlib (raw DEFLATE, no headers)
compressed = zlib.compress(json_str.encode('utf-8'))

# Base64 encode
b64 = base64.b64encode(compressed).decode('ascii')

# Prepend version byte (0)
result = '0' + b64

# Output result
print(result)