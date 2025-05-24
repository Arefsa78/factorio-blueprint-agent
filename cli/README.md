# TL;DR
```bash
git clone https://github.com/Arefsa78/ai-cli.git
npm install
npm install --save-dev typescript ts-node
npm install --save-dev @types/node
npx tsc
npm link

fmeow meow # runs the cli with great ux
```
You can first run mcp servers then run a re-act agent connected to all available mcp servers.

# To Build:

```bash
# Install dependencies
npm install
npm install --save-dev typescript ts-node
npm install --save-dev @types/node
npx tsc
```

```bash
# To Link (Optional):
This command will create a symbolic link in the global node_modules directory, allowing you to use the package globally without having to install it separately.

```bash
npm link
```

# To Run and use agents:

```bash
meow mcp -k <mcpKind> -p <port> # runs a mcp server
meow agent tool-call # runs an agent connected to all available mcp servers (run it in another terminal)
```

# To Debug MCP servers:

```bash
meow mcp -k <mcpKind> -p <port> # runs a mcp server
npx @modelcontextprotocol/inspector node build/index.js
```
