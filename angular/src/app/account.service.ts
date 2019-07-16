import {Injectable} from '@angular/core';
import {User} from "./models";
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private user: User;

  constructor(private http: HttpClient) {
  }

  static isAdmin(user: User): boolean {
    for (let group of user.groups) {
      if (group.name == 'admin')
        return true;
    }
    return false;
  }

  getCurrentUser(): Observable<User> {
    if (this.user)
      return of(this.user);

    return this.http.get<User>(`api/me`).pipe(
      tap(user => {
        this.user = user;
      })
    )
  }
}
