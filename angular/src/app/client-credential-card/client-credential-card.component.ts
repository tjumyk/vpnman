import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BasicError, ClientCredential} from "../models";
import * as moment from "moment";
import {AdminService} from "../admin.service";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-client-credential-card',
  templateUrl: './client-credential-card.component.html',
  styleUrls: ['./client-credential-card.component.less'],
  host: {class: 'ui segment'}
})
export class ClientCredentialCardComponent implements OnInit {
  @Input() cred: ClientCredential;
  @Input() adminMode: boolean;
  @Output() error: EventEmitter<BasicError> = new EventEmitter();

  is_invalid: boolean;
  is_before_validity: boolean;
  is_expired: boolean;

  revoking: boolean;
  unrevoking: boolean;

  constructor(
    private adminService: AdminService
  ) {
  }

  ngOnInit() {
    if (this.cred) {
      if (this.cred.cert && this.cred.pkey) {
        let now = moment.now();
        let start = moment.utc(this.cred.cert.validity_start);
        let end = moment.utc(this.cred.cert.validity_end);
        if (start.isAfter(now)) {
          this.is_before_validity = true;
        }
        if (end.isBefore(now)) {
          this.is_expired = true;
        }
        if (this.is_before_validity || this.is_expired) {
          this.is_invalid = true;
        }
      } else {
        this.is_invalid = true;
      }
    }
  }

  revoke() {
    this.revoking = true;
    this.adminService.revokeCredential(this.cred.id).pipe(
      finalize(() => this.revoking = false)
    ).subscribe(
      cred => {
        this.cred.is_revoked = cred.is_revoked;
        this.cred.revoked_at = cred.revoked_at;
      },
      error => this.error.emit(error.error)
    )
  }

  unrevoke() {
    this.unrevoking = true;
    this.adminService.unrevokeCredential(this.cred.id).pipe(
      finalize(() => this.unrevoking = false)
    ).subscribe(
      cred => {
        this.cred.is_revoked = cred.is_revoked;
        this.cred.revoked_at = cred.revoked_at;
      },
      error => this.error.emit(error.error)
    )
  }

}
