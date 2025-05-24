import { readFileSync } from "fs";
import { join } from "path";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

import { llm, mapToolListToOpenAiTools } from "../utils/llm";
import { AgentInterface } from "./agent-interface";
import { getLogger } from "../log-config";

const logger = getLogger("tool-call");

const SystemPrompt = readFileSync(join(__dirname, "../../src/utils/prompts/factorio-prompt.md"), "utf-8");

export class TollCallAgent implements AgentInterface {
    private agent;

    constructor(tools: any) {
        this.agent = createReactAgent({
            llm,
            tools,
            prompt: new SystemMessage(SystemPrompt),
        });
        logger.debug("TollCallAgent initialized");
        logger.debug(`System prompt: ${SystemPrompt}`);
    }

    public async invoke(prompt: HumanMessage | HumanMessage[]): Promise<string> {
        logger.debug(`Invoking agent with prompt: ${prompt}`);

        const response = await this.agent.invoke({messages: prompt});
        return response.messages[response.messages.length-1].text;
    }
}