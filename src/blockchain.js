const CryptoJS = require("crypto-js");

class Block {
    constructor(index, hash, previousHash, timestamp, data){
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
    }
}

const genesisBlock = new Block(
    0,
    "D8B3E0518E85243006CC1DE10FF5BE47F8F464900364F249E6281BD4B3252646",
    null,
    1562742463579,
    "this is the genesis block"
);

let blockchain = [genesisBlock];

const getLastBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => new Date().getTime() / 1000;

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data) => 
    CryptoJS.SHA256(
        index + previousHash + timestamp + JSON.stringify(data)
    ).toString();


const createNewBlock = data => {
    const previousBlock = getLastBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimestamp();
    const newHash = createHash(
        newBlockIndex, 
        previousBlock.hash, 
        newTimestamp,
        data
    );
    const newBlock = new Block(
        newBlockIndex,
        newHash,
        previousBlock.hash,
        newTimestamp,
        data
    );
    addBlockToChain(newBlock);
    return newBlock;
};

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);

const isBlockValid = (candidateBlock, latestBlock) => {

    if(!isBlockStructureValid(candidateBlock)){
        console.log("the candidate block structure is not valid");
        return false;
    }
    else if(latestBlock.index + 1 !== candidateBlock.index){
        console.log("the candidate block doesn't have a valid index");
        return false;
    }else if(latestBlock.hash !== candidateBlock.previousHash){
        console.log("the previousHash of the candidate block is not the hash of the latest block");
        return false;
    }else if(getBlocksHash(candidateBlock) !== candidateBlock.hash){
        console.log("the hash of this block is invalid");
        return false;
    }
    return true;
};

const isBlockStructureValid = (block) => {
    return (
        typeof block.index === 'number' && 
        typeof block.hash === 'string' && 
        typeof block.previousHash === 'string' && 
        typeof block.timestamp === 'number' &&
        typeof block.data === 'string'
    )
}

const isChainValid = (candidateChain) => {
    const isGenesisValid = block => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if(!isGenesisValid(candidateChain[0])){
        console.log("the candidateChain's genesisBlock is not the same as our genesisBlock");
        return false;
    }
    for(let i = 1; i < candidateChain.length; i++){
        if(!isNewBlockValid(candidateChain[i], candidateChain[i - 1])){
            return false;
        }
    }
    return true;
};

const replaceChain = candidateChain => {
    if(
        isChainValid(candidateChain) && 
        candidateChain.length > getBlockchain().length
    ){
        blockchain = candidateChain;
        return true;
    }else{
        return false;
    }
};

const addBlockToChain = candidateBlock => {
    if(isNewBlockValid(candidateBlock, getLastBlock())){
        getBlockchain().push(candidateBlock);
        return true;
    }else {
        return false;
    }
};

module.exports = {
    getBlockchain,
    createNewBlock,
    getLastBlock,
    isBlockStructureValid
}