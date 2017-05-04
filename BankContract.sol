pragma solidity 0.4.8;

contract mortal {
    /* Define variable owner of the type address*/
    address owner;

    /* this function is executed at initialization and sets the owner of the contract */
    function mortal() { owner = msg.sender; }

    /* Function to recover the funds on the contract */
    function kill() { if (msg.sender == owner) suicide(owner); }
}

contract BankContract is mortal {
    struct investment{
        uint amount;
        address beneficiary;
    }
    
    struct project{
        uint finalAmount;
        uint investedAmount;
        uint profitability;
        address creator;
        address[] investors;
    }
    
    event fund(address user, uint amount);
    event withdrawal(address user, uint amount);
    event userInvested(address user,address beneficiary);
    event statusChange();
    
    address creator;
    bool crowdfundStarted = false;
    bool projectsAllowed = false;
    
    mapping(address=>investment) public bakers;
    
    mapping(address=>project) public projects;
    
    address[] public projectCreators;
    
    mapping(address=>uint) public savings;
    
    project public currentProject;
    
    modifier isOwnerOfBank(){ 
        if (creator != msg.sender) throw; _;
    }
    
    modifier isCrowdfundStarted(){
        if(!crowdfundStarted) throw; _;
    }
    
    modifier isCrowdfundFinished(){
        if(crowdfundStarted) throw; _;
    }
    
    modifier areProjectsAllowed(){
        if(!projectsAllowed) throw; _;
    }
    
    /* Constructor */
    function BankContract() {
        creator = msg.sender;
    }
    
    function startProposals() isOwnerOfBank(){
        projectsAllowed = true;
        projects.length = 0;
        projectsCreators.length = 0;
        delete currentProject;
        statusChange();
    }
    
    function finishProposals() isOwnerOfBank(){
        projectsAllowed = false;
        statusChange();
    }
    
    function startCrowdfund() isOwnerOfBank(){
        crowdfundStarted = true;
        statusChange();
    }
    
    function finishCrowdfund() isOwnerOfBank(){
        if(currentProject.creator!=address(0))throw;
        address winnerProjectCreator = address(0);
        uint maxInvestment = 0;
        for(uint i = 0;i< projectCreators.length;i++){
            if(projects[projectCreators[i]].investedAmount>maxInvestment){
                winnerProjectCreator = projectCreators[i];
                maxInvestment = projects[projectCreators[i]].investedAmount;
            }
        }
        if(maxInvestment>0){
            currentProject = projects[winnerProjectCreator];
            currentProject.finalAmount =  currentProject.investedAmount + currentProject.investedAmount/100*currentProject.profitability;
            savings[currentProject.creator] += currentProject.investedAmount;
        }
        crowdfundStarted = false;
        statusChange();
    }
    
    function returnInvestment() isCrowdfundFinished(){
        investment toReturn = bakers[msg.sender];
        if(toReturn.beneficiary!=currentProject.creator){
            savings[msg.sender]+= toReturn.amount;
            delete bakers[msg.sender];
        }
    }
    
    function addMoney() payable{
        savings[msg.sender] += msg.value;
        if(currentProject.creator==msg.sender&&savings[msg.sender]>=currentProject.finalAmount){
            finishProject();
        }
        fund(msg.sender,msg.value);
    }
    
    //Default function called every time user sends money to the contract
    function() payable{
       addMoney(); 
    }
    
    function safeWithdraw(uint amount){
        if(amount>0&&amount<=savings[msg.sender]){
            savings[msg.sender]-= amount;
            if(!msg.sender.send(amount)){
                savings[msg.sender]+= amount;
            }else{
                withdrawal(msg.sender,amount);
            }
        }
    }
    
    function addProject(uint profitability) areProjectsAllowed(){
        if(projects[msg.sender].creator==address(0)){ //Check if the sender already sent a project
            projects[msg.sender].creator = msg.sender;
            projects[msg.sender].profitability = profitability;
            projectCreators.push(msg.sender);
        }else{
            throw;
        }
    }
    
    function invest(uint amount,address projectCreator) isCrowdfundStarted(){
        if(amount>0&&bakers[msg.sender].amount ==0 &&savings[msg.sender]>=amount&&projects[projectCreator].creator!=address(0)){
            bakers[msg.sender].amount = amount;
            bakers[msg.sender].beneficiary = projectCreator;
            projects[projectCreator].investors.push(msg.sender);
            projects[projectCreator].investedAmount += amount;
            savings[msg.sender] -= amount;
            userInvested(msg.sender,projectCreator);
        }else{
            trow;
        }
    }
    
    function finishProject() private{
        for(uint i = 0;i<currentProject.investors.length;i++){
            investment current = bakers[currentProject.investors[i]];
            uint amountToGive = current.amount + current.amount / 100 * currentProject.profitability;
            savings[currentProject.investors[i]]+= amountToGive;
            savings[msg.sender] -= amountToGive;
            delete bakers[currentProject.investors[i]];
        }
        delete currentProject;
        statusChange();
    }

    function getProjectsAllowed() constant returns(bool){
        return projectsAllowed;
    }

    function getCrowdfundStarted() constant returns(bool){
        return crowdfundStarted;
    }


    function getSavings() constant returns(uint){
        return savings[msg.sender];
    }

    function getInvestment() constant returns(uint,address){
        return (bakers[msg.sender].amount, bakers[msg.sender].beneficiary);
    }

    function getProjectsCount() constant returns (uint){
        return projectCreators.length;
    }
    
    function getProjectCreator(uint index)constant returns (address){
        return projectCreators[index];
    }

    function getProject(address creator) constant returns (uint,uint,uint,address){
        return (projects[creator].finalAmount,projects[creator].investedAmount,projects[creator].profitability,projects[creator].creator);
    }

    function getCurrentProject() constant returns (uint,uint,uint,address){
          return (currentProject.finalAmount,currentProject.investedAmount,currentProject.profitability,currentProject.creator);
    }
    
}