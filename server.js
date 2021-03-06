// const SHA256 = require('crypto-js/sha256')
// const { MerkleTree } = require('merkletreejs')
const testing = require('./routes/testing.route'); // Imports routes for testing
const fs = require('fs');
const ip = require('ip');
const os = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
let _txHashes;
const logger = require('./utils/logger');
const blocksManager = require('./utils/blocks-manager')


const SerialPort = require('serialport')
const parsers = SerialPort.parsers

const parser = new parsers.Readline({
  delimiter: '*',
})

const port = new SerialPort('/dev/ttyACM0', {
  baudRate: 9600,
}, function (err) {
  if (err) {
    logger.logMessage(err.message, "error")
  }
})

port.pipe(parser);
port.on('open', () => logger.logMessage('Port open'));
parser.on('data', async (data)=> {
  logger.logMessage(`arduino-response: ${data}`);  
  if(data == -1){
    if(_txHashes == undefined){
      const { txHashes } = await blocksManager.getLatestBlock();
      _txHashes = txHashes;
    }
    serialWrite(blocksManager.merkle(_txHashes));
    return;
  }
  // TODO:
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use('/testing', testing);
app.set('port', process.env.PORT || 8000);

app.get('/whoareyou', (req, res) => {
  var temp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
  var temp_c = temp / 1000;
  res.status(200).send(
    {
      whoami: 'raspberry pi!',
      myip: ip.address(),
      myname: os.homedir(),
      mytemp: temp_c,
    });
});

app.get('/write', (req, res) => {
  let msg = req.query.msg;
  const response = serialWrite(msg);
  res.status(200).send(
    {
      written: response,
      message: msg
    });
});

app.get('/test', async (req, res) => {
  let transactions = req.query.tx;
  const { ver, prev_block, mrkl_root, time, bits, nonce, txHashes } = await blocksManager.getLatestBlock();
  logger.logMessage(`serial-write: ${serialWrite(`${ver + prev_block + mrkl_root + time + bits + nonce}`)}`);
  _txHashes = txHashes;
  if (transactions) {
    res.status(200).send(
      {
        ver: ver,
        prev_block: prev_block,
        mrkl_root: mrkl_root,
        time: time,
        bits: bits,
        nonce: nonce,
        txHashes: txHashes
      }
    );
    return;
  }
  res.status(200).send(
    {
      ver: ver,
      prev_block: prev_block,
      mrkl_root: mrkl_root,
      time: time,
      bits: bits,
      nonce: nonce
    }
  );


});

app.get('/readArduino', async (req, res) => {
  port.on('readable', function () {
    let data = port.read();
    logger.logMessage(`arduinosays: ${String.fromCharCode.apply(null, data)}`)
    // TODO
    // port.close();
    res.send('Greetings from the Test controller!');

})
logger.logMessage('done');


});

const serialWrite = (msg) => {
  return port.write(msg, function (err) {
    if (err) {
      return logger.logMessage(err.message,error)
    }
  })
}

// const merkle = () => {
//   var startTime, endTime;
//   startTime = new Date();
//   logger.logMessage(`start merkle root`)
//   const leaves = txHashes.map(x => SHA256(x))
//   const tree = new MerkleTree(leaves, SHA256, { isBitcoinTree: true })
//   const root = tree.getRoot().toString('hex')
//   // MerkleTree.print(tree)

//   endTime = new Date();
//   var timeDiff = endTime - startTime; //in ms
//   // strip the ms
//   timeDiff /= 1000;

//   // get seconds 
//   var seconds = Math.round(timeDiff);
//   logger.logMessage(`end merke root`)
//   logger.logMessage(`elapsed time: ${seconds}s`)
//   logger.logMessage(`generated hash: ${root}`)

//   // serialWrite(root);

//   return root;
// }

// Start

var server = app.listen(app.get('port'), function () {
  console.log('Listening on port %d', server.address().port);
});

// blocksManager.getLatestBlock();
const interval = setInterval(function () {
  blocksManager.getLatestBlock();
}, 600000);
