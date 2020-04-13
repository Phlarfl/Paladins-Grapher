const axios = require('axios').default;
const md5 = require('md5');
const moment = require('moment');

exports.getTimestamp = () => {
    return moment.utc().format('YYYYMMDDHHmmss');
};

exports.getSignature = (method) => {
    return md5(`${process.env.API_ID}${method}${process.env.API_KEY}${exports.getTimestamp()}`);
};

exports.getEndpoint = (method) => {
    return `${process.env.API_URL}/${method}Json`;
};

exports.buildUrl = (req, method, session, suffix) => {
    return encodeURI(`${exports.getEndpoint(method)}/${process.env.API_ID}/${exports.getSignature(method)}/${session ? `${req.db.get('paladins.session').value()}/` : ''}${exports.getTimestamp()}${suffix || ''}`);
};

exports.createSession = (req, callback) => {
    axios.get(exports.buildUrl(req, 'createsession', false))
        .then((body) => callback(body))
        .catch((err) => callback({ error: err }));
};

exports.getChampions = (req) => {
    return axios.get(exports.buildUrl(req, 'getchampions', true, '/1'));
};

exports.getChampionRanks = (player, req) => {
    return axios.get(exports.buildUrl(req, 'getchampionranks', true, `/${player}`));
};

exports.getLiveMatch = (match, req) => {
    return axios.get(exports.buildUrl(req, 'getmatchplayerdetails', true, `/${match}`));
};

exports.getMatchHistory = (player, req) => {
    return axios.get(exports.buildUrl(req, 'getmatchhistory', true, `/${player}`));
};

exports.getPlayer = (player, req) => {
    return axios.get(exports.buildUrl(req, 'getplayer', true, `/${player}`));
};

exports.getPlayerStatus = (player, req) => {
    return axios.get(exports.buildUrl(req, 'getplayerstatus', true, `/${player}`));
}