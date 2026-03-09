import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {OpenVPNServerStatus} from "./models";

@Injectable({
  providedIn: 'root'
})
export class StatusService {

  constructor(private http: HttpClient) {
  }

  getServerStatus(): Observable<OpenVPNServerStatus> {
    return this.http.get<OpenVPNServerStatus>('api/server/status');
  }
}

