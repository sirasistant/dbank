import { Component, OnInit, Input } from '@angular/core';
import { ContractService, ConnectionStatus, ContractStatus, Project } from '../services/contract.service';

@Component({
  selector: 'app-proposal',
  templateUrl: './proposal.component.html',
  styleUrls: ['./proposal.component.less']
})
export class ProposalComponent implements OnInit {

  @Input() account: string;

  public status: ContractStatus;
  public projects: Project[] = [];
  public editProject: Project;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.editProject = new Project(0, 0, 1, this.account);
    this.status = this.contractService.statusSubject.getValue();
    this.getProjects();
    this.contractService.statusSubject.subscribe((status) => {
      this.status = status;
      this.getProjects();
    })
  }

  create() {
    var profitability = Math.floor(this.editProject.profitability);
    if (profitability > 0) {
      this.contractService.createProposal(profitability).then(nothing => {
        this.editProject = new Project(0, 0, 1, this.account);
      })
    } else {
      alert("Invalid profitability, must be fixed number equal or greater than 1")
    }
  }

  getProjects() {
    if (this.status) {
      if (this.status.projectsAllowed) {
        this.contractService.getProjects().then(projects => {
          if (this.status.projectsAllowed) {
            this.projects = projects;
          }
        });
      } else {
        this.projects = [];
      }
    }
  }

  getMyProject() {
    return this.projects && this.projects.length > 0 && this.projects.filter(project => project.creator === this.account)[0];
  }

}
