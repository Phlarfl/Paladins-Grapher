import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ReactiveFormsModule } from '@angular/forms';

import { ChartsModule } from 'ng2-charts';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PlayerComponent } from './player/player.component';
import { MatchesComponent } from './player/matches/matches.component';
import { ChipInputComponent } from './util/chip-input/chip-input.component';

const routes: Routes = [{
  path: '', component: HomeComponent
}, {
  path: 'player/:playerNames', component: PlayerComponent
}];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PlayerComponent,
    MatchesComponent,
    ChipInputComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),

    ReactiveFormsModule,

    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,

    ChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
