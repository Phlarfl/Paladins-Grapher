import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-chip-input',
  templateUrl: './chip-input.component.html',
  styleUrls: ['./chip-input.component.scss']
})
export class ChipInputComponent implements OnInit {

  @Input() placeholder: string;
  @Input() submitIcon: string;

  @Output() onSubmit: EventEmitter<string[]> = new EventEmitter<string[]>();

  separators = [COMMA, ENTER, SPACE];
  items: string[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  add(event: MatChipInputEvent) {
    const item = event.value;
    if (item && item.length > 0) {
      this.items.push(item);
      if (event.input)
        event.input.value = '';
    }
  }

  remove(item: string) {
    const index = this.items.indexOf(item);
    if (index >= 0)
      this.items.splice(index, 1);
  }

  submit() {
    if (this.onSubmit)
      this.onSubmit.emit(this.items);
  }

}
