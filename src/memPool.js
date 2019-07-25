const _ = require("lodash"),
    Transactions = require("./transactions");

const { validateTx } = Transactions;

let memPool = [];

const getTxInsInPool = memPool => {
    return _(memPool)
        .map(tx => tx.txIns)
        .flatten()
        .value();
};

const isTxValidForPool = (tx, memPool) => {
    const txInsInPool = getTxInsInPool(memPool);

    const isTxInAllreadyInPool = (txIns, txIn) => {
        return _.find(txIns, txInInPool => {
            return (
                txIn.txOutIndex === txInInPool.txOutIndex &&
                txIn.txOutId === txInInPool.txOutId
            );
        });
    };

    for(const txIn of tx.txIns){
        if(isTxInAllreadyInPool(txInsInPool, txIn)){
            return false;
        }
    }
    return true;
}

const addToMemPool = (tx, uTxOutList) => {
    if(!validateTx(tx, uTxOutList)){
        throw Error("this transaction is invalid, will not add it to pool");
    }else if(!isTxValidForPool(tx, memPool)){
        throw Error("this tx is not valid for the pool, will not add it.");
    }
    memPool.push(tx);
}

module.exports = {
    addToMemPool
}