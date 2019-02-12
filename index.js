const TuyAPI = require('tuyapi');
const mqtt = require('mqtt')

const configTuyapi = require("./conf/tuyapi.json");
const configMqtt = require("./conf/mqtt.json");
const topics = require("./conf/topics.json");

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
   payload=""+data.dps[key];
   switch (key){
     case '1':
     payload='OFF'
      if(data.dps[key]){
         payload='ON'
      }
      break;
     case '2':
     case '3':
     case '102':
     console.log('Payload:', parseFloat(data.dps[key])/2);
     payload=""+parseFloat(data.dps[key])/2;
        break;

     case '5':
     payload='OFF'
      if(data.dps[key]){
         payload='ON'
      }
      break;
    }

    //mqttClient.publish(""+topics[key],payload);
    publishMqtt(""+topics.stat[key],payload);

   }

});

device.on('error',(err) => {
  console.log('Error: ' + err);
});

var mqttClientDaemon=mqtt.connect(configMqtt.url,configMqtt.options);

device.connect();

// Disconnect after 10 seconds
//setTimeout(() => { device.disconnect(); }, 100000);


mqttClientDaemon.on('connect', () => {
  console.log('Connected to MQTT.');
  for(var key in topics.cmd) {

    var cmdTopic=""+topics.cmd[key]
    console.log("Subscribed to "+cmdTopic);
    mqttClientDaemon.subscribe(cmdTopic,()=>{
          //console.log("Subscribed to "+key);
    })
  }


})

mqttClientDaemon.on('message', (topic, message) => {
  if(topic === 'cmd/floor_thermostat/temp_set') {
    var setTemp = parseFloat(message)*2
    console.log('Set temperature to : '+setTemp);
    if(setTemp>=10 && setTemp<=70){
      device.set({set:setTemp,dps:"2"}).then(result => {
      });
    }
  }
  if(topic === 'cmd/floor_thermostat/eco') {
    console.log('Eco mode : '+message);
    var mode= true;
    if(parseInt(message)==0){
      mode=false;
    }
    device.set({set:mode,dps:"5"}).then(result => {
    });
    //device.get({dps: "2"});
  }
  if(topic === 'cmd/floor_thermostat/temp_manual') {
    console.log('Manual mode : '+message);
      device.set({set:mode,dps:"4"}).then(result => {
    });
  }
  if(topic === 'cmd/floor_thermostat/active') {
    console.log('Active : '+message);
    var mode= true;
    if(parseInt(message)==0){
      mode=false;
    }
    device.set({set:mode,dps:"1"}).then(result => {
    });
    //device.get({dps: "2"});
    //getSetTemp();
  }
})

async function publishMqtt(topic,payload){
    var mqttClient=mqtt.connect(configMqtt.url,configMqtt.options);
    mqttClient.on('connect', function () {
        mqttClient.publish(topic, payload)
        //console.log('Published:',payload);
        mqttClient.end();
    })

}

async function getSetTemp(){
  device.get().then(status => {
      console.log('New status:', status);
      return;
  });
}
