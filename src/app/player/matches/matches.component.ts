import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatchPlayer } from 'src/app/classes/matchPlayer.class';
import { RequestHelper } from 'src/app/classes/request.helper.class';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss']
})
export class MatchesComponent implements OnInit, OnDestroy {

  @Input() players = new BehaviorSubject<{ [key: string]: any }>([]);
  @Input() champions: { [key: number]: any } = {};

  @Output() error: EventEmitter<string> = new EventEmitter<string>();
  @Output() retrieved: EventEmitter<number[]> = new EventEmitter<number[]>();
  @Output() onAdd: EventEmitter<string> = new EventEmitter<string>();

  subscriptions: Subscription[] = [];

  matches: MatchPlayer[][] = [];

  constructor() { }

  ngOnInit(): void {
    this.subscriptions.push(this.players.subscribe((players) => {
      const liveMatches = {};
      Object.values(players).forEach((player) => {
        if (player.status.Match)
          liveMatches[player.status.Match] = player.status.Match;
      });
      if (Object.values(liveMatches).length === 0)
        this.matches = [];
      else
        new RequestHelper<{ matches: any }>()
          .to('/api/match')
          .with({ matches: Object.values(liveMatches) })
          .catch((error) => this.error.emit(error))
          .post((res) => {
            const matches: { [key: number]: MatchPlayer[] } = res.matches;
            this.matches = Object.values(matches);

            const champions: number[] = [];
            Object.values(matches).forEach((match) => {
              match.forEach((player) => {
                if (champions.indexOf(player.ChampionId) === -1)
                  champions.push(player.ChampionId);
              });
            });
            this.retrieved.emit(champions);
          });
    }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  addPlayer(player: any) {
    if (player.playerId) this.onAdd.emit(player.playerName);
    else this.error.emit('Cannot add a bot player');
  }

  getTeam(team: number, match: MatchPlayer[]): MatchPlayer[] {
    return match.filter((player, index) => (team === 0 && index < 5) || (team === 1 && index >= 5));
  }

}
