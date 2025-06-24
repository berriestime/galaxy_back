import http from "http";
import { aggregateV1 } from "./v1/aggregate.js";
import { ping } from "./v1/ping.js";
import { aggregateV2 } from "./v2/aggregate.js";
import { aggregateV2asStream } from "./v2/aggregate_as_stream.js";

// Простой логгер использования памяти
let maxHeapUsed = 0;
function logMemoryUsage() {
    const bytesToMB = (bytes) => Math.round(bytes / 1024 / 1024);

    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > maxHeapUsed) {
        maxHeapUsed = memoryUsage.heapUsed;
    }

    console.clear();
    console.log("------------------------");
    console.log(`Heap Used: ${bytesToMB(memoryUsage.heapUsed)}MB`);
    console.log(`Max Heap Used: ${bytesToMB(maxHeapUsed)}MB`);
    console.log("------------------------");
}

const server = http.createServer((req, res) => {
    // Проверка блокировки основного потока
    if (req.url === "/v1/ping") {
        return ping(req, res);
    }

    // Этот способ отлично работает для небольших файлов,
    // но если файл большой, то он может вызвать переполнение памяти
    if (req.url === "/v1/stats:aggregate") {
        return aggregateV1(req, res);
    }

    // Попробуй написать более оптимальный способ обработки файлов
    if (req.url === "/v2/stats:aggregate") {
        return aggregateV2(req, res);
    }

    // Если сможешь, добавь в него возможность отдавать частично аггрегированные данные
    // каждые 10000 строк
    if (req.url === "/v2/stats:aggregate_as_stream") {
        return aggregateV2asStream(req, res);
    }

    res.writeHead(404, "Not found");
    res.end();
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
    setInterval(logMemoryUsage, 100);
});
