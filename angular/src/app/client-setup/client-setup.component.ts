import { Component, OnInit } from '@angular/core';
import {UAParser} from "ua-parser-js";
import {finalize} from "rxjs/operators";
import {ClientService} from "../client.service";
import {BasicError, Client, ClientCredential} from "../models";

@Component({
  selector: 'app-client-setup',
  templateUrl: './client-setup.component.html',
  styleUrls: ['./client-setup.component.less']
})
export class ClientSetupComponent implements OnInit {
  error: BasicError;

  activeOS: string;
  loadingClient: boolean;
  client: Client;
  activeCredential: ClientCredential;

  showDownloadConfigModal: boolean;

  private supported_os_list = [
    'Windows', 'Linux', 'Mac OS', 'iOS', 'Android'
  ];

  private linux_os_list = [
    'Linux', 'Ubuntu', 'Debian', 'Arch', 'CentOS', 'Fedora', 'Gentoo', 'Mint', 'RedHat', 'SUSE'
  ];

  constructor(private clientService: ClientService) {
  }

  ngOnInit() {
    this.activeOS = this.getOSType();

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
  }

  getOSType() {
    let parser = new UAParser();
    let os = parser.getOS().name;

    for (let _os of this.supported_os_list) {
      if (_os == os) {
        return os;
      }
    }
    for (let _os of this.linux_os_list) {
      if (_os == os) {
        return 'Linux'
      }
    }
    return 'Other';
  }
}
