const _ = require("lodash"),
    Transactions = require("./transactions");

const { validateTx } = Transactions;

let mempool = [];

const getTxInsInPool = mempool => {
    return _(mempool)
        .map(tx => tx.txIns)
        .flatten()
        .value();
};

const isTxValidForPool = (tx, mempool) => {
    const txInsInPool = getTxInsInPool(mempool);

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

const addToMempool = (tx, uTxOutList) => {
    if(!validateTx(tx, uTxOutList)){
        throw Error("this transaction is invalid, will not add it to pool");
    }else if(!isTxValidForPool(tx, mempool)){
        throw Error("this tx is not valid for the pool, will not add it.");
    }
    mempool.push(tx);
}

module.exports = {
    addToMempool
}