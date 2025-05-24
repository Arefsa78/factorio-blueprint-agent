import inquirer from 'inquirer';
import { getLogger } from './log-config';
import { MCPKind, MCPRunner } from './mcp-server/mcp-runner';
import { llm } from './utils/llm';
import { AgentKind, AgentRunner } from './agent/agent-runner';

const logger = getLogger('cli');

async function promptGreet() {
    const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Who do you want to greet?', validate: v => !!v || 'Name is required.' },
        { type: 'input', name: 'title', message: 'Title (optional):' }
    ]);
    logger.info(`Greet command executed with name: ${answers.name} and options: ${JSON.stringify(answers)}`);
    const title = answers.title ? `${answers.title} ` : '';
    console.log(`Meow Meow -- ${title}${answers.name}!`);
}

async function promptMCP() {
    // Using input for port with validation and default
    const answers = await inquirer.prompt([
        { 
            type: 'input', 
            name: 'port', 
            message: 'Port number:', 
            default: '6975',
            validate: n => /^\d+$/.test(n) && parseInt(n) > 0 && parseInt(n) < 65536 
                ? true 
                : 'Please enter a valid port number (1-65535).' 
        },
        { 
            type: 'list', 
            name: 'kind', 
            message: 'MCP kind:',
            choices: Object.values(MCPKind),
            // Extra: Inquirer list is navigable, but if you want fuzzy search, swap for 'autocomplete' with 'inquirer-autocomplete-prompt'
        }
    ]);

    logger.info(`MCP command executed with kind: ${answers.kind} and port: ${answers.port}`);
    // (Add kind check if necessary)
    const mcpRunner = new MCPRunner(parseInt(answers.port, 10), answers.kind);
    await mcpRunner.start();
    logger.info(`MCP server of kind ${answers.kind} started on port ${answers.port}.`);

    // (Skipping keeping alive for interactive demo)
}

async function promptLLMTest() {
    const answers = await inquirer.prompt([
        { 
            type: 'input', 
            name: 'prompt', 
            message: 'Prompt for LLM:', 
            validate: v => !!v || 'Prompt is required.' 
        }
    ]);
    logger.info(`LLM test command executed with prompt: ${answers.prompt}`);
    const response = await llm.invoke(answers.prompt);
    console.log(`LLM response: ${response.text}`);
}

async function promptAgent() {
    const answers = await inquirer.prompt([
        { 
            type: 'list', 
            name: 'kind', 
            message: 'Agent kind:',
            choices: Object.values(AgentKind),
        }
    ]);
    logger.info(`Agent command executed with kind: ${answers.kind}`);
    const agentRunner = new AgentRunner();
    await agentRunner.initialize(answers.kind);
    await agentRunner.run();
}

// The MAIN command selection loop
export async function mainMenu() {
    const COMMANDS = [
        { name: 'Greet someone', value: 'greet' },
        { name: 'Run MCP server', value: 'mcp' },
        { name: 'Test LLM prompt', value: 'llm-test' },
        { name: 'Run AI Agent', value: 'agent' },
        { name: 'Exit', value: 'exit' }
    ];

    while (true) {
        const { command } = await inquirer.prompt([
            { 
                type: 'list', 
                name: 'command', 
                message: 'Select a command:', 
                choices: COMMANDS,
                pageSize: 10, // Shows all at once if list is short
                // For search-as-you-type, use inquirer-autocomplete-prompt (see below)
            }
        ]);

        try {
            if (command === 'exit') break;

            switch (command) {
                case 'greet': await promptGreet(); break;
                case 'mcp': await promptMCP(); break;
                case 'llm-test': await promptLLMTest(); break;
                case 'agent': await promptAgent(); break;
            }
        } catch (err) {
            console.error("An error occurred:", err);
        }

        console.log('\n-----------------------\n');
    }

    console.log('Goodbye!');
}