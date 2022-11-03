import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SlideShowComponent } from './slide-show/slide-show.component';
import { ReactiveFormsModule } from "@angular/forms";

@NgModule({
  declarations: [AppComponent, SlideShowComponent],
    imports: [BrowserModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
