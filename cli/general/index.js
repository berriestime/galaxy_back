// Можешь создать отдельный скрипт в папке cli для этого решения.
//    [генерация данных] -> [отправка на сервер] -> [обработка на сервере] -> [отправка на клиент] -> [сохранение в файл на клиенте]
        // "start": "node src/server.js",
        // "ping": "node cli/ping/index.js",
        // "generate-csv-0.01gb": "node cli/generateInput/index.js 0.01",
        // "generate-csv-0.1gb": "node cli/generateInput/index.js 0.1",
        // "generate-csv-1gb": "node cli/generateInput/index.js 1",
        // "generate-csv-5gb": "node cli/generateInput/index.js 5",
        // "generate-csv-0.01gb-errors": "node cli/generateInput/index.js 0.01 --generate-errors",
        // "generate-csv-0.1gb-errors": "node cli/generateInput/index.js 0.1 --generate-errors",
        // "generate-csv-1gb-errors": "node cli/generateInput/index.js 1 --generate-errors",
        // "generate-csv-5gb-errors": "node cli/generateInput/index.js 5 --generate-errors",
        // "send-request-v1": "node cli/sendRequest/index.js http://localhost:3000/v1/stats:aggregate",
        // "send-request-v2": "node cli/sendRequest/index.js http://localhost:3000/v2/stats:aggregate",
        // "send-request-v2-stream": "node cli/sendRequest/index.js http://localhost:3000/v2/stats:aggregate_as_stream"

import cp from "node:child_process";

const server = cp.spawn("node", ["./src/server.js"]);

server.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

server.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

cp.execSync("npm run generate-csv-0.01gb", { stdio: "inherit" });
cp.execSync("npm run send-request-v2", { stdio: "inherit" });

server.kill();
