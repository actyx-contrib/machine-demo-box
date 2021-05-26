# OPC UA Connector

The opcua-connector is a very configurable connector to produce tree kind of events.

 - valueChanged  - Sensor/Value readings, mostly used for IoT cases. (dashboard, machine learning, ...)
 - statusChanged - The state of the machine has changed. (On, Off, Starting, Productive, Error, Emergency, ...)
 - errorOccurred - Error occurred that needs to be handled by something or someone.


## 🚀 How it works

The system is build in tree logical modules.

### 1. OPC UA connection

The OPC UA and variables settings are used to connect to the OPC UA server and read the values as a continues stream.

### 2. valueEmitters

Consuming the OPC UA streams from module 1. The values get modified and probable emitted to actyx.

You can configure this module with `valueEmitters` and `valuesTags`.

Each valueEmitters could be configured as:

 - `name` Name of the sensor. This name is used to emit the event
 - `template` [optional] Render the incoming value with a fixed pattern. the value will always replace "{value}" in the text. Example: "{value}C°"
 - `decimal` [optional] Number of decimals the value should be fixed to.
 - `distinct` [optional] Flag if the value should only be emitted if the value changed. (could be false in the case, the value needs to be documented every 24h)

### 3. machineStateEmitter

Consuming the OPC UA streams from module 1. The values get logically check by a rule in the configuration and probable emit an stateChanged event or an errorOccurred event to actyx.

You can configure this module with `machineStateEmitters`, `stateTags`, and `errorTag`

Each machineStateEmitters could be configured as:

 - `state` system wide number to reference this state
 - `rule` logical rule to verify if the machine is in this state
 - `description` [optional] template description for the state and error event
 - `generateError` [optional] flag if an errorOccurred event should be emitted



## 🗃️ Settings Example

This settings do not match the `opcua-mock-plc` but should show who the system could be configured

```JSON
{
  "machineName": "Machine 1",
  "opcua": {
    "opcuaUrl": "opc.tcp://localhost:4434/UA/actyx/",
    "userName": "actyx",
    "password": "actyx"
  },
  "variables": {
    "state": {
      "nodeId": "ns=1;s=\"state\"",
      "pollRate": 100
    },
    "speed": {
      "nodeId": "ns=1;s=\"speed\"",
      "pollRate": 2000
    },
    "temp": {
      "nodeId": "ns=1;s=\"temp\"",
      "pollRate": 5000
    },
    "error": {
      "nodeId": "ns=1;s=\"error\"",
      "pollRate": 100
    },
    "errorDesc": {
      "nodeId": "ns=1;s=\"errorDescription\"",
      "pollRate": 100
    }
  },
  "valuesTags": ["Machine:{id}", "Machine.values:{id}"],
  "valueEmitters": {
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
  "stateTags": ["Machine:{id}", "Machine.state:{id}"],
  "errorTag": ["Machine:{id}", "error:{uuid}", "error.Occurred"],
  "machineStateEmitters": {
    "Off": {
      "state": 0,
      "rule": "state == 0"
    },
    "On": {
      "state": 1,
      "rule": "state == 1"
    },
    "Power off": {
      "state": 10,
      "rule": "state == 2 && error == 0",
      "description": "Power off",
      "generateError": true
    },
    "Error": {
      "state": 10,
      "rule": "state == 2 && (error == 1 || error == 2)",
      "description": "error code: {error}",
      "generateError": true
    },
    "Critical Error": {
      "state": 10,
      "rule": "state == 2 && error > 2 && error != 10",
      "description": "critical error: {error} at {state} - {errorDesc}",
      "generateError": true
    },
    "Emergency": {
      "state": 99,
      "rule": "state == 2 && errorDesc == \"Emergency\"",
      "description": "Emergency",
      "generateError": true
    }
  }
}
```
