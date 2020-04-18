const request = require('request');
const fs = require('fs');

module.exports = {
    getKdaRatio: (k, d, a) => {
        return ((k + ((a || 1) / 2)) || 1) / (d || 1);
    },
    downloadFile: (url, path) => {
        return new Promise((resolve, reject) => {
            const publicPath = `./public/${path}`;
            if (!fs.existsSync(publicPath)) {
                const dir = publicPath.substring(0, publicPath.lastIndexOf('/'));
                if (!fs.existsSync(dir)) {
                    try {
                        fs.mkdirSync(dir);
                    } catch (e) {
                        reject(e);
                    }
                }
                request.head(url, (err, res, body) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else request(url).pipe(fs.createWriteStream(publicPath)).on('close', () => resolve());
                });
            } else resolve();
        });
    },
    stripUrl: (url) => {
        let output = url.replace(/(http|https):\/\//, '');
        while (output.indexOf('/') >= 0)
            output = output.replace(/[\/\\'"]/, '_');
        return output.trim();
    }
};
