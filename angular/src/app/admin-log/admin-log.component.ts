import {Component, OnInit} from '@angular/core';
import {BasicError, OpenVPNLogLine} from "../models";
import {AdminService} from "../admin.service";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-admin-log',
  templateUrl: './admin-log.component.html',
  styleUrls: ['./admin-log.component.less']
})
export class AdminLogComponent implements OnInit {
  error: BasicError;

  loadingLog: boolean;
  log: OpenVPNLogLine[];

  constructor(private adminService: AdminService) {
  }

  ngOnInit() {
    this.loadingLog = true;
    this.adminService.getManagementLog().pipe(
      finalize(() => this.loadingLog = false)
    ).subscribe(
      log => this.log = log,
      error => this.error = error.error
    )
  }

}
