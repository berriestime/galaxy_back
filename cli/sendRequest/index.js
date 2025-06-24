import fs from "node:fs";
import http from "node:http";
import { pipeline } from "node:stream/promises";
import { performance } from "node:perf_hooks";
import { INPUT_FILE, OUTPUT_FILE } from "./utils/constants.js";
import { bootstrap } from "./utils/bootstrap.js";
import { createLogger } from "./utils/logger.js";
import { getResultFileInfo } from "./utils/getResultFileInfo.js";

const passedUrlString = process.argv[2];

const { fileSizeMB, fileSize } = bootstrap(passedUrlString);
const logger = createLogger({ fileSize });

console.log(`Sending file ${INPUT_FILE} (${fileSizeMB} MB) to server...`);

const url = new URL(passedUrlString);
const { hostname, port, pathname } = url;
const requestOptions = {
    hostname,
    port,
    path: pathname,
    method: "POST",
    headers: {
        "Content-Type": "text/csv",
        "Content-Length": fileSize,
    },
};

// Функция для отправки запроса
async function sendRequest() {
    return new Promise((resolve, reject) => {
        // Создаем поток чтения из файла
        const fileStream = fs.createReadStream(INPUT_FILE);

        // Отслеживаем прогресс отправки данных
        let bytesSent = 0;
        fileStream.on("data", (chunk) => {
            bytesSent += chunk.length;
            logger.logReadProgress(bytesSent);
        });

        console.log(`Sending request to ${url.href}`);

        const startTime = performance.now();
        const req = http.request(requestOptions, (res) => {
            logger.logResponseStatus(res);

            // Создаем поток записи для сохранения ответа
            const outputStream = fs.createWriteStream(OUTPUT_FILE);

            // Отслеживаем прогресс получения данных
            let bytesReceived = 0;
            res.on("data", (chunk) => {
                bytesReceived += chunk.length;
                logger.logWriteProgress(bytesReceived);
            });

            pipeline(res, outputStream)
                .then(() => {
                    logger.logResponseTime(startTime);
                    console.log(`Response saved to file ${OUTPUT_FILE}`);

                    // Вывод информации об итоговом файле
                    getResultFileInfo(OUTPUT_FILE).then(resolve).catch(reject);
                })
                .catch(reject);
        });

        // Обработка ошибок запроса
        req.on("error", (error) => {
            console.error(`Error sending request: ${error.message}`);
            reject(error);
        });

        // Отправляем данные через поток
        fileStream.pipe(req);
    });
}

// Запускаем отправку запроса
console.log("Запуск отправки запроса...");
sendRequest()
    .then(() => console.log("Запрос успешно завершен"))
    .catch((error) => {
        console.error("Ошибка при выполнении скрипта:", error);
        process.exit(1);
    });
