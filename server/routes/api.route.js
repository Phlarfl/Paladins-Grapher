const axios = require('axios').default;
const paladinsApi = require('../controllers/paladins.api.controller');

module.exports = [
    {
        method: 'post',
        url: '/player',
        controller: (req, res) => {
            const inputName = req.body.player;
            if (!inputName) {
                res.send({ error: 'Invalid request, missing parameter: player' });
                return;
            }
            axios.all([
                paladinsApi.getPlayer(inputName, req),
                paladinsApi.getPlayerStatus(inputName, req),
                paladinsApi.getMatchHistory(inputName, req),
                paladinsApi.getChampionRanks(inputName, req)
            ]).then(axios.spread((player, playerStatus, matches, champions) => {
                res.setHeader('Content-Type', 'application/json');

                if (!player || !player.data || !player.data[0]) {
                    console.error('No player data received');
                    res.send({ error: `No player found: '${inputName}'` });
                    return;
                }

                if (!playerStatus || !playerStatus.data || !playerStatus.data[0]) {
                    console.error('No player status data received');
                    res.send({ error: `No player status found: '${inputName}'` });
                    return;
                }

                if (!matches || !matches.data || !matches.data[0].playerName) {
                    console.error('No match data received');
                    res.send({ error: `No matches found for player: '${inputName}'` });
                    return;
                }

                if (!champions || !champions.data) {
                    console.error('No champion data received');
                    res.send({ error: `No champions found for player: '${inputName}'` });
                    return;
                }

                res.send({
                    player: player.data[0],
                    playerStatus: playerStatus.data[0],
                    matches: matches.data,
                    champions: champions.data
                });
            }));
        }
    },
    {
        method: 'post',
        url: '/player/status',
        controller: (req, res) => {
            const inputName = req.body.player;
            if (!inputName) {
                res.send({ error: 'Invalid request, missing parameter: player' });
                return;
            }
            axios.all([
                paladinsApi.getPlayerStatus(inputName, req)
            ]).then(axios.spread((playerStatus) => {
                res.setHeader('Content-Type', 'application/json');

                if (!playerStatus || !playerStatus.data || !playerStatus.data[0]) {
                    console.error('No player status data received');
                    res.send({ error: `No player status found: '${inputName}'` });
                    return;
                }

                res.send({ playerStatus: playerStatus.data[0] });
            }));
        }
    },
    {
        method: 'post',
        url: '/match',
        controller: (req, res) => {
            const matchIds = req.body.matches;
            if (!matchIds) {
                res.send({ error: 'Invalid request, missing parameter: matches' });
                return;
            }

            const storedMatches = {};
            matchIds.forEach((matchId) => {
                const existing = req.db.get(`matches.${matchId}`).value();
                if (existing) {
                    storedMatches[matchId] = existing;
                    matchIds.splice(matchIds.indexOf(matchId), 1);
                }
            });

            const requests = [];
            let idsPerRequest = [];
            matchIds.forEach((matchId, index) => {
                idsPerRequest.push(matchId);
                if (idsPerRequest.length >= 10 || index == matchIds.length - 1) {
                    requests.push(paladinsApi.getMatches([...idsPerRequest], req));
                    idsPerRequest = [];
                }
            });

            if (requests.length == 0 && storedMatches.length != 0) {
                res.send({ matches: storedMatches });
                return;
            }

            if (requests.length > 5) {
                res.send({ error: 'Too many players, calm down' });
                return;
            }

            axios.all(requests).then((matches) => {
                res.setHeader('Content-Type', 'application/json');

                if (!matches || matches.length === 0) {
                    console.error('No match data received');
                    res.send({ error: 'No match data found' });
                    return;
                }

                const parsedData = {};
                const matchData = matches.map((match) => match.data).concat(storedMatches);
                matchData.filter((match) => match.length > 0).forEach((match) => {
                    parsedData[match[0].Match] = match;
                });
                req.db.update('matches', (matches) => {
                    return { ...matches, ...parsedData };
                }).write();
                res.send({ matches: parsedData });
            });
        }
    },
    {
        method: 'post',
        url: '/champions',
        controller: (req, res) => {
            const championIds = req.body.champions;
            if (!championIds) {
                res.send({ error: 'Invalid request, missing parameter: champions' });
                return;
            }

            const storedChampions = {};
            championIds.forEach((championId) => {
                const existing = req.db.get(`champion.${championId}`).value();
                if (existing) {
                    storedChampions[championId] = existing;
                    championIds.splice(championIds.indexOf(championId), 1);
                }
            });

            if (championIds.length == 0 && storedChampions.length != 0) {
                res.send({ champions: storedChampions });
                return;
            }

            axios.all([
                paladinsApi.getChampions(req)
            ]).then(axios.spread((champions) => {
                res.setHeader('Content-Type', 'application/json');

                if (!champions || !champions.data) {
                    console.error('No champion data received');
                    res.send({ error: 'No champion data found' });
                    return;
                }

                const parsedChampions = [];
                champions.data.forEach((champion) => {
                    if (championIds.indexOf(champion.id) >= 0)
                        parsedChampions.push(champion);
                });

                req.db.set('champions', champions.data).write();
                res.send({ champions: parsedChampions });
            }));
        }
    }
];