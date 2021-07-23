# OPCUA Mock PLC

```
default address: opc.tcp://localhost:4434/UA/actyx/
security:
  user: actyx
  password: actyx
Component State:  /mockPLC/State  |  ns=1;s=state  |  Int16
Component Speed:  /mockPLC/Speed  |  ns=1;s=speed  |  Float
Component Temp:   /mockPLC/Temp   |  ns=1;s=temp   |  Float
```

Start the opcua-mock-plc with `npm run node:opcua-mock-plc:start`.

Use the environment variable `OPCUA_MOCK_PORT` to define another port to start multiple mock-plcs

E.g.:
```
Linux/Mac: set OPCUA_MOCK_PORT=4335; npm run node:opcua-mock-plc:start
Windows: set OPCUA_MOCK_PORT=4335 && npm run node:opcua-mock-plc:start
```
