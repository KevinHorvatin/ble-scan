// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This Bluetooth Low Energy module demo scans
for nearby BLE peripherals. Much more fun if
you have some BLE peripherals around.
*********************************************/

var tessel = require('tessel');
var blelib = require('ble-ble113a');
var sdcardlib = require('sdcard');

var ble = blelib.use(tessel.port['A']);
var sdc = sdcardlib.use(tessel.port['C']);
var device;

var printHexAddress = function(address) {
  var hexAddress = address[0].toString(16);
  var device = {};
  for(var i=1;i<address.length;i++) {
    hexAddress += ":" + address[i].toString(16);
  }
  fs.readFile(hexAddress+'.json', function(err, data) {
    if (err) { 
      device = { first: new Date(), count: 0 };
    } else  {
      device = JSON.parse(data.toString());
    }
    device.count++;
    device.last = new Date();
    console.log("Address: "+hexAddress);
    console.log("Count  : "+device.count);
    console.log("First  : "+device.first);

    fs.writeFile(hexAddress+'.json', JSON.stringify(device), function(err) {
      if (err) { fsErr = true; }
    });
  });
}

// When a device is discovered
ble.on('discover', function(peripheral) {
  printHexAddress(peripheral.address._buf);
  //clearTimeout(noneFound);
  // Check for changes
});

var noneFound;
var scanning = false;
var sdCardReady = false;
var fs = null;

// Scan for devices regularly
function poll() {
  setTimeout(scan, 5000);
}

noneFound = setTimeout(function () {
    ble.stopScanning();
    // console.log('No BLE devices in range.');
    // Check for changes
    poll();
}, 5000);

sdc.on('ready', function() {
  sdCardReady = true;
  sdc.getFilesystems(function(err, fss) {
    fs = fss[0];
    console.log('FS online!');
  });
});

function blinkTheState() {
  // Blink GREEN if scanning
  if (scanning) {
    var value = tessel.led[0].read();
    tessel.led[0].write(!value);
  } else {
    tessel.led[0].write(0);
  }

  // AMBER indicates active FS
  tessel.led[3].write(fs!==null);

  // Blink RED if sdCard error
  if (fsErr) {
    var value = tessel.led[2].read();
    tessel.led[2].write(!value);
  }

  // Blink BLUE while waiting on sdCard
  if (!sdCardReady) {
    var value = tessel.led[1].read();
    tess.led[1].write(!value);
  }
}

// The lights show state
setInterval(blinkTheState, 200);

// Check and see if authed devices in range
function scan () {
  if (sdCardReady) {
    if (scanning) {
      console.log('Stop scanning.');
      ble.stopScanning();
      scanning = false;
    } else {
      console.log('Scanning...');
      ble.startScanning();
      scanning = true;
    }
  } else { 
    console.log("Waiting for sdcard...");
  }
  poll();
}
