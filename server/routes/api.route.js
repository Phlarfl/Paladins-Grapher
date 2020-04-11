const axios = require('axios').default;
const paladinsApi = require('../controllers/paladins.api.controller');
const graphController = require('../controllers/graphs');

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
                paladinsApi.getMatchHistory(inputName, req),
                paladinsApi.getChampionRanks(inputName, req)
            ]).then(axios.spread((player, matches, champions) => {
                if (!player || !player.data || !player.data[0]) {
                    console.error('No player data received');
                    res.send({ error: `No player found: '${inputName}'` });
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

                const playerName = player.data[0].hz_player_name;
                const graphs = [];
                graphs.push(graphController.matches.damageDealt(matches.data, playerName));
                graphs.push(graphController.matches.damageTaken(matches.data, playerName));
                graphs.push(graphController.matches.kda(matches.data, playerName));

                graphs.push(graphController.champions.wins(champions.data, playerName));
                graphs.push(graphController.champions.losses(champions.data, playerName));
                graphs.push(graphController.champions.kda(champions.data, playerName));

                res.setHeader('Content-Type', 'application/json');
                res.send({
                    player: player.data[0],
                    graphs: graphs
                });
            }));
        }
    }
];