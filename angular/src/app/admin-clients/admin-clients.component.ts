import {Component, OnInit} from '@angular/core';
import {BasicError, Client} from "../models";
import {AdminService} from "../admin.service";
import {finalize} from "rxjs/operators";
import {NgForm} from "@angular/forms";

class ImportClientForm {
  user_id: number;
}

@Component({
  selector: 'app-admin-clients',
  templateUrl: './admin-clients.component.html',
  styleUrls: ['./admin-clients.component.less']
})
export class AdminClientsComponent implements OnInit {
  error: BasicError;
  loadingClients: boolean;
  clients: Client[];

  show_import_modal: boolean;
  importing_client: boolean;
  import_client_form = new ImportClientForm();
  imported_client: Client;
  import_error: BasicError;

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

  importClient(form: NgForm) {
    if (form.invalid)
      return;

    this.importing_client = true;
    this.adminService.importClient(this.import_client_form.user_id).pipe(
      finalize(() => this.importing_client = false)
    ).subscribe(
      client => {
        this.imported_client = client;
        this.clients.push(client);
        this.show_import_modal = false;
      },
      error => this.import_error = error.error
    )
  }

}
