const { getKdaRatio } = require('../../modules/util.module');

module.exports = {
    damageDealt: (matches, player) => {
        const graph = {
            id: 'damageDealt',
            title: 'Damage Dealt - Last 50 Matches',
            player: player,
            columns: [],
            sets: [{
                label: player,
                data: []
            }]
        };
        matches.forEach((match, index) => {
            graph.columns.push(index);
            graph.sets[0].data.push(match.Damage);
        });
        return graph;
    },
    damageTaken: (matches, player) => {
        const graph = {
            id: 'damageTaken',
            title: 'Damage Taken - Last 50 Matches',
            player: player,
            columns: [],
            sets: [{
                label: player,
                data: []
            }]
        };
        matches.forEach((match, index) => {
            graph.columns.push(index);
            graph.sets[0].data.push(match.Damage_Taken);
        });
        return graph;
    },
    kda: (matches, player) => {
        const graph = {
            id: 'kda',
            title: 'KDA - Last 50 Matches',
            player: player,
            columns: [],
            sets: [{
                label: player,
                data: []
            }]
        };
        matches.forEach((match, index) => {
            graph.columns.push(index);
            graph.sets[0].data.push(getKdaRatio(match.Kills, match.Deaths, match.Assists).toFixed(1));
        });
        return graph;
    }
};