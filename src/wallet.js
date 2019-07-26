const elliptic = require("elliptic"),
    path = require("path"),
    fs = require("fs"),
    _ = require("lodash"),
    Transactions = require("./transactions");

const { getPublicKey, getTxId, signTxIn, TxIn, Transaction, TxOut } = Transactions;

const ec = new elliptic.ec("secp256k1");



const privateKeyLocation = path.join(__dirname, "privateKey");

const generatePrivateKey = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
}

const getPrivateFromWallet = () => {
    const buffer = fs.readFileSync(privateKeyLocation, "utf8");
    return buffer.toString();
};

const getPublicFromWallet = () => {
    const privateKey = getPrivateFromWallet();
    const key = ec.keyFromPrivate(privateKey, "hex");
    return key.getPublic().encode("hex");
};

const getBalance = (address, uTxOuts) => {
    return _(uTxOuts)
        .filter(uTxO => uTxO.address === address)
        .map(uTxO => uTxO.amount)
        .sum();
}

const initWallet = () => {
    if(fs.existsSync(privateKeyLocation)){
        return;
    }
    const newPrivateKey = generatePrivateKey();

    fs.writeFileSync(privateKeyLocation, newPrivateKey);
}

//check if user have much money to spend someone.
const findAmountInUTxOuts = (amountNeeded, myUTxOuts) => {
    let currentAmount = 0;
    const includedUTxOuts = [];
    for(const myUTxOut of myUTxOuts){
        includedUTxOuts.push(myUTxOut);
        currentAmount = currentAmount + myUTxOut.amount;
        if(currentAmount >= amountNeeded){
            const leftOverAmount = currentAmount - amountNeeded;
            return { includedUTxOuts, leftOverAmount };
        }
    }
    throw Error("not enough founds");
    return false;
}

const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
    const receiverTxOut = new TxOut(receiverAddress, amount);
    if(leftOverAmount === 0){
        return [receiverTxOut];
    }else {
        const leftOverTxOut = new TxOut(myAddress, leftOverAmount);
        return [receiverTxOut, leftOverTxOut];
    }
}

//uTxOutList : get all outputs from blockchain : this is money
const filterUTxOutsFromMempool = (uTxOutList, mempool) => {
    //get already used one
    const txIns = _(mempool)
        .map(tx => tx.txIns)
        .flatten()
        .values();
    
    const removables = [];
    
    //find input already inside of the mempool 
    for(const uTxOut of uTxOutList){
        const txIn = _.find(
            txIns, 
            txIn => 
                txIn.txOutIndex === uTxOut.txOutIndex && 
                txIn.txOutId === uTxOut.txOutId
        );
        if(!txIn === undefined){
            removables.push(txIn);
        }
    }
    //return list among uTxOutList not removables included.
    return _.without(uTxOutList, ...removables);
};

const createTx = (receiverAddress, amount, privateKey, uTxOutList) => {
    const myAddress = getPublicKey(privateKey);
    const myUTxOuts = uTxOutList.filter(uTxO => uTxO.address === myAddress);

    //get all unspend transaction outputs and turn there into inputs to create a transaction
    const { includedUTxOuts, leftOverAmount } = findAmountInUTxOuts(
        amount,
        myUTxOuts
    );

    const toUnsignedTxIn = uTxOut => {
        const txIn = new TxIn();
        txIn.txOutId = uTxOut.txOutId;
        txIn.txOutIndex = uTxOut.txOutIndex;
        return txIn;
    }

    const unsignedTxIns = includedUTxOuts.map(toUnsignedTxIn);

    const tx = new Transaction();

    tx.txIns = unsignedTxIns;
    tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);

    tx.id = getTxId(tx);

    //signing
    tx.txIns = tx.txIns.map((txIn, index) => {
        txIn.signature = signTxIn(tx, index, privateKey, uTxOutList);
        return txIn;
    });
    return tx;
}


module.exports = {
    initWallet,
    getBalance,
    getPublicFromWallet,
    createTx,
    getPrivateFromWallet
}