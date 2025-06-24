export const calculateAggregates = (spendByDate, spendByCiv, totalSpend, totalRows, skippedRows) => {
    const dateEntries = Object.entries(spendByDate);
    const civEntries = Object.entries(spendByCiv);

    const [lessSpentAt, lessSpentValue] = dateEntries.reduce(
        (min, entry) => entry[1] < min[1] ? entry : min,
        dateEntries[0] || [null, Infinity]
    );

    const [bigSpentAt, bigSpentValue] = dateEntries.reduce(
        (max, entry) => entry[1] > max[1] ? entry : max,
        dateEntries[0] || [null, -Infinity]
    );

    const [lessSpentCiv, lessSpentCivValue] = civEntries.reduce(
        (min, entry) => entry[1] < min[1] ? entry : min,
        civEntries[0] || [null, Infinity]
    );

    const [bigSpentCiv, bigSpentCivValue] = civEntries.reduce(
        (max, entry) => entry[1] > max[1] ? entry : max,
        civEntries[0] || [null, -Infinity]
    );

    return {
        total_spend_galactic: totalSpend,
        rows_affected: totalRows,
        less_spent_at: lessSpentAt ? parseInt(lessSpentAt) : null,
        big_spent_at: bigSpentAt ? parseInt(bigSpentAt) : null,
        less_spent_value: lessSpentValue ?? null,
        big_spent_value: bigSpentValue ?? null,
        average_spend_galactic: totalRows > 0 ? totalSpend / totalRows : 0,
        big_spent_civ: bigSpentCiv ?? null,
        less_spent_civ: lessSpentCiv ?? null,
        invalid_rows: skippedRows
    };
};

export const createStreamingAggregator = (dependencies) => {
    const { getExchangeRate } = dependencies;

    let headers = null;
    let totalSpendGalactic = 0;
    let rowsAffected = 0;
    let skippedRows = 0;
    let spendByDate = {};
    let spendByCiv = {};

    return {
        addLine: (line) => {
            try {
                line = line.trim();
                if (!line) return;

                if (!headers) {
                    headers = line.split(',').map(item => item.trim());
                    return;
                }

                const values = line.split(',').map(item => item.trim());

                if (values.length !== headers.length) {
                    skippedRows++;
                    return;
                }

                const row = {};
                let isInvalid = false;

                for (let i = 0; i < headers.length; i++) {
                    const header = headers[i];
                    const value = values[i];

                    if (header === "civ") {
                        if (!["humans", "blobs", "monsters"].includes(value)) {
                            isInvalid = true;
                        }
                        row[header] = value;
                    } else if (header === "spend") {
                        const spendValue = parseFloat(value);
                        if (isNaN(spendValue) || spendValue < 0) {
                            isInvalid = true;
                        }
                        row[header] = spendValue;
                    } else {
                        row[header] = value;
                    }
                }

                if (isInvalid) {
                    skippedRows++;
                    return;
                }

                const galacticSpend = row.spend * getExchangeRate(row.civ);

                totalSpendGalactic += galacticSpend;
                rowsAffected++;

                if (row.date) {
                    spendByDate[row.date] = (spendByDate[row.date] || 0) + galacticSpend;
                }

                if (row.civ) {
                    spendByCiv[row.civ] = (spendByCiv[row.civ] || 0) + galacticSpend;
                }

            } catch (err) {
                console.error('Error processing line:', err);
                skippedRows++;
            }
        },

        getResult: () => {
            return calculateAggregates(
                spendByDate,
                spendByCiv,
                totalSpendGalactic,
                rowsAffected,
                skippedRows
            );
        }
    };
};