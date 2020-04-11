module.exports = {
    getKdaRatio: (k, d, a) => {
        return ((k + ((a || 1) / 2)) || 1) / (d || 1);
    }
};
