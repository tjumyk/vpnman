import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Client} from "./models";

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor(private http: HttpClient) {
  }

  getMyClient(details: boolean): Observable<Client> {
    let params = {};
    if (details) {
      params['details'] = 'true'
    }
    return this.http.get<Client>('api/my-client', {params})
  }
}
