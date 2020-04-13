import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';

import { GraphData } from './graphData.class';
import { GraphEntry } from './graphEntry.class';
import { ObjectUnsubscribedError } from 'rxjs';

export class Graph {
    graphData: { [key: string]: GraphData } = {};
    lineChartOptions: ChartOptions = {
        responsive: true,
        title: {
            display: true
        }
    };
    lineChartLegend = true;
    lineChartType = 'line';

    lineChartLabels: Label[] = [];
    lineChartData: ChartDataSets[] = [];
    lineChartColors: Color[] = [];

    graphIndexMap = {};

    constructor(graphData: GraphData) {
        this.lineChartOptions.title.text = graphData.title;
        this.addData(graphData);
    }

    addData(graphData: GraphData) {
        this.graphData[graphData.player] = graphData;
        this.refreshGraph();
    }

    deleteData(player: string) {
        delete this.graphData[player];
        this.refreshGraph();
    }

    refreshGraph() {
        const columns: { [key: string]: { column: string, sets: { player: string, value: number }[] } } = {};
        Object.values(this.graphData).filter((graphData) => graphData != null).forEach((graphData) => {
            graphData.entries.forEach((entry, index) => {
                const column = entry.column;
                const value = entry.value;
                if (!columns[column]) {
                    const c: { column: string, sets: { player: string, value: number }[] } = {
                        column: column,
                        sets: [{
                            player: graphData.player,
                            value: value
                        }]
                    };
                    columns[column] = c;
                } else {
                    const c: { column: string, sets: { player: string, value: number }[] } = columns[column];
                    c.sets.push({
                        player: graphData.player,
                        value: value
                    });
                }
            });
        });
        const remove = [];
        Object.keys(columns).forEach((key) => {
            const column = columns[key];
            if (column.sets.length !== Object.keys(this.graphData).length)
                remove.push(key);
        });
        remove.forEach((removal) => {
            delete columns[removal];
        });

        const data: { [key: string]: { label: string, data: number[] } } = {};
        Object.values(columns).forEach((column) => {
            column.sets.forEach((set) => {
                if (data[set.player])
                    data[set.player].data.push(set.value);
                else
                    data[set.player] = {
                        label: set.player,
                        data: [set.value]
                    };
            });
        });

        this.lineChartData = Object.values(data);

        this.lineChartLabels = Object.values(columns).map((column) => column.column);
        this.lineChartColors.splice(0, this.lineChartColors.length);
        const colorSplit = 360. / this.lineChartData.length;
        for (let i = 0; i < this.lineChartData.length; i++) {
            const color = colorSplit * i;
            this.lineChartColors.push({
                backgroundColor: [`hsla(${color}, 75%, 60%, .1)`],
                borderColor: [`hsla(${color}, 50%, 60%, .8)`],
                borderWidth: 2
            });
        }
    }

    static getKda(k: number, d: number, a: number) {
        return ((k + ((a || 1) / 2)) || 1) / (d || 1);
    }

    static buildDamageDealtGraph(player: string, matches: any[]): GraphData {
        const entries: GraphEntry[] = [];
        matches.forEach((match) => {
            entries.push({
                column: match.Match,
                value: match.Damage
            });
        });
        return new GraphData('damageDealt', 'Damage Dealt - Last 50 Matches', player, entries);
    }

    static buildDamageTakenGraph(player: string, matches: any[]): GraphData {
        const entries: GraphEntry[] = [];
        matches.forEach((match) => {
            entries.push({
                column: match.Match,
                value: match.Damage_Taken
            });
        });
        return new GraphData('damageTaken', 'Damage Taken - Last 50 Matches', player, entries);
    }

    static buildKdaGraph(player: string, matches: any[]): GraphData {
        const entries: GraphEntry[] = [];
        matches.forEach((match) => {
            entries.push({
                column: match.Match,
                value: +this.getKda(match.Kills, match.Deaths, match.Assists).toFixed(1)
            });
        });
        return new GraphData('kda', 'KDA - Last 50 Matches', player, entries);
    }

    static buildChampionKdaGraph(player: string, champions: any[]): GraphData {
        const entries: GraphEntry[] = [];
        champions.sort((a, b) => a.champion.localeCompare(b.champion));
        champions.forEach((champion) => {
            entries.push({
                column: champion.champion,
                value: +this.getKda(champion.Kills, champion.Deaths, champion.Assists).toFixed(1)
            });
        });
        return new GraphData('championKda', 'Champion KDA - All Time', player, entries);
    }

    static buildChampionWinsGraph(player: string, champions: any[]): GraphData {
        const entries: GraphEntry[] = [];
        champions.sort((a, b) => a.champion.localeCompare(b.champion));
        champions.forEach((champion) => {
            entries.push({
                column: champion.champion,
                value: champion.Wins
            });
        });
        return new GraphData('championWins', 'Champion Wins - All Time', player, entries);
    }

    static buildChampionLossesGraph(player: string, champions: any[]): GraphData {
        const entries: GraphEntry[] = [];
        champions.sort((a, b) => a.champion.localeCompare(b.champion));
        champions.forEach((champion) => {
            entries.push({
                column: champion.champion,
                value: champion.Losses
            });
        });
        return new GraphData('championLosses', 'Champion Losses - All Time', player, entries);
    }
}