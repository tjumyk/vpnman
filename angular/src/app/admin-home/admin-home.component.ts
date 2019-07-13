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
      },
      error => this.error = error.error
    )
  }
}
