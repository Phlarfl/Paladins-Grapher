const { getKdaRatio } = require('../../modules/util.module');

module.exports = {
    wins: (champions, player) => {
        const graph = {
            id: 'championWins',
            title: 'Champion Wins - All Time',
            player: player,
            columns: [],
            sets: [{
                label: player,
                data: []
            }]
        };
        champions.sort((a, b) => a.champion.localeCompare(b.champion));
        champions.forEach((champion) => {
            graph.columns.push(champion.champion);
            graph.sets[0].data.push(champion.Wins);
        });
        return graph;
    },
    losses: (champions, player) => {
        const graph = {
            id: 'championLosses',
            title: 'Champion Losses - All Time',
            player: player,
            columns: [],
            sets: [{
                label: player,
                data: []
            }]
        };
        champions.sort((a, b) => a.champion.localeCompare(b.champion));
        champions.forEach((champion) => {
            graph.columns.push(champion.champion);
            graph.sets[0].data.push(champion.Losses);
        });
        return graph;
    },
    kda: (champions, player) => {
        const graph = {
            id: 'championKda',
            title: 'Champion KDA - All Time',
            player: player,
            columns: [],
            sets: [{
                label: player,
                data: []
            }]
        };
        champions.sort((a, b) => a.champion.localeCompare(b.champion));
        champions.forEach((champion) => {
            graph.columns.push(champion.champion);
            graph.sets[0].data.push(getKdaRatio(champion.Kills, champion.Deaths, champion.Assists).toFixed(1));
        });
        return graph;
    }
};