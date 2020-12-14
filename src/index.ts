#!/usr/bin/env node

const JsonRpcWs = require('json-rpc-ws');
const readline = require('readline');
const {Command} = require('commander');

const jsonRPCClient = JsonRpcWs.createClient();
const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const program =
  new Command("npx klipperterm <websocket URL>, i.e. ws://127.0.0.1/websocket")
    .description("Proof Of Concept Interactive G-Code Terminal for Klipper via Moonraker")
    .parse(process.argv);
if (program.args.length < 1) program.help();
const websocketURL = program.args[0]

const jsonRPCResponseHandler = (error: any, reply: any) => {
  if (error) {
    console.error("Error", error);
  } else {
    console.log('<', reply);
  }
}

jsonRPCClient.connect(websocketURL, function connected() {
  console.log("Connected to ", websocketURL);
  jsonRPCClient.send("printer.gcode.script", {"script": "STATUS"}, jsonRPCResponseHandler);

  jsonRPCClient.expose("notify_gcode_response", function (data: []) {
    data.forEach((e) => console.log("<", e))
  })

  readlineInterface.on('line', function (line: string) {
    jsonRPCClient.send("printer.gcode.script", {"script": line}, jsonRPCResponseHandler);
  })
})
