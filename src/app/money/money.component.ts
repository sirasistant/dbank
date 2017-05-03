import { Component, OnInit, Input } from '@angular/core';
import { ContractService, ConnectionStatus } from '../services/contract.service';

@Component({
  selector: 'app-money',
  templateUrl: './money.component.html',
  styleUrls: ['./money.component.less']
})
export class MoneyComponent implements OnInit {

  @Input() account: string;

  public labels: string[] = ['Savings', 'Invested'];
  public moneyData: number[] = [0, 0];
  public chartType: string = 'doughnut';

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.contractService.getSavings().then((amount) => {
      this.moneyData[0] = amount;
    })
  }

}
