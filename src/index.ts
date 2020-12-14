#!/usr/bin/env node

const JsonRpcWs = require('json-rpc-ws');
const readline = require('readline');
const {Command} = require('commander');

const program = new Command("npx klipperterm <websocket URL>, i.e. ws://127.0.0.1/websocket");
program
  .description(
    "simple gcode REPL for klipper via moonraker"
  )
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

const client = JsonRpcWs.createClient();
client.connect(websocketURL, function connected() {
  client.expose("notify_gcode_response", function (data: []) {
    data.forEach((e) => console.log("<", e))
  })

  console.log("Connected to ",websocketURL);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', function (line: string) {
    client.send("printer.gcode.script", {"script": line}, jsonRPCResponseHandler);
  })

});
