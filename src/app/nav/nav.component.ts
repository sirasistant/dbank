import { Component, Inject, HostListener } from '@angular/core';
import { DOCUMENT } from "@angular/platform-browser";
import { ContractService,ConnectionStatus } from '../services/contract.service';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.less']
})
export class NavComponent {

    address:String;

    constructor(private contractService:ContractService) {
    }

    ngAfterViewInit() {
       this.proccessConnection(this.contractService.connectionSubject.getValue());
       this.contractService.connectionSubject.subscribe((connection)=>this.proccessConnection(connection))
    }

    proccessConnection(status:ConnectionStatus){
        if(status&&status.connected){
            this.address = this.contractService.userAddresses[0];
        }
    }

}