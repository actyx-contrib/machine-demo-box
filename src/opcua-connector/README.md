# OPC UA Connector




Error events are emitted based on the `generateError` property from the conversion rule configuration.

## Settings Example

```JSON
{
  "machineName": "Machine 1",
  "opcua": {
    "opcuaUrl": "opc.tcp://localhost:4434/UA/actyx/",
    "userName": "actyx",
    "password": "actyx"
  },
  "odaTags": [ "Machine:{id}", "Machine.state:{id}" ],
  "valuesTags": [ "Machine:{id}", "Machine.values:{id}" ],
  "errorTag": [ "Machine:{id}", "error:{uuid}", "error.Occurred" ],
  "variables": {
    "state": {
      "nodeId": "ns=1;s=\"state\"",
      "poolRate": 100
    },
    "speed": {
      "nodeId": "ns=1;s=\"speed\"",
      "poolRate": 2000
    },
    "temp": {
      "nodeId": "ns=1;s=\"temp\"",
      "poolRate": 5000
    },
    "error": {
      "nodeId": "ns=1;s=\"error\"",
      "poolRate": 100
    },
    "errorDesc": {
      "nodeId": "ns=1;s=\"errorDescription\"",
      "poolRate": 100
    }
  },
  "values": {
    "speed": {
      "name": "speed",
      "decimal": 2,
      "distinct": true
    },
    "temp": {
      "name": "temperature",
      "template": "{value}C°",
      "decimal": 1,
      "distinct": true
    }
  },
  "rules": {
    "On": {
      "odaState": 1,
      "rule": "state == 1"
    },
    "Off": {
      "odaState": 0,
      "rule": "state == 0"
    },
    "Error A": {
      "odaState": 10,
      "rule": "state == 2 && error == 0",
      "odaDescription": "Power off",
      "generateError": true
    },
    "Error B": {
      "odaState": 10,
      "rule": "state == 2 && (error == 1 || error == 2) && error != 10",
      "odaDescription": "error code: {error}",
      "generateError": true
    },
    "Error C": {
      "odaState": 10,
      "rule": "state == 2 && error > 2 && error != 10",
      "odaDescription": "critical error: {error} at {state} - {}",
      "generateError": true
    },
    "Emergency": {
      "odaState": 99,
      "rule": "state == 2 && errorDesc == \"Emergency\"",
      "odaDescription": "Emergency",
      "generateError": true
    }
  }
}
```
