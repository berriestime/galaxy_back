const rates = {
    humans: 0.5,
    blobs: 1,
    monsters: 1.5,
}

export const getExchangeRate = (civilization) => {
    const rate = rates[civilization];

    if (!rate) {
        throw new Error(`Rate not found for civilization ${civilization}`);
    }

    return rate;
};
