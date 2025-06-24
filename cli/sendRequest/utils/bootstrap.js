import fs from "node:fs";
import { bytesToMB } from "./bytesToMB.js";
import { INPUT_FILE } from "./constants.js";

export function bootstrap(passedUrlString) {
    if (!passedUrlString) {
        console.error("URL is required");
        process.exit(1);
    }

    const isFileExists = fs.existsSync(INPUT_FILE);

    if (!isFileExists) {
        const errorMessage = `Файл ${INPUT_FILE} не найден. Пожалуйста, сгенерируйте его с помощью generateInput`;
        console.error(errorMessage);

        process.exit(1);
    }

    const fileStats = fs.statSync(INPUT_FILE);
    return {
        fileSizeMB: bytesToMB(fileStats.size),
        fileSize: fileStats.size,
    };
}
