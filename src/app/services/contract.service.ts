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
    ropsten: "0xd81D8654F3e8d6292cc44571525e98cEac09eF29"
  }

  constructor(private _http: Http, private zone: NgZone) {
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
        var status = this.contract.status();
        status.watch((error: any, event: any) => {
          var status: any = {};
          this.getCrowdfundStarted().then(value => {
            status.crowdFundStarted = value;
            return this.getProjectsAllowed();
          }).then(value => {
            status.projectsAllowed = value;
            this.statusSubject.next(status);
          })
        });
      }).catch(error => this.connectionSubject.next(new ConnectionStatus(false, error)));
    } else {
      this.connectionSubject.next(new ConnectionStatus(false, "No web3"))
    }
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

  getSavings(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.contract.getSavings((err: any, amount: any) => {
        this.zone.run(() => {
          if (err)
            return reject(err);
          return resolve(amount);
        })
      })
    });
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