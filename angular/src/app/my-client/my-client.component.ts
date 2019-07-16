import {Component, OnInit} from '@angular/core';
import {BasicError, Client} from "../models";
import {ClientService} from "../client.service";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-my-client',
  templateUrl: './my-client.component.html',
  styleUrls: ['./my-client.component.less']
})
export class MyClientComponent implements OnInit {
  error: BasicError;

  loading_client: boolean;
  client: Client;

  constructor(private clientService: ClientService) {
  }

  ngOnInit() {
    this.loading_client = true;
    this.clientService.getMyClient(true).pipe(
      finalize(() => this.loading_client = false)
    ).subscribe(
      client => this.client = client,
      error => this.error = error.error
    )
  }
}
