import { Component, OnInit, Input } from '@angular/core';
import { ContractService, ConnectionStatus, ContractStatus, Project } from '../services/contract.service';

@Component({
  selector: 'app-money',
  templateUrl: './money.component.html',
  styleUrls: ['./money.component.less']
})
export class MoneyComponent implements OnInit {

  @Input() account: string;

  public moneyLabels: string[] = ['Savings', 'Invested'];
  public moneyData: number[] = [0, 0];
  public chartType: string = 'doughnut';

  public saveAmount = 0;
  public withdrawAmount = 0;
  public investAmount = 0;
  public selectedProject: Project;

  public status: ContractStatus;
  public projects: Project[] = [];
  public currentProject:Project = null;
  public investmentTargetAddress:String;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.updateData().then((nothing) => {
      this.contractService.fundSubject.subscribe(update => {
        this.updateData();
      })
      this.contractService.investSubject.subscribe(update => {
        this.updateData();
      })
      this.contractService.withdrawSubject.subscribe(update => {
        this.updateData();
      })
      this.status = this.contractService.statusSubject.getValue();
      this.getProjects();
      this.getCurrentProject();
      this.contractService.statusSubject.subscribe((status) => {
        this.status = status;
        this.getProjects();
        this.updateData();
        this.getCurrentProject();
      })
    })

  }

  updateData(): Promise<void> {
    var money = [];
    return this.contractService.getSavings().then((amount) => {
      money[0] = this.contractService.toEther(amount);
      return this.contractService.getInvestment();
    }).then((investment) => {
      money[1] = this.contractService.toEther(investment.amount);
      this.investmentTargetAddress = investment.beneficiary;
      this.moneyData = money;
      return Promise.resolve();
    });
  }

  getProjects() {
    if (this.status) {
      if (this.status.crowdfundStarted) {
        this.contractService.getProjects().then(projects => {
          if (this.status.crowdfundStarted) {
            this.projects = projects;
          }
        });
      } else {
        this.projects = [];
      }
    }
  }

  getCurrentProject() {
    this.contractService.getCurrentProject().then(project => {
      this.currentProject = project;
    })
  }

  sendMoney() {
    this.contractService.addMoney(this.saveAmount).then((nothing) => {
      this.saveAmount = 0;
    }).catch(err => alert(err));
  }

  withdrawMoney() {
    this.contractService.withdrawMoney(this.withdrawAmount).then((nothing) => {
      this.withdrawAmount = 0;
    }).catch(err => alert(err));
  }

  investMoney() {
    this.contractService.investMoney(this.selectedProject.creator, this.investAmount).then(nothing => {
      this.selectedProject = null;
      this.investAmount = 0;
    })
  }

  claim(){
    this.contractService.claim();
  }

}
