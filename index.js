const mqtt = require('mqtt')
const debug = require('debug')('TuyAPI-Proxy');
const configTuyapi = require("./conf/tuyapi.json");
const TuyaItem = require("./tuya-item.js");

console.log("Debug level : "+process.env.DEBUG);
Object.keys(configTuyapi).forEach(key=>{
   var device = new TuyaItem(configTuyapi[key]);
});