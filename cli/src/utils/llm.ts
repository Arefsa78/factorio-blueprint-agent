import { AzureChatOpenAI, AzureOpenAI } from "@langchain/openai";
import { getLogger } from "../log-config";

const logger = getLogger("llm");

logger.info("Initializing LLM...");
export const llm = new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
    azureOpenAIApiDeploymentName: "gpt-4.1-mini", // usually the model/deployment name set up in Azure portal
    azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT, // base URL
    model: "gpt-4.1-mini",
});

export const mapToolListToOpenAiTools = (
    toolList: any
): any => {
    return toolList.map((tool: any) => ({
        type: "function",
        ...tool,
    }));
};

