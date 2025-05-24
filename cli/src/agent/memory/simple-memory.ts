import { BaseMessage } from "@langchain/core/messages";
import * as fs from "fs";
import * as path from "path";

export class SimpleMemory {
    public messages: BaseMessage[] = [];

    public addMessage(message: BaseMessage): void {
        this.messages.push(message);
    }

    public getMessages(): BaseMessage[] {
        return this.messages;
    }

    public saveMessagesToMarkdown(): void {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const dir = path.resolve("chat_hitory");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const filename = `chat_${timestamp}.md`;
        const filePath = path.join(dir, filename);
        const content = this.messages.map((msg, idx) => `### Message ${idx + 1}\n\n${msg.content}\n`).join("\n");
        fs.writeFileSync(filePath, content, "utf-8");
    }
}