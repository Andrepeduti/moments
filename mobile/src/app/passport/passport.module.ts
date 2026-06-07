import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PassportPage } from './passport.page';
import { PassportPageRoutingModule } from './passport-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PassportPageRoutingModule
  ],
  declarations: [PassportPage]
})
export class PassportPageModule {}
