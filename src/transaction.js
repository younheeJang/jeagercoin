const CryptoJS = require("crypto-js");

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

//get id as hash.
const getTxId = tx => {
    const txInContent = tx.txIns
        .map(txIn => txIn.uTxOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, "");

    const txOutContent = tx.txOuts
        .map(txOUt => txOut.address + txOut.amount)
        .reduce((a, b) => a + b, "");
    
    return CryptoJS.SHA256(txInContent + txOutContent).toString();
};



