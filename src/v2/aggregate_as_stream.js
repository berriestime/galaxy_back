import { createInterface } from 'readline';
import { getExchangeRate } from "../exhangeRates.js";
import { calculateAggregates } from "./utils/aggregator.js";

export const aggregateV2asStream = async (req, res) => {
    try {
        const rl = createInterface({
            input: req,
            crlfDelay: Infinity
        });

        let headers = null;
        let skippedRows = 0;
        let lineCount = 0;
        let isFirstResult = true;

        const spendByDate = {};
        const spendByCiv = {};
        let totalSpend = 0;
        let totalRows = 0;

        res.setHeader('Content-Type', 'application/x-ndjson');
        
        for await (const line of rl) {
            lineCount++;

            if (lineCount === 1) {
                headers = line.split(',').map(item => item.trim());
                continue;
            }

            const values = line.split(',').map(item => item.trim());
            
            if (values.length !== headers.length) {
                skippedRows++;
                continue;
            }

            const row = headers.reduce((obj, header, index) => {
                obj[header] = values[index];
                return obj;
            }, {});

            if (!["humans", "blobs", "monsters"].includes(row.civ) || row.spend < 0) {
                skippedRows++;
                continue;
            }

            const exchangeRate = getExchangeRate(row.civ);
            const spend = parseFloat(row.spend) * exchangeRate;

            totalSpend += spend;
            totalRows++;

            spendByDate[row.date] = (spendByDate[row.date] || 0) + spend;
            spendByCiv[row.civ] = (spendByCiv[row.civ] || 0) + spend;

            if (totalRows % 10000 === 0) {
                const result = calculateAggregates(
                    spendByDate,
                    spendByCiv,
                    totalSpend,
                    totalRows,
                    skippedRows
                );

                if (!isFirstResult) res.write('\n');
                else isFirstResult = false;
                
                res.write(JSON.stringify(result));
            }
        }

        const finalResult = calculateAggregates(
            spendByDate,
            spendByCiv,
            totalSpend,
            totalRows,
            skippedRows
        );

        if (!isFirstResult) res.write('\n');
        res.write(JSON.stringify(finalResult));
        res.end();
    } catch (error) {
        console.error('Error processing stream:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
};