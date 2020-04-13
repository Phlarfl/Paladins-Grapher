import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';

import * as axios from 'axios';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Graph } from '../classes/graph.class';
import { MatchPlayer } from '../classes/matchPlayer.class';
import { Champion } from '../classes/champion.class';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];

  playerName = new BehaviorSubject<String>("");
  players = new BehaviorSubject<{ [key: string]: any }>({});
  graphs = new BehaviorSubject<{ [key: string]: Graph }>({});
  matches = new BehaviorSubject<{ [key: string]: MatchPlayer[] }>({});
  champions = new BehaviorSubject<{ [key: string]: Champion }>({});

  loading = true;
  adding = new BehaviorSubject<boolean>(false);
  refreshing: { [key: string]: BehaviorSubject<boolean> } = {};
  loadingChampions = false;

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

    this.subscriptions.push(this.players.subscribe((players) => {
      this.getLiveMatchData();
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

  getMatches(): MatchPlayer[][] {
    return Object.values(this.matches.getValue());
  }

  getTeam(team: number, match: MatchPlayer[]): MatchPlayer[] {
    return match.filter((player, index) => (team === 0 && index < 5) || (team === 1 && index >= 5));
  }

  getData(playerName: string) {
    axios.default.post('/api/player', { player: playerName }).then((res) => {
      if (res.data.error) {
        console.error('There was an error receiving player data:', res.data.error);
        this.snackbar.open(res.data.error, undefined, {
          duration: 5000
        });
        return;
      }
      if (res.status != 200 || !res.data || !res.data.player || !res.data.playerStatus || !res.data.matches || !res.data.champions) {
        console.error('There was an error receiving player data:', res.status, res.statusText, res.data ? '' : 'No data received');
        this.snackbar.open('An error occurred, please try again', undefined, {
          duration: 5000
        });
        return;
      }
      const player = {
        ...res.data.player,
        status: res.data.playerStatus
      };

      const matches = res.data.matches;
      const champions = res.data.champions;

      if (this.players.getValue()[player.hz_player_name]) return;

      const players = this.players.getValue();
      players[player.hz_player_name] = player;
      this.players.next(players);

      const graphDatas = [
        Graph.buildDamageDealtGraph(player.hz_player_name, matches),
        Graph.buildDamageTakenGraph(player.hz_player_name, matches),
        Graph.buildKdaGraph(player.hz_player_name, matches),
        Graph.buildChampionWinsGraph(player.hz_player_name, champions),
        Graph.buildChampionLossesGraph(player.hz_player_name, champions),
        Graph.buildChampionKdaGraph(player.hz_player_name, champions)
      ];

      const graphs = this.graphs.getValue();
      graphDatas.forEach((graphData) => {
        const existing = graphs[graphData.id];
        if (existing) {
          existing.addData(graphData);
        } else graphs[graphData.id] = new Graph(graphData);
      })
      this.graphs.next(graphs);
      this.addForm.get('playerName').reset();
    }).catch((reason) => {
      console.error('There was an error receiving player data:', reason);
      this.snackbar.open('An error occurred, please try again', undefined, {
        duration: 5000
      });
    }).finally(() => {
      this.loading = false;
      this.adding.next(false);
    });
  }

  onAdd(player?: string): void {
    if (!this.adding.getValue()) {
      this.adding.next(true);
      if (player) {
        if (player.length === 0) {
          this.snackbar.open(`Cannot add this player, their profile is hidden`, undefined, {
            duration: 5000
          });
          this.adding.next(false);
          return;
        }
        if (player.length > 0)
          this.addForm.get('playerName').setValue(player);
      }
      const playerName = player || this.addForm.get('playerName').value;
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

  refreshPlayerStatus(player: any) {
    let refresh = this.refreshing[player.hz_player_name];
    if (!refresh) this.refreshing[player.hz_player_name] = refresh = new BehaviorSubject(false);
    if (!refresh.getValue()) {
      refresh.next(true);

      axios.default.post('/api/player/status', { player: player.hz_player_name }).then((res) => {
        if (res.data.error) {
          console.error('There was an error receiving player data:', res.data.error);
          this.snackbar.open(res.data.error, undefined, {
            duration: 5000
          });
          return;
        }
        if (res.status != 200 || !res.data || !res.data.playerStatus) {
          console.error('There was an error receiving player data:', res.status, res.statusText, res.data ? '' : 'No data received');
          this.snackbar.open('An error occurred, please try again', undefined, {
            duration: 5000
          });
          return;
        }
        const players = this.players.getValue();
        if (!players[player.hz_player_name]) {
          console.error('There was an error refreshing player status, player not found:', player.hz_player_name);
          this.snackbar.open('There was an issue refreshing player status, please refresh the page', undefined, {
            duration: 5000
          });
          return;
        }
        players[player.hz_player_name].status = res.data.playerStatus;
        this.players.next(players);
      }).finally(() => {
        refresh.next(false);
      });
    }
  }

  getLiveMatchData() {
    const liveMatches = {};
    Object.values(this.players.getValue()).forEach((player) => {
      if (player.status.Match)
        liveMatches[player.status.Match] = player.status.Match;
    });
    if (Object.values(liveMatches).length > 0)
      axios.default.post('/api/match', { matches: Object.values(liveMatches) }).then((res) => {
        if (res.data.error) {
          console.error('There was an error receiving match data:', res.data.error);
          this.snackbar.open(res.data.error, undefined, {
            duration: 5000
          });
          return;
        }
        if (res.status != 200 || !res.data || !res.data.matches) {
          console.error('There was an error receiving match data:', res.status, res.statusText, res.data ? '' : 'No data received');
          this.snackbar.open('An error occurred, please try again', undefined, {
            duration: 5000
          });
          return;
        }
        const matches: { [key: number]: MatchPlayer[] } = res.data.matches;
        this.matches.next(matches);

        const champions: number[] = [];
        Object.values(matches).forEach((match) => {
          match.forEach((player) => {
            if (champions.indexOf(player.ChampionId) === -1)
              champions.push(player.ChampionId);
          });
        });
        this.getChampions(champions);
      });
  }

  getChampions(champions: number[]) {
    if (!this.loadingChampions) {
      this.loadingChampions = true;
      axios.default.post('/api/champions', { champions: champions }).then((res) => {
        if (res.data.error) {
          console.error('There was an error receiving champion data:', res.data.error);
          this.snackbar.open(res.data.error, undefined, {
            duration: 5000
          });
          return;
        }
        if (res.status != 200 || !res.data || !res.data.champions) {
          console.error('There was an error receiving champion data:', res.status, res.statusText, res.data ? '' : 'No data received');
          this.snackbar.open('An error occurred, please try again', undefined, {
            duration: 5000
          });
          return;
        }
        const champions: { [key: number]: Champion } = {};
        res.data.champions.forEach((champion: Champion) => {
          champions[champion.id] = champion;
        })
        this.champions.next(champions);
      });
    }
  }
}
