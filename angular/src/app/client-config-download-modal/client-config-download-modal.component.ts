import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClientCredential} from "../models";

@Component({
  selector: 'app-client-config-download-modal',
  templateUrl: './client-config-download-modal.component.html',
  styleUrls: ['./client-config-download-modal.component.less']
})
export class ClientConfigDownloadModalComponent implements OnInit {
  @Input() credential: ClientCredential;
  @Input() isLinuxClient: boolean;

  private _show: boolean;
  @Input() get show() {
    return this._show;
  }

  set show(show: boolean) {
    this._show = show;
    this.showChange.emit(show);
  }

  @Output() showChange: EventEmitter<boolean> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

}
