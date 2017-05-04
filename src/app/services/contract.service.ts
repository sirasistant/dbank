import { Injectable, NgZone } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { Http, Headers, Response, URLSearchParams } from "@angular/http";

import 'rxjs/add/operator/toPromise';

declare var window: any;

@Injectable()
export class ContractService {
  web3: any = null;
  userAddresses: String[] = [];
  contract: any = null;
  network: String = null;
  connectionSubject = new BehaviorSubject<ConnectionStatus>(null);

  statusSubject = new BehaviorSubject<ContractStatus>(null);
  investSubject = new BehaviorSubject<String>(null);
  fundSubject = new BehaviorSubject<number>(null);
  withdrawSubject = new BehaviorSubject<number>(null);

  addresses = {
    main: "",
    ropsten: "0xbC2b30C8469cA965a89BB0A64f0A7f4BEcC7D727"
  }

  constructor(private _http: Http, private zone: NgZone) {
  }

  parseBytes(hex: String): number[] {
    var bytes: number[] = [];
    for (var i = 2; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }


  getNetwork(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.web3.eth.getBlock(0, (err: any, block: any) => {
        this.zone.run(() => {
          if (err) {
            return reject(err);
          } else {
            switch (block.hash) {
              case "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3":
                resolve("main")
                break;
              case "0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d":
                resolve("ropsten")
                break;
              default:
                reject("Unknown network");
            }
          }
        });
      })
    });
  }

  public prepare() {
    if (window.web3) {
      this.web3 = window.web3;
      this.init().then(userAccounts => {
        this.connectionSubject.next(new ConnectionStatus(true, null));
        var fund = this.contract.fund({ user: userAccounts[0] });
        fund.watch((error: any, event: any) => {
          this.zone.run(() => {
            this.fundSubject.next(event.args.amount);
          });
        });
        var withdrawal = this.contract.withdrawal({ user: userAccounts[0] });
        withdrawal.watch((error: any, event: any) => {
          this.zone.run(() => {
            this.withdrawSubject.next(event.args.amount);
          });
        });
        var userInvested = this.contract.userInvested({ user: userAccounts[0] });
        userInvested.watch((error: any, event: any) => {
          this.zone.run(() => {
            this.investSubject.next(event.args.beneficiary);
          });
        });
        var status = this.contract.statusChange();
        status.watch((error: any, event: any) => {
          this.updateStatus()
        });
        this.updateStatus();
      }).catch(error => this.connectionSubject.next(new ConnectionStatus(false, error)));
    } else {
      this.connectionSubject.next(new ConnectionStatus(false, "No web3"))
    }
  }

  private updateStatus() {
    this.zone.run(() => {
      var status: any = {};
      this.getCrowdfundStarted().then(value => {
        status.crowdfundStarted = value;
        return this.getProjectsAllowed();
      }).then(value => {
        status.projectsAllowed = value;
        this.statusSubject.next(status);
      })
    });
  }

  private init(): Promise<String[]> {
    return new Promise<String[]>((resolve, reject) => {
      if (!this.web3) {
        return reject("No web3");
      } else {
        this._http.get("assets/abi.json").toPromise().then(res => {
          var abi = res.json();
          this.web3.eth.getAccounts((err: any, list: string[]) => {
            this.zone.run(() => {
              if (err) {
                return reject(err);
              } else {
                if (list.length == 0) {
                  return reject("No address")
                } else {
                  this.getNetwork().then(network => {
                    this.network = network;
                    this.contract = this.web3.eth.contract(abi).at(this.addresses[network]);
                    this.userAddresses = list;
                    return resolve(list);
                  }).catch(err => { reject(err) })
                }
              }
            });
          });
        }).catch(err => {
          reject(err);
        });
      }
    });
  }

  private getProjectsAllowed(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.contract.getProjectsAllowed((err: any, projectsAllowed: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(projectsAllowed);
        });
      });
    })
  }

  private getCrowdfundStarted(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.contract.getCrowdfundStarted((err: any, crowdfundStarted: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(crowdfundStarted);
        });
      });
    })
  }

  toEther(wei: any): number {
    return wei.dividedBy(Math.pow(10, 18)).toNumber();
  }

  toWei(ether: number): any {
    return this.web3.toWei(ether);
  }

  addMoney(ether: number): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.web3.eth.sendTransaction({
        from: this.userAddresses[0],
        to: this.contract.address,
        value: this.toWei(ether)
      }, (err) => {
        if (err)
          reject(err);
        resolve();
      }));
  }

  withdrawMoney(ether: number): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      this.contract.safeWithdraw(this.toWei(ether), (err) => {
        if (err)
          reject(err);
        resolve();
      }));
  }

  getSavings(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.contract.savings(this.userAddresses[0], (err: any, amount: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(amount);
        })
      })
    });
  }

  getInvestment(): Promise<Investment> {
    return new Promise<Investment>((resolve, reject) => {
      this.contract.getInvestment((err: any, data: any[]) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(new Investment(data[0], data[1]));
        })
      })
    });
  }

  private getProjectsCount(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.contract.getProjectsCount((err: any, data: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(data.toNumber());
        })
      })
    });
  }

  private getProjectCreator(index: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.contract.getProjectCreator(index, (err: any, data: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(data);
        })
      })
    });
  }

  private getProject(address: string): Promise<Project> {
    return new Promise<Project>((resolve, reject) => {
      this.contract.getProject(address, (err: any, data: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(new Project(data[0], data[1], data[2], data[3]))
        })
      })
    });
  }

  getProjects(): Promise<Project[]> {
    var projects = [];
    return this.getProjectsCount().then((count) => {
      return Promise.all(Array.apply(0, new Array(count)).map((value, i) => {
        return this.getProjectCreator(i).then(address => {
          return this.getProject(address);
        });
      }));
    });
  }

  getCurrentProject(): Promise<Project> {
    return new Promise<Project>((resolve, reject) => {
      this.contract.getCurrentProject((err: any, data: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return data[3] === this.getZeroAddress() ? resolve(null) : resolve(new Project(data[0], data[1], data[2], data[3]));
        })
      })
    });
  }

  investMoney(project: string, amount: number) {
    return new Promise<void>((resolve, reject) => {
      this.contract.invest(this.toWei(amount), project, (err: any, data: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(data);
        })
      })
    });
  }

  getZeroAddress(): string {
    return "0x0000000000000000000000000000000000000000";
  }

}

export class ConnectionStatus {
  connected: boolean;
  error: any;

  constructor(connected: boolean, error: any) {
    this.connected = connected;
    this.error = error;
  }
}

export class ContractStatus {
  projectsAllowed: boolean;
  crowdfundStarted: boolean;
}

export class Investment {
  amount: number;
  beneficiary: string;

  constructor(amount: number, beneficiary: string) {
    this.amount = amount;
    this.beneficiary = beneficiary;
  }
}

export class Project {
  finalAmount: number;
  investedAmount: number;
  profitability: number;
  creator: string;

  constructor(finalAmount: number, investedAmount: number, profitability: number, creator: string) {
    this.finalAmount = finalAmount;
    this.investedAmount = investedAmount;
    this.profitability = profitability;
    this.creator = creator;
  }
}