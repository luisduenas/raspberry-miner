const logger = require('./logger');
const SerialPort = require('serialport');
const parsers = SerialPort.parsers;
let port, parser;
exports.start = () => {
// Use a `\r\n` as a line terminator
parser = new parsers.Readline({
    delimiter: '\r\n',
  })
  
  port = new SerialPort('/dev/ttyACM0', {
    baudRate: 9600,
  }, function (err) {
    if (err) {
      logger.logMessage(err.message, "error")
    }
  })
  
  port.pipe(parser);
  port.on('open', () => logger.logMessage('Port open'));
  parser.on('data', (data)=> {
    logger.logMessage(`arduino-response: ${data}`);  
  });
};

exports.write = (msg) => {
    const something = port.write(msg, function (err) {
        if (err) {
          return logger.logMessage(err.message,'error')
        }
      })

      console.log(something);

      return something;
}



