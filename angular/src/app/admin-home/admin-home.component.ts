import {Component, OnInit} from '@angular/core';
import {AdminService} from "../admin.service";
import {BasicError, Client} from "../models";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.less']
})
export class AdminHomeComponent implements OnInit {
  error: BasicError;

  loadingClients: boolean;
  clients: Client[];

  constructor(private adminService: AdminService) {
  }

  ngOnInit() {
    this.loadingClients = true;
    this.adminService.getClients().pipe(
      finalize(() => this.loadingClients = false)
    ).subscribe(
      clients => {
        this.clients = clients;

        for(let client of clients){
          let num_revoked = 0;
          for(let cred of client.credentials){
            if(cred.is_revoked){
              ++num_revoked;
            }
          }
          client['_num_revoked_credentials'] = num_revoked;
          client['_num_available_credentials'] = client.credentials.length - num_revoked;
        }
      },
      error => this.error = error.error
    )
  }
}
