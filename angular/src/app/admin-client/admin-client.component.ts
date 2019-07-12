import {Component, OnInit} from '@angular/core';
import {BasicError, Client} from "../models";
import {AdminService} from "../admin.service";
import {ActivatedRoute} from "@angular/router";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-admin-client',
  templateUrl: './admin-client.component.html',
  styleUrls: ['./admin-client.component.less']
})
export class AdminClientComponent implements OnInit {
  error: BasicError;

  client_id: number;
  loading_client: boolean;
  client: Client;

  generating_credential: boolean;

  constructor(private adminService: AdminService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.client_id = parseInt(this.route.snapshot.paramMap.get('client_id'));

    this.loading_client = true;
    this.adminService.getClient(this.client_id).pipe(
      finalize(() => this.loading_client = false)
    ).subscribe(
      client => this.client = client,
      error => this.error = error.error
    )
  }

  generateCredential() {
    this.generating_credential = true;
    this.adminService.generateCredential(this.client_id).pipe(
      finalize(() => this.generating_credential = false)
    ).subscribe(
      cred => this.client.credentials.push(cred),
      error => this.error = error.error
    )
  }

}
