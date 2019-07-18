const CryptoJS = require("crypto-js"),
    elliptic = require("elliptic");

const ec = new EC("secp256k1");

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
    constructor(txOutId, txOutIndex, address, amount){
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
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

//when you want to use input that should be previous outputs so
//you find the output first and use it for using input.
const findUTxOut = (txOutId, txOutIndex, uTxOutList) => {
    return uTxOutList.find(
        uTxOut => uTxOut.txOutId === txOutId &&
        uTxOut.txOutIndex === txOutIndex
        );
}


//sigining transaction input
//+using library called crypto.js and elliptic
const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id;

    const referencedUTxOut = findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOuts);
    if(referencedUTxOut === null){
        return;
    }
};


