# klipperterm

Proof Of Concept Interactive G-Code Terminal for [Klipper](https://github.com/KevinOConnor/klipper) + [Moonraker](https://github.com/Arksine/moonraker).

## Build

```shell
npm install
npm run-script build
npm -g install
```

## Usage

```shell
npx klipperterm ws://x1/websocket

# Connected to  ws://x1/websocket
# < ok B:24.4 /0.0 T0:24.2 /0.0
# g28
# < ok
# < ok B:24.4 /0.0 T0:24.3 /0.0
```
