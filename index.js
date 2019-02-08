const TuyAPI = require('tuyapi');
const mqtt = require('mqtt')

var configTuyapi = require("./conf/tuyapi.json");
var configMqtt = require("./conf/mqtt.json");

const device = new TuyAPI(configTuyapi);

device.on('connected',() => {
  console.log('Connected to device.');

});

device.on('disconnected',() => {
  console.log('Disconnected from device.');
});

device.on('data', data => {
  console.log('Data from device:', data);
  const status = data.dps['1'];
  device.set({set: "50", dps: "2"});

  console.log('Current status:', status);

});

device.on('error',(err) => {
  console.log('Error: ' + err);
});

device.connect();

// Disconnect after 10 seconds
setTimeout(() => { device.disconnect(); }, 1000000);

var mqttClient = mqtt.connect(configMqtt.url,configMqtt.options);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT.');
  mqttClient.subscribe('cmd/thermostat/temp')

})

mqttClient.on('message', (topic, message) => {
  if(topic === 'cmd/thermostat/temp') {
    var setTemp = parseInt(message)
    console.log('Set temperature to : '+setTemp);
    if(setTemp>=10 && setTemp<=70){
      device.set({set:parseInt(message),dps:"2"}).then(result => {
    });
    }
  }
})
