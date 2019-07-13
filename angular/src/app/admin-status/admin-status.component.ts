import {Component, OnInit} from '@angular/core';
import {BasicError, OpenVPNClient, OpenVPNInfo} from "../models";
import {AdminService} from "../admin.service";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-admin-status',
  templateUrl: './admin-status.component.html',
  styleUrls: ['./admin-status.component.less']
})
export class AdminStatusComponent implements OnInit {
  error: BasicError;

  loadingInfo: boolean;
  info: OpenVPNInfo;

  constructor(private adminService: AdminService) {
  }

  ngOnInit() {
    this.loadingInfo = true;
    this.adminService.getManagementInfo().pipe(
      finalize(() => this.loadingInfo = false)
    ).subscribe(
      info => this.info = info,
      error => this.error = error.error
    );
  }

  client_kill(client: OpenVPNClient, btn: HTMLElement) {
    if (!confirm(`Really want to kill the client connection from ${client.common_name} (client ${client.client_id})?`)) {
      return;
    }

    btn.classList.add('loading', 'disabled');
    this.adminService.managementClientKill(client.client_id).pipe(
      finalize(() => btn.classList.remove('loading', 'disabled'))
    ).subscribe(
      () => client['_killed'] = true,
      error => this.error = error.error
    )
  }
}
