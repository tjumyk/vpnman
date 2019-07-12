import {Component, Input, OnInit} from '@angular/core';
import {BasicError} from "../models";

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.less']
})
export class ErrorComponent implements OnInit {
  @Input()
  error: BasicError;

  is_cleared: boolean;

  constructor() {
  }

  ngOnInit() {
  }

  redirect(url: string) {
    window.location.href = url;
  }
}
