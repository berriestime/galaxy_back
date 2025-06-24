import { bytesToMB } from "./bytesToMB.js";
import { performance } from "node:perf_hooks";

export const createLogger = ({ fileSize }) => {
    let lastLogTime = Date.now();

    return {
        logResponseStatus: (res) => {
            const message = `Response status: ${res.statusCode} ${res.statusMessage}`;
            console.log(`\n${message}`);
        },

        logReadProgress: (bytesSent) => {
            const now = Date.now();
            if (now - lastLogTime > 10) {
                const percents = (bytesSent / fileSize) * 100;
                const mbSent = bytesToMB(bytesSent);

                const message = `Sent: ${mbSent} MB (${percents.toFixed(2)}%)`;
                process.stdout.write(`\r${message}`);
                lastLogTime = now;
            }
        },

        logWriteProgress: (bytesReceived) => {
            const mbReceived = bytesToMB(bytesReceived);
            console.log(`\rReceived: ${mbReceived} MB`);
        },

        logResponseTime: (startTime) => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            const timeTaken = (duration / 1000).toFixed(2);
            const message = `\nTime taken to execute request: ${timeTaken} seconds`;
            console.log(message);
        },
    };
};
