const TuyAPI = require('tuyapi');
const mqtt = require('mqtt')

const configTuyapi = require("./conf/tuyapi.json");
const configMqtt = require("./conf/mqtt.json");
const topics = require("./conf/topics.json");
//define dps constants
const DPS_ACTIVE='1';
const DPS_SET_TEMP='2'
const DPS_TEMP_ENV='3'
const DPS_TEMP_MANUAL='4'
const DPS_ECO='5'
const DPS_LOCK='6'
const DPS_TEMP_FLOOR='102'

const device = new TuyAPI(configTuyapi);

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
    publishMqtt(""+topics.stat[key],getDevicePayload(key,data.dps[key]));
   }

});

device.on('error',(err) => {
  console.log('Error: ' + err);
});

var mqttClientDaemon=mqtt.connect(configMqtt.url,configMqtt.options);
device.connect();

// Disconnect after 10 seconds
//setTimeout(() => { device.disconnect(); }, 10000);

mqttClientDaemon.on('connect', () => {
  console.log('Connected to MQTT.');
  //subsribe to all topics defined in topics.json
  for(var key in topics.cmd) {
    var cmdTopic=""+topics.cmd[key]
    console.log("Subscribed to "+cmdTopic);
    mqttClientDaemon.subscribe(cmdTopic,()=>{
        //console.log("Subscribed to "+key);
    })
  }

})

mqttClientDaemon.on('message', (topic, message) => {
  sendPayloadToDevice(topic, message);
})

async function publishMqtt(topic,payload){
    var mqttClient=mqtt.connect(configMqtt.url,configMqtt.options);
    mqttClient.on('connect', function () {
        mqttClient.publish(topic, payload)
        //console.log('Published:',payload);
        mqttClient.end();
    })

}

function getDevicePayload(key, data){
  payload=""+data;
  switch (key){

    case DPS_ACTIVE:
    case DPS_ECO:
    case DPS_LOCK:
     payload = (data ? "1" : "0");
     break;

    case DPS_SET_TEMP:
    case DPS_TEMP_ENV:
    case DPS_TEMP_FLOOR:
    console.log('Payload:', parseFloat(data)/2);
    payload=""+parseFloat(data)/2;
       break;
   }

   return payload;
}

async function sendPayloadToDevice(topic, message){
  if(topic === topics.cmd[DPS_SET_TEMP]) {
    //Set temperature topic
    var setTemp = parseFloat(message)*2
    console.log('Set temperature to : '+setTemp);
    if(setTemp>=10 && setTemp<=70){
      device.set({set:setTemp,dps:DPS_SET_TEMP}).then(result => {
      });
    }
  }
  if(topic === topics.cmd[DPS_ECO]) {
    //Eco mode topic
    console.log('Eco mode : '+message);
    var mode= true;
    if(parseInt(message)==0){
      mode=false;
    }
    device.set({set:mode,dps:DPS_ECO}).then(result => {
    });
    //device.get({dps: "2"});
  }
  if(topic === topics.cmd[DPS_TEMP_MANUAL]) {
    //Auto/Manual mode topic
    mode=""+message;
    console.log('Manual mode : '+message);
      device.set({set:mode,dps:DPS_TEMP_MANUAL}).then(result => {
    });
  }
  if(topic === topics.cmd[DPS_ACTIVE]) {
    //Device active topic
    console.log('Active : '+message);
    var mode= true;
    if(parseInt(message)==0){
      mode=false;
    }
    device.set({set:mode,dps:DPS_ACTIVE}).then(result => {
    });

  }
  if(topic === topics.cmd[DPS_LOCK]) {
    //Device active topic
    console.log('Active : '+message);
    var mode= true;
    if(parseInt(message)==0){
      mode=false;
    }
    device.set({set:mode,dps:DPS_LOCK}).then(result => {
    });

  }
}
