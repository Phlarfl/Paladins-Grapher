import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  constructor(private router: Router) { }

  onSubmit(playerNames: string[]): void {
    this.router.navigate([`/player/${playerNames.join(',')}`]);
  }

}
