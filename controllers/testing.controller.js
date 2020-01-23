const SerialPort = require('serialport');
const logger = require('../utils/logger');

exports.test = function (req, res) {
    const port = new SerialPort('/dev/ttyACM0', function (err) {
        if (err) {
          logger.logMessage(err.message,"error")
        }
      })
      
    port.on('readable', function () {
        let data = port.read();
        logger.logMessage(`arduinosays: ${String.fromCharCode.apply(null, data)}`)
        // TODO
        // port.close();
        res.send('Greetings from the Test controller!');

    })
    logger.logMessage('done');
};
