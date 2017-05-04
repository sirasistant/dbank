import { Component, Inject, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { DOCUMENT } from "@angular/platform-browser";
import { NgForm } from '@angular/forms';
import { ContractService, ConnectionStatus } from './services/contract.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent {
    width = 0;
    account: String;

    constructor(private contractService: ContractService) { }


    ngAfterViewInit() {
        this.proccessConnection(this.contractService.connectionSubject.getValue());
        this.contractService.connectionSubject.subscribe((connection) => this.proccessConnection(connection))
    }

    onWindowLoad() {
        this.contractService.prepare();
    }

    proccessConnection(status: ConnectionStatus) {
        if (status && status.connected) {
            this.account = this.contractService.userAddresses[0];
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.width = event.target.innerWidth;
    }
}
