import {Component, Input, OnInit} from '@angular/core';
import {Client} from "../models";

@Component({
  selector: 'app-clients-table',
  templateUrl: './clients-table.component.html',
  styleUrls: ['./clients-table.component.less']
})
export class ClientsTableComponent implements OnInit {
  @Input() clients: Client[];

  constructor() { }

  ngOnInit() {
    if(this.clients){
      for(let client of this.clients){
        let num_revoked = 0;
        for(let cred of client.credentials){
          if(cred.is_revoked){
            ++num_revoked;
          }
        }
        client['_num_revoked_credentials'] = num_revoked;
        client['_num_available_credentials'] = client.credentials.length - num_revoked;
      }
    }
  }
}
