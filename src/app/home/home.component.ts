import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  searchForm = new FormGroup({
    playerName: new FormControl('')
  });

  constructor(private router: Router) { }

  onSubmit(): void {
    this.router.navigate([`/player/${this.searchForm.get('playerName').value}`]);
  }

}
