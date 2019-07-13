import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Client, ClientCredential, OpenVPNInfo, OpenVPNLogLine} from "./models";

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) { }

  getClients():Observable<Client[]>{
    return this.http.get<Client[]>('api/admin/clients')
  }

  getClient(cid: number): Observable<Client>{
    return this.http.get<Client>(`api/admin/clients/${cid.toString()}`)
  }

  revokeCredential(cid: number): Observable<ClientCredential>{
    return this.http.put<ClientCredential>(`api/admin/credentials/${cid.toString()}/revoke`, null)
  }

  unrevokeCredential(cid: number): Observable<ClientCredential>{
    return this.http.delete<ClientCredential>(`api/admin/credentials/${cid.toString()}/revoke`)
  }

  generateCredential(cid: number): Observable<ClientCredential> {
    return this.http.get<ClientCredential>(`api/admin/clients/${cid}/generate-credential`)
  }

  getManagementInfo(): Observable<OpenVPNInfo> {
    return this.http.get<OpenVPNInfo>('api/admin/manage/info')
  }

  getManagementLog(): Observable<OpenVPNLogLine[]>{
    return this.http.get<OpenVPNLogLine[]>('api/admin/manage/log');
  }

  managementClientKill(cid: number): Observable<any>{
    return this.http.get(`api/admin/manage/client-kill/${cid}`)
  }
}
