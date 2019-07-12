import {Component, Input, OnInit} from '@angular/core';
import {Client} from "../models";

@Component({
  selector: 'app-client-card',
  templateUrl: './client-card.component.html',
  styleUrls: ['./client-card.component.less'],
  host: {class: 'ui segment'}
})
export class ClientCardComponent implements OnInit {
  @Input() client: Client;

  constructor() {
  }

  ngOnInit() {
  }

}
