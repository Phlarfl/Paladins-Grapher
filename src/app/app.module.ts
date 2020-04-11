import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';


import { ReactiveFormsModule } from '@angular/forms';

import { ChartsModule } from 'ng2-charts';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PlayerComponent } from './player/player.component';

const routes: Routes = [{
  path: '', component: HomeComponent
}, {
  path: 'player/:player', component: PlayerComponent
}];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PlayerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),

    ReactiveFormsModule,

    MatButtonModule,
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
