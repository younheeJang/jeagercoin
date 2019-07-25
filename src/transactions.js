const CryptoJS = require("crypto-js"),
    elliptic = require("elliptic"),
    _ = require("lodash"),
    utils = require("./utils");

const ec = new elliptic.ec("secp256k1");

const COINBASE_AMOUNT = 50;

class TxOut{
    constructor(address, amount){
        this.address = address;
        this.amount = amount;
    }
}

class TxIn{
    //txOutId
    //txOUtIndex
    //Signature : this not signed yet.
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


//get id as hash.
const getTxId = tx => {
    const txInContent = tx.txIns
        .map(txIn => txIn.uTxOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, "");

    const txOutContent = tx.txOuts
        .map(txOut => txOut.address + txOut.amount)
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
const signTxIn = (tx, txInIndex, privateKey, uTxOutList) => {
    const txIn = tx.txIns[txInIndex];
    const dataToSign = tx.id;
    const referencedUTxOut = findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOutList);
    if(referencedUTxOut === null){
        return;
    }
    const referencedAddress = referencedUTxOut.address;
    if(getPublicKey(privateKey) !== referencedAddress){
        return false;
    }
    const key = ec.keyFromPrivate(privateKey, "hex");

    //export DER encoded signature in array
    const signature = utils.toHexString(key.sign(dataToSign).toDER());
    return signature;
};


const getPublicKey = (privateKey) => {
    return ec
        .keyFromPrivate(privateKey, "hex")
        .getPublic()
        .encode("hex");
}

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


const getAmountInTxIn = (txIn, uTxOutList) => findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOutList).amount;


//validate transaction content.
const validateTx = (tx, uTxOutList) => {

    if(!isTxStructureValid(tx)){
        return false;
    }

    if(getTxId(tx) !== tx.id){
        return false;
    }

    const hasValidTxIns = tx.txIns.map(txIn => 
        validateTxIn(txIn, tx, uTxOutList)
    );

    if(!hasValidTxIns){
        return false;
    }

    const amountInTxIns = tx.txIns
        .map(txIn => getAmountInTxIn(txIn, uTxOutList))
        .reduce((a, b) => a + b,  0);

    const amountInTxOuts = tx.txOuts
        .map(txOut => txOut.amount)
        .reduce((a, b) => a + b, 0);

    //when transaction input occured, get 2 outputs.
    //and amount from input and outputs value should be same.
    if(amountInTxIns !== amountInTxOuts){
        return false;
    }else {
        return true;
    }
};

const validateCoinbaseTx = (tx, blockIndex) => {
    if(getTxId(tx) !== tx.id){
        console.log("invalid coinbase tx id");
        return false;
    }else if(tx.txIns.length !== 1){
        console.log("coinbase tx should only have on input");
        return false;
    }else if(tx.txIns[0].txOutIndex !== blockIndex){
        console.log(
            "the txOutIndex of the coinbase tx should be the same as the block index"
        );
        return false;
    }else if(tx.txOuts.length !== 1){
        console.log("coinbase tx should only have one output");
        return false;
    }else if(tx.txOuts[0].amount !== COINBASE_AMOUNT){
        console.log(
            `coinbase tx should have an amount of only ${COINBASE_AMOUNT} and it has ${
                tx.txOuts[0].amount
            }`
        );
        return false;
    }else{
        return true;
    }
};

//do when miner find block : create coinbase transaction which has
//only one input and output.
const createCoinbaseTx = (address, blockIndex) => {
    const tx = new Transaction();
    const txIn = new TxIn();
    txIn.signature = "";
    txIn.txOutId = blockIndex;
    tx.txIns = [txIn];
    tx.txOuts = [new TxOut(address, COINBASE_AMOUNT)];
    tx.id = getTxId(tx);
    return tx;
}

const hasDuplicates = (txIns) => {
    const groups = _.countBy(txIns, txIn => txIn.txOutId + txIn.txOutIndex);

    return _(groups).map(value => {
        if(value > 1){
            console.log("found a duplicated txIn");
            return true;
        }else{
            return false;
        }
    }).includes(true)
}

const validateBlockTx = (tx, uTxOutList, blockIndex) => {
    const coinbaseTx = tx[0];
    if(!validateCoinbaseTx(coinbaseTx, blockIndex)){
        console.log("coinbase tx is invalid");
    }

    const txIns = _(tx)
        .map(tx => tx.Ins)
        .flatten()
        .value();
    
    if(hasDuplicates(txIns)){
        console.log("found dupocated txIns");
        return false;
    }

    const nonCoinbaseTxs = tx.slice(1);
};

const processTxs = (txs, uTxOutList, blockIndex) => {
    if(!validateBlockTx(tx, uTxOutList, blockIndex)){
        return null;
    }
    return updateUTxOuts(txs, uTxOutList);
}

module.exports = {
    getPublicKey,
    getTxId,
    signTxIn,
    TxIn,
    Transaction,
    TxOut,
    createCoinbaseTx
}