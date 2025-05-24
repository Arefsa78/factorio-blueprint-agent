import { LogLevel, LogMessage } from "typescript-logging";
import { CategoryProvider, Category } from "typescript-logging-category-style";
import * as fs from "fs";

// Open log file for writing (overwrite on each launch)
const logFile = fs.createWriteStream(`${__dirname}/../server.log`, { flags: "w" });
logFile.write("Server log started\n");

const provider = CategoryProvider.createProvider("ServerLoggerProvider", {
    level: LogLevel.Debug,
    channel: {
        type: "LogChannel",
        write: (message: LogMessage) => {
            const logEntry = message.message;
            // Write to file
            logFile.write(logEntry + "\n");
            // Write to console
            console.log(logEntry);
        }
    }
});

export function getLogger(name: string): Category {
    return provider.getCategory(name);
}