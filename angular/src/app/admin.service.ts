import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Client, ClientCredential, OpenVPNInfo, OpenVPNLogLine, RouteRule} from "./models";

export class RouteForm {
  ip: string;
  mask: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) {
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>('api/admin/clients')
  }

  getClient(cid: number): Observable<Client> {
    return this.http.get<Client>(`api/admin/clients/${cid.toString()}`)
  }

  importClient(user_id: number): Observable<Client> {
    return this.http.get<Client>(`api/admin/import-client/${user_id}`)
  }

  revokeCredential(cid: number): Observable<ClientCredential> {
    return this.http.put<ClientCredential>(`api/admin/credentials/${cid.toString()}/revoke`, null)
  }

  unrevokeCredential(cid: number): Observable<ClientCredential> {
    return this.http.delete<ClientCredential>(`api/admin/credentials/${cid.toString()}/revoke`)
  }

  generateCredential(cid: number): Observable<ClientCredential> {
    return this.http.get<ClientCredential>(`api/admin/clients/${cid}/generate-credential`)
  }

  getManagementInfo(): Observable<OpenVPNInfo> {
    return this.http.get<OpenVPNInfo>('api/admin/manage/info')
  }

  getManagementLog(): Observable<OpenVPNLogLine[]> {
    return this.http.get<OpenVPNLogLine[]>('api/admin/manage/log');
  }

  managementClientKill(cid: number): Observable<any> {
    return this.http.get(`api/admin/manage/client-kill/${cid}`)
  }

  managementSoftRestart(): Observable<any> {
    return this.http.get('api/admin/manage/soft-restart')
  }

  managementHardRestart(): Observable<any> {
    return this.http.get('api/admin/manage/hard-restart')
  }

  managementShutdown(): Observable<any> {
    return this.http.get('api/admin/manage/shutdown')
  }

  getRoutes(): Observable<RouteRule[]> {
    return this.http.get<RouteRule[]>('api/admin/server/routes')
  }

  getRoute(rid: number): Observable<RouteRule> {
    return this.http.get<RouteRule>(`api/admin/server/routes/${rid}`)
  }

  addRoute(form: RouteForm): Observable<RouteRule> {
    return this.http.post<RouteRule>('api/admin/server/routes', form)
  }

  updateRoute(rid: number, form: RouteForm): Observable<RouteRule> {
    return this.http.put<RouteRule>(`api/admin/server/routes/${rid}`, form)
  }

  deleteRoute(rid: number): Observable<any> {
    return this.http.delete(`api/admin/server/routes/${rid}`)
  }
}
