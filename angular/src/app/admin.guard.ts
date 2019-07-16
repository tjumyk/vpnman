import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {AccountService} from "./account.service";
import {catchError, map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private accountService: AccountService,
              private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.accountService.getCurrentUser().pipe(
      map(user => {
        if (user && AccountService.isAdmin(user)) {
          return true;
        }
        this.router.navigate(['/forbidden']);
        return false;
      }),
      catchError((error) => {
        const redirect_url = error.error.redirect_url;
        if (redirect_url) {
          window.location.href = redirect_url;
        } else {
          this.router.navigate(['/forbidden']);
        }
        return of(false);
      })
    )
  }

}
