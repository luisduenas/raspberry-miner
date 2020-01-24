const logger = require('./logger');
const axios = require('axios');
const SHA256 = require('crypto-js/sha256')
const { MerkleTree } = require('merkletreejs')

exports.getLatestBlock = async () => {
    try {
      const latestblock = await axios.get('https://blockchain.info/latestblock')
  
      logger.logMessage(`latest block hash: ${latestblock.data.hash}`);
  
  
      const blockDataHex = await axios.get(`https://blockchain.info/rawblock/${latestblock.data.hash}?format=hex`);
      const blockDataJSON = await axios.get(`https://blockchain.info/rawblock/${latestblock.data.hash}`);
      const result = blockDataHex.data.substr(0, 159);
      const resultJSON = blockDataJSON.data;
  
  
      const ver = result.substr(0, 7);// length = 8
      const prev_block = result.substr(8, 71);// length = 64
      const mrkl_root = result.substr(72, 135);// length = 64
      const time = result.substr(136, 143);// length = 8
      const bits = result.substr(144, 151);// length = 8
      const nonce = result.substr(152, 159);// length = 8
  
      const txHashes = resultJSON.tx;
  
      logger.logMessage(`latest block n_tx: ${blockDataJSON.data.n_tx}`);
  
      // merkle();
  
      return { ver, prev_block, mrkl_root, time, bits, nonce, txHashes };
  
    } catch (error) {
      console.error(error)
    }
  }

exports.merkle = (txHashes) => {
    var startTime, endTime;
    startTime = new Date();
    logger.logMessage(`start merkle root`)
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
    logger.logMessage(`end merke root`)
    logger.logMessage(`elapsed time: ${seconds}s`)
    logger.logMessage(`generated hash: ${root}`)
  
    // serialWrite(root);
  
    return root;
  }