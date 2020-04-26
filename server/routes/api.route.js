const axios = require('axios').default;
const { downloadFile, stripUrl } = require('../modules/util.module');
const paladinsApi = require('../controllers/paladins.api.controller');

module.exports = [{
    method: 'post',
    url: '/player',
    controller: (req, res) => {
        const inputNames = req.body.playerNames;
        if (!inputNames) {
            res.send({ error: 'Invalid request, missing parameter: playerNames' });
            return;
        }

        const requests = [];
        inputNames.forEach((inputName) => {
            requests.push(paladinsApi.getPlayer(inputName, req));
            requests.push(paladinsApi.getPlayerStatus(inputName, req));
            requests.push(paladinsApi.getMatchHistory(inputName, req));
            requests.push(paladinsApi.getChampionRanks(inputName, req));
        });

        axios.all(requests).then(async (playersData) => {
            const datas = playersData.map((playerData) => playerData.data);

            const players = [];
            for (let i = 0; i < datas.length; i += 4) {
                const inputName = inputNames[i * 0.25];
                const player = datas[i];
                const playerStatus = datas[i + 1];
                const matches = datas[i + 2];
                const champions = datas[i + 3];

                const playerData = {
                    player: null,
                    playerStatus: null,
                    matches: [],
                    champions: [],
                    error: null
                };

                if (!player || !player[0]) {
                    console.error('No player data received for player', inputName);
                    playerData.error = `No player data received for '${inputName}'`;
                } else if (!playerStatus || !playerStatus[0]) {
                    console.error('No player status data received for player', inputName);
                    playerData.error = `No player status data received for '${inputName}'`;
                } else if (!matches || !matches[0].playerName) {
                    console.error('No match history data received for player', inputName);
                    playerData.error = `No match history data received for '${inputName}'`;
                } else if (!champions) {
                    console.error('No champion data found for player', inputName);
                    playerData.error = `No champion data received for '${inputName}'`;
                }

                if (playerData.error == null) {
                    replaceExternalUrl('./assets/img/avatar', player[0], 'AvatarURL');
                    playerData.player = player[0];
                    playerData.playerStatus = playerStatus[0];
                    playerData.matches = matches;
                    playerData.champions = champions;
                }

                players.push(playerData);
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(players);
        }).catch((reason) => {
            console.error('There was an issue getting player data');
        });
    }
}, {
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
}, {
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

        const requests = matchIds.map((matchId) => paladinsApi.getLiveMatch(matchId, req));

        if (requests.length == 0 && storedMatches.length != 0) {
            res.send({ matches: storedMatches });
            return;
        }

        if (requests.length > 10) {
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
            const matchData = matches.map((match) => match.data).concat(Object.values(storedMatches));
            matchData.filter((match) => match.length > 0).forEach((match) => {
                for (let i = match.length; i < 10; i++) {
                    match.push({
                        Match: match[0].Match,
                        mapGame: match[0].mapGame,
                        playerName: 'Bot'
                    });
                }
                if (match[0].mapGame)
                    parsedData[match[0].Match] = match;
            });
            req.db.update('matches', (matches) => {
                return { ...matches, ...parsedData };
            }).write();
            res.send({ matches: parsedData });
        });
    }
}, {
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

            parsedChampions.forEach((champion) => {
                for (let i = 1; i <= 5; i++) replaceExternalUrl('./assets/img/champion/ability', champion[`Ability_${i}`], 'URL');
                for (let i = 1; i <= 5; i++) replaceExternalUrl('./assets/img/champion/ability', champion, `ChampionAbility${i}`);
                replaceExternalUrl('./assets/img/champion/avatar', champion, 'ChampionIcon_URL');
            });

            req.db.set('champions', champions.data).write();
            res.send({ champions: parsedChampions });
        }));
    }
}];

async function replaceExternalUrl(dir, obj, field) {
    if (obj[field] && obj[field].length > 0) {
        const path = `${dir}/${stripUrl(obj[field])}`;
        await downloadFile(obj[field], path);
        obj[field] = path;
    }
}