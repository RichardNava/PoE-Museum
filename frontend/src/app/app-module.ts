import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { HomeComponent } from './home/home';
import { DetalleBuild } from './pages/detalle-build/detalle-build';

@NgModule({
  declarations: [
    App,
    Header,
    Footer,
    HomeComponent,
    DetalleBuild
  ],
imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
