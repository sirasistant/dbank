import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { ChartsModule } from 'ng2-charts';

import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { MoneyComponent } from './money/money.component';

import { ContractService } from './services/contract.service';
import { ProjectComponent } from './project/project.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProposalComponent } from './proposal/proposal.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    MoneyComponent,
    ProjectComponent,
    ProjectsComponent,
    ProposalComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    ChartsModule
  ],
  providers: [ContractService],
  bootstrap: [AppComponent]
})
export class AppModule { }
