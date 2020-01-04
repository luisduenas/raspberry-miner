const  Logger  = require('./logger')
const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')

class Merkle {
    constructor(txHashes) {
        this.txHashes = txHashes
        this.logger = new Logger()
    }

    get newHash() {
        var startTime, endTime;
        startTime = new Date();
        logger.message(`start merkle root`)
        const leaves = txHashes.map(x => SHA256(x))
        const tree = new MerkleTree(leaves, SHA256, { isBitcoinTree: true })
        const root = tree.getRoot().toString('hex')
        // MerkleTree.print(tree)

        endTime = new Date();
        var timeDiff = endTime - startTime; //in ms
        // strip the ms
        timeDiff /= 1000;

        // get seconds 
        var seconds = Math.round(timeDiff);
        logger.message(`end merke root`)
        logger.message(`elapsed time: ${seconds}s`)
        logger.message(`generated hash: ${root}`)

        return root;
    }
}
