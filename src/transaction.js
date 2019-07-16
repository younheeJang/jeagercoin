class TxOut{
    constructor(address, amount){
        this.address = address;
        this.amount = amount;
    }
}

class TxIn{
    //uTxOutId
    //uTxOUtIndex
    //Signature
}

class Transaction {
    //ID
    //txIns[5,5]
    //txOuts[10]
}

class UTxOut {
    constructor(uTxOutId, uTxOutIndex, address, amount){
        this.uTxOutId = uTxOutId;
        this.uTxOutIndex = uTxOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

let uTxOuts = [];