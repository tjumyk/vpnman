import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {AdminHomeComponent} from "./admin-home/admin-home.component";
import {AdminGuard} from "./admin.guard";
import {ForbiddenComponent} from "./forbidden/forbidden.component";
import {NotFoundComponent} from "./not-found/not-found.component";
import {PageComponent} from "./page/page.component";
import {AdminClientComponent} from "./admin-client/admin-client.component";
import {AdminClientCredentialComponent} from "./admin-client-credential/admin-client-credential.component";
import {MyClientComponent} from "./my-client/my-client.component";


const routes: Routes = [
  {path: '', pathMatch:'full', component: HomeComponent},
  {
    path: '',
    component: PageComponent,
    children:[
      {path: 'my-client', component: MyClientComponent},
      {
        path: 'admin',
        canActivate: [AdminGuard],
        children: [
          {path: '', pathMatch: 'full', component: AdminHomeComponent},
          {
            path: 'clients',
            children:[
              {path: '', pathMatch: 'full', redirectTo: '/admin'},
              {
                path: ':client_id',
                component: AdminClientComponent,
                children: [
                  {
                    path: 'credentials',
                    children:[
                      {path: '', pathMatch: 'full', redirectTo: '/admin/clients/:client_id'},
                      {path: ':cred_id', component: AdminClientCredentialComponent}
                    ]
                  }
                ]
              }
            ]}
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
export class AppRoutingModule { }
