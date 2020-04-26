import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';

import * as axios from 'axios';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Graph } from '../classes/graph.class';
import { MatchPlayer } from '../classes/matchPlayer.class';
import { Champion } from '../classes/champion.class';
import { RequestHelper } from '../classes/request.helper.class';
import { SnackbarService } from '../snackbar.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlayerComponent implements OnInit, OnDestroy {

  subscriptions: Subscription[] = [];

  playerNames = new BehaviorSubject<string[]>([]);
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

  constructor(private route: ActivatedRoute, private snackbar: SnackbarService) { }

  ngOnInit() {
    this.subscriptions.push(this.route.paramMap.subscribe((paramMap) => {
      this.playerNames.next(paramMap.get('playerNames').split(','));
    }));

    this.subscriptions.push(this.playerNames.subscribe((playerNames: string[]) => {
      this.getData(playerNames);
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

  getMatches(): MatchPlayer[][] {
    return Object.values(this.matches.getValue());
  }

  displayMessage(error: string) {
    this.snackbar.queueSnackBar(error, { duration: 2000 });
  }

  getData(playerNames: string[]) {
    new RequestHelper<{ player: any, playerStatus: any, matches: any, champions: any, error: string }[]>()
      .to('/api/player')
      .with({ playerNames: playerNames })
      .catch((error) => this.displayMessage(error))
      .finally(() => { this.loading = false; this.adding.next(false); })
      .post((res) => {
        res.forEach((res) => {
          if (res.error) {
            this.displayMessage(res.error);
            return;
          }

          const player = {
            ...res.player,
            status: res.playerStatus
          };

          const matches = res.matches;
          const champions = res.champions;

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
        });
        this.addForm.get('playerName').reset();
      });
  }

  onAdd(player?: string): void {
    if (!this.adding.getValue()) {
      this.adding.next(true);
      if (player) {
        if (player.length === 0) {
          this.displayMessage('Cannot add this player, their profile is hidden');
          this.adding.next(false);
          return;
        }
        if (player.length > 0) this.addForm.get('playerName').setValue(player);
      }
      const playerName = player || this.addForm.get('playerName').value;
      this.getData([playerName]);
    }
  }

  onDelete(player): void {
    const players = this.players.getValue();
    delete players[player];
    this.players.next(players);
    Object.values(this.graphs.getValue()).forEach((graph) => graph.deleteData(player));
    this.displayMessage(`Removed ${player}'s data`);
  }

  refreshPlayerStatus(player: any) {
    let refresh = this.refreshing[player.hz_player_name];
    if (!refresh) this.refreshing[player.hz_player_name] = refresh = new BehaviorSubject(false);
    if (!refresh.getValue()) {
      refresh.next(true);

      new RequestHelper<{ playerStatus: any }>()
        .to('/api/player/status')
        .with({ player: player.hz_player_name })
        .catch((error) => this.displayMessage(error))
        .finally(() => { refresh.next(false); })
        .post((res) => {
          const players = this.players.getValue();
          players[player.hz_player_name].status = res.playerStatus;
          this.players.next(players);
        });
    }
  }

  getChampions(champions: number[]) {
    if (!this.loadingChampions && champions.length > 0) {
      this.loadingChampions = true;
      new RequestHelper<{ champions: any[] }>()
        .to('/api/champions')
        .with({ champions: champions })
        .catch((error) => this.displayMessage(error))
        .finally(() => { this.loadingChampions = false })
        .post((res) => {
          const champions: { [key: number]: Champion } = {};
          res.champions.forEach((champion: Champion) => { champions[champion.id] = champion; });
          this.champions.next(champions);
        });
    }
  }
}
