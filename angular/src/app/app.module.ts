import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {AdminHomeComponent} from './admin-home/admin-home.component';
import {ErrorComponent} from './error/error.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {ForbiddenComponent} from './forbidden/forbidden.component';
import {HttpClientModule} from "@angular/common/http";
import { PageComponent } from './page/page.component';
import { AdminClientComponent } from './admin-client/admin-client.component';
import { AdminClientCredentialComponent } from './admin-client-credential/admin-client-credential.component';
import { ClientCredentialCardComponent } from './client-credential-card/client-credential-card.component';
import { ClientCardComponent } from './client-card/client-card.component';
import { MyClientComponent } from './my-client/my-client.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AdminHomeComponent,
    ErrorComponent,
    NotFoundComponent,
    ForbiddenComponent,
    PageComponent,
    AdminClientComponent,
    AdminClientCredentialComponent,
    ClientCredentialCardComponent,
    ClientCardComponent,
    MyClientComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
