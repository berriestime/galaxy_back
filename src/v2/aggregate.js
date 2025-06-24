import { createStreamingAggregator } from "./utils/aggregator.js";
import { getExchangeRate } from "../exhangeRates.js";

export const aggregateV2 = async (req, res) => {
    try {
        const aggregator = createStreamingAggregator({ getExchangeRate });
        let remainingLine = '';
        let hasErrored = false;

        const handleError = (err) => {
            if (hasErrored) return;
            hasErrored = true;
            console.error('Error in request:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal server error' }));
        };

        req.on('data', (chunk) => {
            if (hasErrored) return;

            try {
                const chunkStr = chunk.toString();
                const lines = (remainingLine + chunkStr).split('\n');
                remainingLine = lines.pop();

                for (const line of lines) {
                    aggregator.addLine(line);
                }
            } catch (err) {
                handleError(err);
            }
        });

        req.on('end', () => {
            if (hasErrored) return;

            try {
                if (remainingLine.trim()) {
                    aggregator.addLine(remainingLine);
                }

                const result = aggregator.getResult();

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
            } catch (err) {
                handleError(err);
            }
        });

        req.on('error', handleError);
    } catch (error) {
        console.error('Unexpected error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
};