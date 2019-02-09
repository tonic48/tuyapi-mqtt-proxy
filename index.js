const TuyAPI = require('tuyapi');
const mqtt = require('mqtt')

const configTuyapi = require("./conf/tuyapi.json");
const configMqtt = require("./conf/mqtt.json");
const topics = require("./conf/topics.json");

const device = new TuyAPI(configTuyapi);
const mqttClient=mqtt.connect(configMqtt.url,configMqtt.options);;

device.on('connected',() => {
  console.log('Connected to device.');

});

device.on('disconnected',() => {
  console.log('Disconnected from device.');
});

device.on('data', data => {
  console.log('Data from device:', data);
  //const status = data.dps['1'];
  //console.log('Current status:', status);
  var payload="";
  for(var key in data.dps) {
   payload=""+data.dps[key];
   switch (key){
     case '2':
     case '3':
     case '102':
     console.log('Payload:', parseFloat(data.dps[key])/2);
     payload=""+parseFloat(data.dps[key])/2;
        break;
      }

       mqttClient.publish(""+topics[key],payload);
   }


});

device.on('error',(err) => {
  console.log('Error: ' + err);
});

device.connect();

// Disconnect after 10 seconds
setTimeout(() => { device.disconnect(); }, 100000);


mqttClient.on('connect', () => {
  console.log('Connected to MQTT.');
  mqttClient.subscribe('cmd/floor_thermostat/temp_set')

})

mqttClient.on('message', (topic, message) => {
  if(topic === 'cmd/floor_thermostat/temp_set') {
    var setTemp = parseFloat(message)*2
    console.log('Set temperature to : '+setTemp);
    if(setTemp>=10 && setTemp<=70){
      device.set({set:setTemp,dps:"2"}).then(result => {
    });
    }
  }
})
