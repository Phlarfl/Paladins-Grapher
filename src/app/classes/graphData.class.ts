import { ChartDataSets } from "chart.js";
import { GraphEntry } from './graphEntry.class';

export class GraphData {
    id: string;
    title: string;
    player: string;
    entries: GraphEntry[] = [];

    constructor(id: string, title: string, player: string, entries: GraphEntry[]) {
        this.id = id;
        this.title = title;
        this.player = player;
        this.entries = entries;
    }

    getColumns(): string[] {
        return this.entries.map((entry) => entry.column);
    }

    getSets(): ChartDataSets[] {
        return [{
            label: this.player,
            data: this.entries.map((entry) => entry.value)
        }];
    }
}