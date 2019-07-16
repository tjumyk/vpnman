import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {AdminGuard} from "./admin.guard";
import {ForbiddenComponent} from "./forbidden/forbidden.component";
import {NotFoundComponent} from "./not-found/not-found.component";
import {PageComponent} from "./page/page.component";
import {AdminClientComponent} from "./admin-client/admin-client.component";
import {MyClientComponent} from "./my-client/my-client.component";
import {AdminClientsComponent} from "./admin-clients/admin-clients.component";
import {AdminComponent} from "./admin/admin.component";
import {AdminStatusComponent} from "./admin-status/admin-status.component";
import {AdminLogComponent} from "./admin-log/admin-log.component";
import {AdminConfigComponent} from "./admin-config/admin-config.component";


const routes: Routes = [
  {path: '', pathMatch: 'full', component: HomeComponent},
  {
    path: '',
    component: PageComponent,
    children: [
      {path: 'my-client', component: MyClientComponent},
      {
        path: 'admin',
        canActivate: [AdminGuard],
        component: AdminComponent,
        children: [
          {path: '', pathMatch: 'full', redirectTo: '/admin/status'},
          {path: 'status', component: AdminStatusComponent},
          {path: 'log', component: AdminLogComponent},
          {path: 'config', component: AdminConfigComponent},
          {
            path: 'clients',
            children: [
              {path: '', pathMatch: 'full', component: AdminClientsComponent},
              {path: ':client_id', component: AdminClientComponent}
            ]
          }
        ]
      },
    ]
  },
  {path: 'forbidden', component: ForbiddenComponent},
  {path: '**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
