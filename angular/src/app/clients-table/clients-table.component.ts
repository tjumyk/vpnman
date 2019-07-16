import {Component, Input, OnInit} from '@angular/core';
import {Client} from "../models";

@Component({
  selector: 'app-clients-table',
  templateUrl: './clients-table.component.html',
  styleUrls: ['./clients-table.component.less']
})
export class ClientsTableComponent implements OnInit {
  @Input() clients: Client[];

  // use 'newClient' property to process newly added clients
  // TODO use a more elegant method
  private _newClient: Client;
  @Input() get newClient() {
    return this._newClient;
  }

  set newClient(client: Client) {
    this._newClient = client;
    if (client)
      this.processClient(client);
  }

  constructor() {
  }

  ngOnInit() {
    if (this.clients) {
      for (let client of this.clients) {
        this.processClient(client);
      }
    }
  }

  private processClient(client: Client) {
    let num_revoked = 0;
    for (let cred of client.credentials) {
      if (cred.is_revoked) {
        ++num_revoked;
      }
    }
    client['_num_revoked_credentials'] = num_revoked;
    client['_num_available_credentials'] = client.credentials.length - num_revoked;
  }
}
