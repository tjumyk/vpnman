import {Component, OnInit} from '@angular/core';
import {BasicError, Client, ClientCredential, User} from "../models";
import {ClientService} from "../client.service";
import {AccountService} from "../account.service";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {
  error: BasicError;

  loadingUser: boolean;
  user: User;
  isAdmin: boolean;

  loadingClient: boolean;
  client: Client;

  activeCredential: ClientCredential;

  constructor(private accountService: AccountService,
              private clientService: ClientService) {
  }

  ngOnInit() {
    this.loadingUser = true;
    this.accountService.getCurrentUser().pipe(
      finalize(() => this.loadingUser = false)
    ).subscribe(
      user => {
        this.user = user;
        this.isAdmin = AccountService.isAdmin(user);

        this.loadingClient = true;
        this.clientService.getMyClient(false).pipe(
          finalize(() => this.loadingClient = false)
        ).subscribe(client => {
            this.client = client;

            // find the first non-revoked credential as the default active credential
            this.activeCredential = undefined;
            for(let cred of client.credentials){
              if(!cred.is_revoked){
                this.activeCredential = cred;
                break;
              }
            }
          },
          error => this.error = error.error
        )
      },
      error => this.error = error.error
    )
  }
}
