#!/usr/bin/env node

const JsonRpcWs = require('json-rpc-ws');
const {Command} = require('commander');
const get = require('get-value');
const blessed = require('blessed');

const program =
  new Command("npx klipperterm <websocket URL>, i.e. ws://127.0.0.1/websocket")
    .description("Proof Of Concept Interactive G-Code Terminal for Klipper via Moonraker")
    .parse(process.argv);
if (program.args.length < 1) program.help();

const websocketURL = program.args[0]
const jsonRPCClient = JsonRpcWs.createClient();

const bscreen = blessed.screen({
  smartCSR: true,
  terminal: 'xterm-256color',
  fullUnicode: true
});

const body = blessed.box({
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
const inputBar = blessed.textbox({
  bottom: 0,
  left: 0,
  height: 1,
  width: '100%',
  keys: true,
  mouse: true,
  inputOnFocus: true,
  style: {
    fg: '#00ff00',
    bg: '#002000'	// Blue background so you see this is different from body
  }
});
// Add body to blessed screen
bscreen.append(body);
bscreen.append(inputBar);
inputBar.focus();

// Close the example on Escape, Q, or Ctrl+C
bscreen.key(['escape', 'q', 'C-c'], (ch, key) => (process.exit(0)));

const log = (text?: any, ...optionalParams: any[]) => {
  body.pushLine(text + ' ' + optionalParams);
  body.setScrollPerc(100);
  bscreen.render();
}

const err = (text?: any, ...optionalParams: any[]) => {
  body.pushLine('{red-fg}' + text + ' ' + optionalParams + '{/}');
  body.setScrollPerc(100);
  bscreen.render();
}

const jsonRPCResponseHandler = (error: any, reply: String) => {
  printLine(error, "" + reply, "<");
}

function formatLine(e: String, prompt: String) {
  return `{#505050-fg}${new Date().toUTCString()}{/} ${prompt} ${e}`;
}

function printLine(isError: boolean, e: String, prompt: String) {
  if (isError) {
    err(formatLine(e,prompt));
  } else {
    log(formatLine(e,prompt));
  }
}

jsonRPCClient.connect(websocketURL, function connected() {
  if (jsonRPCClient.isConnected()) {
    printLine(false, `Connected to ${websocketURL}`,"<");
    printLine(false, `/quit and /exits terminates the application`,"<");
    jsonRPCClient.send("printer.gcode.script", {"script": "STATUS"}, jsonRPCResponseHandler);

    jsonRPCClient.expose("notify_gcode_response", function (data: []) {
      data.forEach((e) => {
        printLine(String(data).startsWith('!!'), e, "<");
      })
    })

    inputBar.on('submit', (text) => {
      if (text === "/quit" || text === "/exit") process.exit(1);
      jsonRPCClient.send("printer.gcode.script", {"script": text}, jsonRPCResponseHandler);
      printLine(false,text, "{green-fg}>");
      inputBar.clearValue();
      inputBar.focus();
    });
  } else {
    bscreen.destroy();
    console.error("Not connected, check connection URL and/or CORS configuration for Moonraker");
    process.exit(1);
  }
});
