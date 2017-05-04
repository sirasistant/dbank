import { Component, OnInit } from '@angular/core';
import { ContractService, ConnectionStatus, ContractStatus, Project } from '../services/contract.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.less']
})
export class ProjectsComponent implements OnInit {

  public status: ContractStatus;
  public projects: Project[] = [];

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.status = this.contractService.statusSubject.getValue();
    this.getProjects();
    this.contractService.statusSubject.subscribe((status) => {
      this.status = status;
      this.getProjects();
    })
  }


  getProjects() {
    if (this.status) {
        this.contractService.getProjects().then(projects => {
            this.projects = projects;
        });
    }
  }

}
