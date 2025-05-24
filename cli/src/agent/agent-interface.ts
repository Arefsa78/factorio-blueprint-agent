import { HumanMessage } from "@langchain/core/messages";

export interface AgentInterface {
    invoke(prompt: HumanMessage | HumanMessage[]): Promise<string>;
}