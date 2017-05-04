import { Component, OnInit } from '@angular/core';
import { ContractService, ConnectionStatus, ContractStatus, Project } from '../services/contract.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less']
})
export class ProjectComponent implements OnInit {

  public status: ContractStatus;
  public project: Project = null;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.status = this.contractService.statusSubject.getValue();
    this.getProject();
    this.contractService.statusSubject.subscribe((status) => {
      this.status = status;
      this.getProject();
    })
  }

  getProject(){
    this.contractService.getCurrentProject().then(project=>{
      this.project=project;
    })
  }


}
