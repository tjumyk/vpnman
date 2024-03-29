import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {ErrorComponent} from './error/error.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {ForbiddenComponent} from './forbidden/forbidden.component';
import {HttpClientModule} from "@angular/common/http";
import {PageComponent} from './page/page.component';
import {AdminClientComponent} from './admin-client/admin-client.component';
import {ClientCredentialCardComponent} from './client-credential-card/client-credential-card.component';
import {ClientCardComponent} from './client-card/client-card.component';
import {MyClientComponent} from './my-client/my-client.component';
import {ClientsTableComponent} from './clients-table/clients-table.component';
import {LogTableComponent} from './log-table/log-table.component';
import {AdminLogComponent} from './admin-log/admin-log.component';
import {AdminClientsComponent} from './admin-clients/admin-clients.component';
import {AdminStatusComponent} from './admin-status/admin-status.component';
import {AdminComponent} from './admin/admin.component';
import {FormsModule} from "@angular/forms";
import {ModalComponent} from './modal/modal.component';
import {AdminConfigComponent} from './admin-config/admin-config.component';
import { ClientSetupComponent } from './client-setup/client-setup.component';
import { ClientConfigDownloadModalComponent } from './client-config-download-modal/client-config-download-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ErrorComponent,
    NotFoundComponent,
    ForbiddenComponent,
    PageComponent,
    AdminClientComponent,
    ClientCredentialCardComponent,
    ClientCardComponent,
    MyClientComponent,
    ClientsTableComponent,
    LogTableComponent,
    AdminLogComponent,
    AdminClientsComponent,
    AdminStatusComponent,
    AdminComponent,
    ModalComponent,
    AdminConfigComponent,
    ClientSetupComponent,
    ClientConfigDownloadModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
