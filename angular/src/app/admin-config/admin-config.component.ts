import {Component, OnInit} from '@angular/core';
import {BasicError, RouteRule} from "../models";
import {AdminService, RouteForm} from "../admin.service";
import {finalize} from "rxjs/operators";
import {NgForm} from "@angular/forms";

@Component({
  selector: 'app-admin-config',
  templateUrl: './admin-config.component.html',
  styleUrls: ['./admin-config.component.less']
})
export class AdminConfigComponent implements OnInit {
  error: BasicError;

  loadingRoutes: boolean;
  routes: RouteRule[];

  showRouteEditModal: boolean;
  submittingRouteForm: boolean;
  submitRouteError: BasicError;
  editedRoute: RouteRule;
  routeFormMode: 'new' | 'update';
  routeForm: RouteForm = new RouteForm();

  requireRestart: boolean;

  constructor(private adminService: AdminService) {
  }

  ngOnInit() {
    this.loadingRoutes = true;
    this.adminService.getRoutes().pipe(
      finalize(() => this.loadingRoutes = false)
    ).subscribe(
      routes => this.routes = routes,
      error => this.error = error.error
    )
  }

  startAddRoute() {
    this.routeForm.ip = undefined;
    this.routeForm.mask = undefined;
    this.routeForm.description = undefined;

    this.submitRouteError = undefined;
    this.routeFormMode = 'new';
    this.showRouteEditModal = true;
  }

  startUpdateRoute(route: RouteRule) {
    this.editedRoute = route;
    this.routeForm.ip = route.ip;
    this.routeForm.mask = route.mask;
    this.routeForm.description = route.description;

    this.submitRouteError = undefined;
    this.routeFormMode = 'update';
    this.showRouteEditModal = true;
  }

  submitRouteForm(f: NgForm) {
    if (f.invalid)
      return;

    if (this.routeFormMode == 'new') {
      this.submittingRouteForm = true;
      this.adminService.addRoute(this.routeForm).pipe(
        finalize(() => this.submittingRouteForm = false)
      ).subscribe(
        route => {
          this.routes.push(route);
          this.showRouteEditModal = false;
          this.requireRestart = true;
        },
        error => this.submitRouteError = error.error
      )
    } else if (this.routeFormMode == 'update') {
      this.submittingRouteForm = true;
      this.adminService.updateRoute(this.editedRoute.id, this.routeForm).pipe(
        finalize(() => this.submittingRouteForm = false)
      ).subscribe(
        route => {
          let index = 0;
          for (let r of this.routes) {
            if (r.id == route.id) {
              this.routes.splice(index, 1, route);
              break;
            }
            ++index;
          }
          this.showRouteEditModal = false;
          this.requireRestart = true;
        },
        error => this.submitRouteError = error.error
      )
    }
  }

  deleteRoute(route: RouteRule, btn: HTMLElement, index: number) {
    if (!confirm(`Really want to delete route ${route.id} (${route.ip} ${route.mask} ${route.description || ''})?`))
      return;

    btn.classList.add('loading', 'disabled');
    this.adminService.deleteRoute(route.id).pipe(
      finalize(() => btn.classList.remove('loading', 'disabled'))
    ).subscribe(
      () => {
        this.routes.splice(index, 1);
        this.requireRestart = true;
      },
      error => this.error = error.error
    )
  }

  serverOperation(op: string, btn: HTMLElement) {
    let api;
    if (op == 'soft-restart') {
      if (!confirm('Really want to do a soft restart? Soft restart may not apply the latest configuration. If you want to make sure the latest configuration is used, please try "hard restart" instead.'))
        return;
      api = this.adminService.managementSoftRestart();
    } else if (op == 'hard-restart') {
      if (!confirm('Really want to do a hard restart?'))
        return;
      api = this.adminService.managementHardRestart();
    } else if (op == 'shutdown') {
      if (!confirm('Really want to shutdown the server? You will have to start the server manually from the command line.'))
        return;
      api = this.adminService.managementShutdown();
    } else
      return;

    btn.classList.add('loading', 'disabled');
    api.pipe(
      finalize(() => btn.classList.remove('loading', 'disabled'))
    ).subscribe(
      () => {
        alert('Operation Succeeded!')
      },
      error => this.error = error.error
    )
  }
}
