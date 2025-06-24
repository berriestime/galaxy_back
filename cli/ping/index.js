import http from "node:http";
import { once } from "node:events";
import { performance } from "node:perf_hooks";

let currentRequestStart = 0;
let currentRtt = 0;
let maxRtt = 0;
let last100Rtt = [];
let averageRtt = 0;

let requests = 0;
const ping = async () => {
    currentRequestStart = performance.now();

    const request = http.request("http://localhost:3000/v1/ping", () => {
        maxRtt = Math.max(maxRtt, currentRtt);
        requests += 1;

        last100Rtt.push(currentRtt);
        if (last100Rtt.length > 100) {
            last100Rtt.shift();
        }

        const last100RttSum = last100Rtt.reduce((acc, rtt) => acc + rtt);
        averageRtt = last100RttSum / last100Rtt.length;

        request.end();
    });

    request.write("ping");

    await once(request, "close");
};

const startInfinitePing = async () => {
    while (true) {
        await ping();
    }
};

const calculateRtt = () => {
    currentRtt = performance.now() - currentRequestStart;

    setTimeout(calculateRtt, 10);
};

const log = () => {
    console.clear();
    console.log("--------------------------------");
    console.log(`Current RTT: ${currentRtt.toFixed(2)}ms`);
    console.log(`Requests: ${requests}`);
    console.log(`Max RTT: ${maxRtt.toFixed(2)}ms`);
    console.log(`Average RTT (last 100 requests): ${averageRtt.toFixed(2)}ms`);
    console.log("--------------------------------");

    setTimeout(() => {
        log();
    }, 20);
};

startInfinitePing();
calculateRtt();
log();
