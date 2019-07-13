import { Component, OnInit } from '@angular/core';
import {BasicError, Client} from "../models";
import {AdminService} from "../admin.service";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-admin-clients',
  templateUrl: './admin-clients.component.html',
  styleUrls: ['./admin-clients.component.less']
})
export class AdminClientsComponent implements OnInit {
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
      },
      error => this.error = error.error
    )
  }

}
