const paladinsApi = require('../controllers/paladins.api.controller');

module.exports = (req, res, next) => {
    console.log(req.method, req.url, req.query);

    if (!req.db.get('paladins.session').value() || req.db.get('paladins.session').value().length === 0 || new Date().getTime() - req.db.get('paladins.created') > 1000 * 60 * 15) {
        paladinsApi.createSession(req, (sessionRes) => {
            if (sessionRes.error) {
                console.error('There was an issue getting a new session token', sessionRes.error);
                next();
                return;
            }
            req.db.set('paladins', {
                created: new Date().getTime(),
                session: sessionRes.data.session_id
            }).write();
            next();
        });
    } else
        next();
};