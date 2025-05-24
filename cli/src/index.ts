#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { getLogger } from './log-config';
import { MCPKind, MCPRunner } from './mcp-server/mcp-runner';
import { llm } from './utils/llm';
import { AgentKind, AgentRunner } from './agent/agent-runner';
import { mainMenu } from './cli';

const logger = getLogger('index');
logger.info('Starting CLI application...');
logger.warn('Required Environment Variables:')
logger.debug(`AZURRE_OPENAI_API_KEY: ${process.env.AZURE_OPENAI_API_KEY}`);
logger.debug(`AZURE_OPENAI_ENDPOINT: ${process.env.AZURE_OPENAI_ENDPOINT}`);
logger.debug(`AZURE_OPENAI_API_VERSION: ${process.env.AZURE_OPENAI_API_VERSION}`);

const program = new Command();

// MARK: INITIALIZE
program
    .name('my-cli')
    .description('An example TypeScript CLI built with commander')
    .version('1.0.0');
program
    .command('help')
    .description('Display help information')
    .action(() => {
        program.help();
    });

program
    .command('greet <name>')
    .description('Greet someone by name')
    .option('-t, --title <title>', 'Add a title')
    .action((name, options) => {
        logger.info(`Greet command executed with name: ${name} and options: ${JSON.stringify(options)}`);
        const title = options.title ? `${options.title} ` : '';
        console.log(`Meow Meow -- ${title}${name}!`);
    });

// MARK: MCP Server
program
    .command('mcp')
    .description('Runs a MCP server')
    .option('-p, --port <port>', 'Port number', '6975')
    .option('-k, --kind <kind>', `MCP kind (${Object.values(MCPKind).join(', ')})`)
    .action(async (options) => {
        const kind = options.kind;
        const port = parseInt(options.port, 10);
        logger.info(`MCP command executed with name: ${kind} and port: ${port}`);

        if (!Object.values(MCPKind).includes(kind)) {
            logger.error(`Invalid MCP kind: ${kind}`);
            console.error(`Invalid MCP kind: ${kind}`);
            process.exit(1);
        }

        const mcpRunner = new MCPRunner(port, kind);
        await mcpRunner.start()
        logger.info(`MCP server of kind ${kind} started on port ${port}`);



        // Keep the process alive
        process.stdin.resume();
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT. Shutting down...');
            await mcpRunner.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM. Shutting down...');
            await mcpRunner.stop();
            process.exit(0);
        });
    });

// MARK: Test LLM:
program
    .command('llm-test <prompt>')
    .description('Test the LLM with a prompt')
    .action(async (prompt) => {
        logger.info(`LLM test command executed with prompt: ${prompt}`);
        const response = await llm.invoke(prompt);
        console.log(`LLM response: ${response.text}`);
    });

// MARK: AI Agent
program
    .command('agent <kind>')
    .description('Run an AI agent with a prompt')
    .action(async (kind, prompt) => {
        logger.info(`Agent command executed with kind: ${kind} and prompt: ${prompt}`);
        const agentRunner = new AgentRunner();
        await agentRunner.initialize(kind);
        await agentRunner.run();

    });


// MARK: CLI
program
    .command('meow')
    .description('Runs CLI in interactive mode')
    .action(async () => {
        logger.info('Interactive CLI mode started');
        await mainMenu();
    });


program.parse(process.argv);
