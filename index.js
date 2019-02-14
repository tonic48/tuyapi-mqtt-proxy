const TuyAPI = require('tuyapi');
const mqtt = require('mqtt')

const configTuyapi = require("./conf/tuyapi.json");
const configMqtt = require("./conf/mqtt.json");
const dpsCodes = require("./conf/dps-code.json");
//define dps constants
const DPS_ACTIVE = '1';
const DPS_SET_TEMP = '2'
const DPS_TEMP_ENV = '3'
const DPS_TEMP_MANUAL = '4'
const DPS_ECO = '5'
const DPS_LOCK = '6'
const DPS_TEMP_FLOOR = '102'

const pubDps = {
  DPS_ACTIVE,
  DPS_SET_TEMP,
  DPS_TEMP_ENV,
  DPS_TEMP_MANUAL,
  DPS_ECO,
  DPS_LOCK,
  DPS_TEMP_FLOOR
};
const subDps = {
  DPS_ACTIVE,
  DPS_SET_TEMP,
  DPS_TEMP_MANUAL,
  DPS_ECO,
  DPS_LOCK
};

const device = new TuyAPI(configTuyapi);

device.on('connected', () => {
  console.log('Connected to device.');

});

device.on('disconnected', () => {
  console.log('Disconnected from device.');
});

device.on('data', data => {
  console.log('Data from device:', data);
  //const status = data.dps['1'];
  //console.log('Current status:', status);
  var payload = "";
  for (var key in data.dps) {
    publishMqtt(getTopicName("stat", key), getDevicePayload(key, data.dps[key])).then(result => {
      console.log('Status published to MQTT');
    }).catch(error => {
      console.log('Error : ' + error);
    });
  }

});

device.on('error', (err) => {
  console.log('Error: ' + err);
});

var mqttClientDaemon = mqtt.connect(configMqtt.url, configMqtt.options);
device.connect();

// Disconnect after 10 seconds
//setTimeout(() => { device.disconnect(); }, 10000);

mqttClientDaemon.on('connect', () => {
  console.log('Connected to MQTT.');
  mqttClientDaemon.subscribe(getSubTopics(), (err, granted) => {
    if (!err) {
      console.log("Subscribed to ");
      for (var key in granted) console.log(granted[key]);
    }

  })

})

mqttClientDaemon.on("reconnect", (err) => {
  console.log("Reconnect to MQTT");
});

mqttClientDaemon.on("error", (err) => {
  console.log("Error connection MQTT");
});

mqttClientDaemon.on('message', (topic, message) => {
  sendPayloadToDevice(topic, message).then(result => {
    //console.log('Command sent to the device');
  }).catch(error => {
    console.log('Error : ' + error);
  });
})

async function publishMqtt(topic, payload) {
  var mqttClient = mqtt.connect(configMqtt.url, configMqtt.options);
  mqttClient.on('connect', function () {
    mqttClient.publish(topic, payload)
    //console.log('Published:',payload);
    mqttClient.end();
  })

}

function getDevicePayload(key, data) {
  var payload = data.toString;
  switch (key) {

    case DPS_ACTIVE:
    case DPS_ECO:
    case DPS_LOCK:
      payload = (data ? "1" : "0");
      break;

    case DPS_SET_TEMP:
    case DPS_TEMP_ENV:
    case DPS_TEMP_FLOOR:
      console.log('Payload:', parseFloat(data) / 2);
      payload = parseFloat(data) / 2;
      break;
  }

  return payload.toString();
}

async function sendPayloadToDevice(topic, message) {
  var topic = topic.split("/");
  var dps = topic[topic.length - 1];
  var payload = message.toString();
  switch (dps) {
    case DPS_ACTIVE:
    case DPS_ECO:
    case DPS_LOCK:
      console.log(dpsCodes[dps] + ' : ' + message);
      payload = (parseInt(message) == 0) ? false : true;
      break;

    case DPS_SET_TEMP:
      console.log('Set temperature to : ' + message);
      payload = parseFloat(message) * 2;

      break;
  }
  await device.set({
    set: payload,
    dps: dps
  }).then(result => {
    //console.log(""+result);
  });
}

function getSubTopics() {
  var topics = new Object();
  for (var dps in subDps) {
    topics[getTopicName("cmd", subDps[dps])] = configMqtt.qos;
  }

  return topics;
}

function getTopicName(prefix, dps) {
  // prefix/<tuyaAPI-id>/<tuyaAPI-type (dps)>
  // cmd/4a5252525657bbb/2
  var topic = prefix + "/" + configTuyapi.id + "/" + dps
  return topic;
}