const CryptoJS = require("crypto-js"),
    elliptic = require("elliptic"),
    utils = require("./utils");

const ec = new elliptic.ec("secp256k1");

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
        uTxO => uTxO.txOutId === txOutId &&
        uTxO.txOutIndex === txOutIndex
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
    const key = ec.keyFromPrivate(privateKey, "hex");

    //export DER encoded signature in array
    const signature = utils.toHexString(key.sign(dataToSign).toDER());
    return signature;
};

//when input worked properly, the 2 output comes out, 
//giver's output is empty as many as the money sent, 
//roceiver's output should be updated with money sent from giver.
const updateUTxOuts = (newTxs, uTxOutList) => {
    const newUTxOuts = newTxs.map(tx => {
        tx.txOuts.map((txOut, index) => {
            new UTxOut(tx.id, index, txOut.address, txOut.amount)
        })
    })
    .reduce((a, b) => a.contact(b), []);

    const spentTxOuts = newTxs
        .map(tx => tx.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, "", 0));
    
    const resultingUTxOuts = uTxOutList.filter(
        uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts)
        )
        .concat(newUTxOuts);
    
    return resultingUTxOuts;
}



// [a(40), b, c, d]

// a(40) as input ----> transaction ----> y(10)/u(30) get 2 outputs.
// the last one parameter's name, resultingUTxOuts 
// [b, c, d, y, u]



//process structure valid or not
const isTxInStructureValid = (txIn) => {
    if(txIn === null) {
        return false;
    } else if(typeof txIn.signature !== "string"){
        return false;
    } else if(typeof txIn.txOutId !== "string"){
        return false;
    } else if(typeof txIn.txOutIndex !== "number"){
        return false;
    } else {
        return true;
    }
}

const isAddressValid = (address) => {
    //for less length 130
    if(address.length !== 130){
        return false;
    //for not hexadecimal pattern.
    }else if(address.match("^[a-fA-F0-9]+$") === null){
        return false;
    //for wrong public key
    }else if(!address.startsWith("04")){
        return false;
    }else {
        return true;
    }
}

const isTxOutStructureValid = (txOut) => {
    if(txOut === null) {
        return false;
    }else if(typeof txOut.address !== "string"){
        return false;
    }else if(!isAddressValid(txOut.address)){
        return false;
    }else if(typeof txOut.amount !== "number"){
        return false;
    }else {
        return true;
    }
} 

const isTxStructureValid = (tx) => {
    if(typeof tx.id !== "string"){
        console.log("tx id is not valid");
        return false;
    }else if(!(tx.txIns instanceof Array)){
        console.log("the txIns are not an array");
        return false;
    }else if(
        !tx.txIns.map(isTxInStructureValid).reduce((a, b) => a && b, true)
    ){
        console.log("the structure of one of the txIn is not valid");
        return false;
    }else if(!(tx.txOuts instanceof Array)){
        console.log("the txOuts are not an array");
        return false;
    }else if(
        !tx.txOut.map(isTxOutStructureValid).reduce((a, b) => a && b, true)
    ){
        console.log("the structure of one of the txOut is not valid");
        return false;
    }else {
        return true;
    }
}

//transaction input all referenced output so, checking this same or not.
const validateTxIn = (txIn, tx, uTxOutList) => {
    const wantedTxOut = uTxOutList.find(uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
    if(wantedTxOut === null){
        return false;
    }else {
        //from address, create public key, verify with transaction id and transaction input signature.
        const address = wantedTxOut.address;
        const key = ec.keyFromPublic(address, "hex");
        return key.verify(tx.id, txIn.signature);
    }
}

//validate transaction content.
const validateTx = (tx, uTxOutList) => {
    if(getTxId(tx) !== tx.id){
        return false;
    }

    const hasValidTxIns = tx.txIns.map(txIn => validateTxIn(txIn, tx, uTxOutList));

    if(!hasValidTxIns){
        return false;
    }

    const amountInTxIns = 

    const amountInTxOuts =

    //when transaction input occured, get 2 outputs.
    //and amount from input and outputs value should be same.
    if(amountInTxIns !== amountInTxOuts){
        return false;
    }else {
        return true;
    }
}