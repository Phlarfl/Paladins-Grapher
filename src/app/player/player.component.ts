import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';

import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';

import * as axios from 'axios';
import { FormGroup, FormControl } from '@angular/forms';
import { getInterpolationArgsLength } from '@angular/compiler/src/render3/view/util';
import { MatSnackBar } from '@angular/material/snack-bar';

class GraphSet {
  label: string;
  data: number[] = [];
}

class GraphData {
  id: string;
  title: string;
  player: string;
  columns: string[] = [];
  sets: ChartDataSets[] = [];
}

class Graph {
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

  constructor(graphData) {
    this.lineChartOptions.title.text = graphData.title;
    this.lineChartLabels = graphData.columns;
    this.addData(graphData);
  }

  addData(graphData) {
    this.graphData[graphData.player] = graphData;
    this.refreshGraph();
  }

  deleteData(player) {
    delete this.graphData[player];
    this.refreshGraph();
  }

  refreshGraph() {
    let chartData = [];
    Object.values(this.graphData).filter((graphData) => graphData != null).forEach((graphData) => {
      chartData = [...chartData, ...graphData.sets];
    });
    this.lineChartData = chartData;

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
}

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];

  playerName = new BehaviorSubject<String>("");
  players = new BehaviorSubject<{ [key: string]: any[] }>({});
  graphs = new BehaviorSubject<{ [key: string]: Graph }>({});

  adding = new BehaviorSubject<boolean>(false);
  loading = true;

  addForm = new FormGroup({
    playerName: new FormControl('')
  });

  constructor(private route: ActivatedRoute, private snackbar: MatSnackBar) { }

  ngOnInit() {
    this.subscriptions.push(this.route.paramMap.subscribe((paramMap) => {
      this.playerName.next(paramMap.get('player'));
    }));

    this.subscriptions.push(this.playerName.subscribe((playerName: string) => {
      this.getData(playerName);
    }));

    this.subscriptions.push(this.adding.subscribe((adding) => {
      if (adding) this.addForm.get('playerName').disable();
      else this.addForm.get('playerName').enable();
    }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getPlayers(): any[] {
    return Object.values(this.players.getValue());
  }

  getGraphs(): Graph[] {
    return Object.values(this.graphs.getValue());
  }

  getData(playerName: string) {
    axios.default.post('/api/player', {
      player: playerName
    }).then((res) => {
      if (res.data.error) {
        console.error('There was an error receiving player data:', res.data.error);
        this.snackbar.open(res.data.error, undefined, {
          duration: 5000
        });
        return;
      }
      if (res.status != 200 || !res.data || !res.data.player || !res.data.graphs) {
        console.error('There was an error receiving player data:', res.status, res.statusText, res.data ? '' : 'No data received');
        this.snackbar.open('An error occurred, please try again', undefined, {
          duration: 5000
        });
        return;
      }
      if (this.players.getValue()[res.data.player.hz_player_name]) return;

      const players = this.players.getValue();
      players[res.data.player.hz_player_name] = res.data.player;
      this.players.next(players);

      const graphs = this.graphs.getValue();
      res.data.graphs.forEach((graph) => {
        if (graphs[graph.id]) {
          const existingGraph = graphs[graph.id];
          existingGraph.addData(graph);
        } else {
          graphs[graph.id] = new Graph(graph);
        }
        this.graphs.next(graphs);
      });
      this.addForm.get('playerName').reset();
    }).catch((reason) => {
      console.error('There was an error receiving player data:', reason);
      this.snackbar.open('An error occurred, please try again', undefined, {
        duration: 5000
      });
    }).then(() => {
      this.loading = false;
      this.adding.next(false);
    });
  }

  onAdd(): void {
    if (!this.adding.getValue()) {
      this.adding.next(true);
      const playerName = this.addForm.get('playerName').value;
      this.getData(playerName);
    }
  }

  onDelete(player): void {
    const players = this.players.getValue();
    delete players[player];
    this.players.next(players);
    Object.values(this.graphs.getValue()).forEach((graph) => graph.deleteData(player));
    this.snackbar.open(`Removed ${player}'s data`, undefined, {
      duration: 3000
    });
  }

}
