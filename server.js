const http = require('http');
const axios = require('axios');
const SHA256 = require('crypto-js/sha256')
const { MerkleTree } = require('merkletreejs')
const SerialPort = require('serialport')
const fs = require('fs');
var ip = require('ip');
const os = require('os');

var express = require('express');
var bodyParser = require('body-parser');
var gpio = require('pi-gpio');

// Variables declaration
var app = express();
app.use(bodyParser.json());
app.set('port', process.env.PORT || 3001);

app.get('/whoareyou',(req,res) => {
  var temp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
  var temp_c = temp/1000;
  res.status(200).send(
    {
      whoami: 'raspberry pi!',
      myip: ip.address(),
      myname: os.homedir(),
      mytemp: temp_c,
    });
});

let txHashes =[]

// Methods
const getLatestBlock = async () => {
  try {
    const latestblock = await axios.get('https://blockchain.info/latestblock')

    logMessage(`latest block hash: ${latestblock.data.hash}`);


    const blockDataHex = await axios.get(`https://blockchain.info/rawblock/${latestblock.data.hash}?format=hex`);
    const blockDataJSON = await axios.get(`https://blockchain.info/rawblock/${latestblock.data.hash}`);
    const result = blockDataHex.data.substr(0,159);
    const resultJSON = blockDataJSON.data;


    // let ver = result.substr(0,7);// length = 8
    // let prev_block = result.substr(8,71);// length = 64
    // let mrkl_root = result.substr(72,135);// length = 64
    // let time = result.substr(136,143);// length = 8
    // let bits = result.substr(144,151);// length = 8
    // let nonce = result.substr(152,159);// length = 8

    txHashes = resultJSON.tx

    logMessage(`latest block n_tx: ${blockDataJSON.data.n_tx}`);

    merkle();

  } catch (error) {
    console.error(error)
  }
}

const serialWrite = (msg) => {
  // port.write(msg, handleError)
}

const serialListen = () => {
  gpio.on('change', ({channel, value}) => {
    console.log('Channel ' + channel + ' value is now ' + value);
    if(value == false){
      serialWrite(merkle());
    }
  });
}

const merkle = () => {
  var startTime, endTime;
  startTime = new Date();
  logMessage(`start merkle root`)
  const leaves = txHashes.map(x => SHA256(x))
  const tree = new MerkleTree(leaves, SHA256, {isBitcoinTree: true})
  const root = tree.getRoot().toString('hex')
  // MerkleTree.print(tree)

  endTime = new Date();
  var timeDiff = endTime - startTime; //in ms
  // strip the ms
  timeDiff /= 1000;

  // get seconds 
  var seconds = Math.round(timeDiff);
  logMessage(`end merke root`)
  logMessage(`elapsed time: ${seconds}s`)
  logMessage(`generated hash: ${root}`)

  return root;
}

const handleError = (err) => {
  if (err) {
    return logMessage('Error: ', err.message)
  }
}

// Start

var server = app.listen(app.get('port'), function() {
  console.log('Listening on port %d', server.address().port);
});

getLatestBlock();
const interval = setInterval(function() {
  getLatestBlock();
}, 600000);



logMessage = (msg,type="info") => {
  let date = new Date();
  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  fs.appendFile(`logs/log-${day}-${monthIndex+1}-${year}.log`, `${date.toUTCString()} [${type.toUpperCase()}] ${msg} \n`, function (err) {
    if (err) throw err;
  })
  console.log(`${date.toUTCString()} [${type.toUpperCase()}] ${msg}`)
}