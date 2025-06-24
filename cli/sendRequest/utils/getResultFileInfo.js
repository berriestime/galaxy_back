import fs from "node:fs";
import { bytesToMB } from "./bytesToMB.js";

export async function getResultFileInfo(filePath) {
    // Проверяем количество строк в ответе
    const responseStats = fs.statSync(filePath);
    const mbReceived = bytesToMB(responseStats.size);
    console.log(`Size of response: ${mbReceived} MB`);

    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);
        let lineCount = 0;
        let buffer = "";

        fileStream.on("data", (chunk) => {
            const content = buffer + chunk.toString();
            const lines = content.split("\n");
            buffer = lines.pop() || "";
            lineCount += lines.length;
        });

        fileStream.on("end", () => {
            if (buffer.length > 0) {
                lineCount++;
            }
            console.log(`Number of lines in response: ${lineCount}`);
            resolve();
        });

        fileStream.on("error", reject);
    });
}
