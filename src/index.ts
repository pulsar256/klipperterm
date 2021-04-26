#!/usr/bin/env node

const JsonRpcWs = require('json-rpc-ws');
const {Command} = require('commander');
const get = require('get-value');

const jsonRPCClient = JsonRpcWs.createClient();

const blessed = require('blessed');

var bscreen = blessed.screen();
var body = blessed.box({
  top: 0,
  left: 0,
  height: '100%-1',
  width: '100%',
  keys: true,
  mouse: true,
  alwaysScroll: true,
  scrollable: true,
  tags: true,
  scrollbar: {
    ch: ' ',
    bg: 'black'
  }
});
var inputBar = blessed.textbox({
  bottom: 0,
  left: 0,
  height: 1,
  width: '100%',
  keys: true,
  mouse: true,
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: 'blue'	// Blue background so you see this is different from body
  }
});
// Add body to blessed screen
bscreen.append(body);
bscreen.append(inputBar);

// Close the example on Escape, Q, or Ctrl+C
bscreen.key(['escape', 'q', 'C-c'], (ch, key) => (process.exit(0)));


const log = (text?: any, ...optionalParams: any[]) => {
  body.pushLine(text+' '+optionalParams);
  body.setScrollPerc(100);
  bscreen.render();
}
const err = (text?: any, ...optionalParams: any[]) => {
  body.pushLine('{red-fg}'+text+' '+optionalParams+'{/}');
  body.setScrollPerc(100);
  bscreen.render();
}
inputBar.focus();


const program =
  new Command("npx klipperterm <websocket URL>, i.e. ws://127.0.0.1/websocket")
    .description("Proof Of Concept Interactive G-Code Terminal for Klipper via Moonraker")
    .parse(process.argv);
if (program.args.length < 1) program.help();
const websocketURL = program.args[0]

const jsonRPCResponseHandler = (error: any, reply: any) => {
  if (error) {
    err(get(error, 'message'));
  } else {
    log('<', reply);
  }
}
var data
jsonRPCClient.connect(websocketURL, function connected() {
  if (jsonRPCClient.isConnected()) {
    log("Connected to ", websocketURL);
    jsonRPCClient.send("printer.gcode.script", {"script": "STATUS"}, jsonRPCResponseHandler);

    jsonRPCClient.expose("notify_gcode_response", function (data: []) {
        data.forEach((e) => {
          let date_ob = new Date();
          let hours = date_ob.getHours();
          let minutes = date_ob.getMinutes();
          let seconds = date_ob.getSeconds();
          if  (String(data).startsWith('!!')){
        err(hours + ":" + minutes + ":" + seconds +"<", e)
          }
        else{
          log(hours + ":" + minutes + ":" + seconds + "<", e)
        }
        })
    })


    inputBar.on('submit', (text) => {
      jsonRPCClient.send("printer.gcode.script", {"script": text}, jsonRPCResponseHandler);
      log('>', text);
      inputBar.clearValue();
      inputBar.focus();
    });
  }
  else {
    bscreen.destroy();
    console.error("Not connected, check connection URL and/or CORS configuration for Moonraker");
    process.exit(1);
  }
});
