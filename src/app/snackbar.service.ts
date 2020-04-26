import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { MatSnackBar, MatSnackBarDismiss } from '@angular/material/snack-bar';
import { filter, tap, map, takeUntil, delay, take } from 'rxjs/operators';

export interface SnackbarConfigParams {
  duration: number;
}

export interface SnackBarQueueItem {
  message: string;
  beingDispatched: boolean;
  configParams?: SnackbarConfigParams;
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService implements OnDestroy {

  private readonly snackBarQueue = new BehaviorSubject<SnackBarQueueItem[]>([]);
  private readonly snackBarQueue$ = this.snackBarQueue.asObservable();
  private readonly ngDestroy = new Subject();


  constructor(private matSnackBar: MatSnackBar) {
    this.snackBarQueue$
     .pipe(
       filter(queue => queue.length > 0 && !queue[0].beingDispatched),
       tap(() => {
         const updatedQueue = this.snackBarQueue.value;
         updatedQueue[0].beingDispatched = true;
         this.snackBarQueue.next(updatedQueue);
       }),
       map(queue => queue[0]),
       takeUntil(this.ngDestroy))
     .subscribe(snackBarItem => this.showSnackbar(snackBarItem.message, snackBarItem.configParams));
  }

  public ngOnDestroy() {
    this.snackBarQueue.next([]);
    this.snackBarQueue.complete();
    this.ngDestroy.next();
    this.ngDestroy.complete();
  }

  public queueSnackBar(message: string, configParams?: SnackbarConfigParams) {
    this.snackBarQueue.next(
      this.snackBarQueue.value.concat([{ message, configParams, beingDispatched: false }]),
    );
  }

  private showSnackbar(message: string, configParams?: SnackbarConfigParams) {
    const duration = this.getDuration(configParams);
    this.removeDismissedSnackBar(
      this.matSnackBar.open(message, undefined, { duration }).afterDismissed(),
    );
  }

  private removeDismissedSnackBar(dismissed: Observable<MatSnackBarDismiss>) {
    dismissed
      .pipe(
        delay(1000),
        take(1))
      .subscribe(() => {
        const updatedQueue = this.snackBarQueue.value;
        if (updatedQueue[0].beingDispatched) updatedQueue.shift();
        this.snackBarQueue.next(updatedQueue);
      });
  }

  private getDuration(configParams?: SnackbarConfigParams): number {
    if (configParams && configParams.duration) return configParams.duration;
    else return 10000;
  }
}