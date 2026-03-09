import {Component, OnInit} from '@angular/core';
import {BasicError, Client, ClientCredential, OpenVPNServerStatus, User} from "../models";
import {ClientService} from "../client.service";
import {AccountService} from "../account.service";
import {StatusService} from "../status.service";
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

  downloadConfigForLinux: boolean;
  showDownloadConfigModal: boolean;

  loadingServerStatus: boolean;
  serverStatus: OpenVPNServerStatus;

  constructor(private accountService: AccountService,
              private clientService: ClientService,
              private statusService: StatusService) {
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
            for (let cred of client.credentials) {
              if (!cred.is_revoked) {
                this.activeCredential = cred;
                break;
              }
            }
          },
          error => this.error = error.error
        )

        this.loadingServerStatus = true;
        this.statusService.getServerStatus().pipe(
          finalize(() => this.loadingServerStatus = false)
        ).subscribe(
          status => this.serverStatus = status,
          // ignore errors here; message line will simply not appear or show "offline"
          () => this.serverStatus = {online: false}
        );
      },
      error => this.error = error.error
    )
  }

  startDownload(is_linux: boolean){
    this.showDownloadConfigModal=  true;
    this.downloadConfigForLinux = is_linux;
  }
}
