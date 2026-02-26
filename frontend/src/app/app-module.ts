import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { HomeComponent } from './home/home';
import { DetalleBuild } from './pages/detalle-build/detalle-build';
import { CreateBuild } from './pages/create-build/create-build';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ProfileComponent } from './pages/profile/profile';
import { IsLoggedInDirective } from './directives/is-logged-in.directive';
import { PoeItemComponent } from './components/poe-item/poe-item';
import { AddItemModalComponent } from './components/add-item-modal/add-item-modal';
import { WikiLinkPipe } from './pipes/wiki-link.pipe';

@NgModule({
  declarations: [
    App,
    Header,
    Footer,
    HomeComponent,
    DetalleBuild,
    CreateBuild,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    PoeItemComponent,
    AddItemModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    IsLoggedInDirective,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    WikiLinkPipe
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
