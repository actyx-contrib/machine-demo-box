# OPC UA Connector

The opcua-connector is a very configurable connector to produce three kind of events.

- valueChanged - Sensor/Value readings, mostly used for IoT cases. (dashboard, machine learning, ...)
- statusChanged - The state of the machine has changed. (On, Off, Starting, Productive, Error, Emergency, ...)
- errorOccurred - Error occurred that needs to be handled by something or someone.

## 🚀 How it works

The system consists of three separate modules.

### 1. OPC UA connection

The OPC UA and variables settings are used to connect to the OPC UA server and read the values as a continuous stream.

### 2. valueEmitters

`valueEmitters` consume the OPC UA streams from the first module. These values are formatted/modified and are emitted as Actyx events,

You can configure this module with `valueEmitters` and `valuesTags`.

Each `valueEmitter` can be configured using the following properties:

- `name` Name of the sensor. This name is used in the `valueChanged` event as `name`.
- `template` [optional] Render the incoming value with a fixed pattern. The value will always replace "{value}" in the template. Example: "{value}C°"
- `decimal` [optional] Number of decimals the value should be fixed to.
- `distinct` [optional] Flag if the value should only be emitted if the value changed.

### 3. machineStateEmitter

`machineStateEmitter` consumes OPC UA streams from the OPC UA connection. The configured `rule`s are applied to the read values to determine whether to emit an event. If an event is to be emitted, `generateError` determines whether to emit a `stateChanged` or `errorOccurred` event.

You can configure this module with `machineStateEmitters`, `stateTags`, and `errorTag`

Each machineStateEmitters could be configured as:

- `state` system wide number to reference this state
- `rule` logical rule to verify if the machine is in this state
- `description` [optional] template description for the state and error event
- `generateError` [optional] flag if an errorOccurred event should be emitted

## 🗃️ Settings Example

This settings do not match the `opcua-mock-plc` but should show who the system could be configured
You can find the schema for each value in [./settings-schema.json].

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

The connector will use the `opcua` settings to connect to the OPC UA Server.

### variables

After that, every nodeId in `variables` is monitored to react on changes. The `pollRate` will define the maximum frequency a value gets checked.

| variable name | value                |
| ------------- | -------------------- |
| state         | 2                    |
| speed         | 3.141592653589793    |
| temp          | 31.4159265           |
| error         | 7                    |
| errorDesc     | "Oil level critical" |

According to this values, the `valueEmitters` and the `machineStateEmitters` get triggered.

### valueEmitters

The `valueEmitters` is configured for two variables. `speed` and `temp`.

#### value: speed

```JSON
  "speed": {
    "name": "speed",
    "decimal": 2,
    "distinct": true
  }
```

The `speed` value get fixed at the seconde `decimal` position and compared to the last value. If the values changes, an actyx event is emitted.

```JS
{
  eventType: 'valueChanged',
  device: 'Machine 1',
  name: 'speed',
  value: 3.14,
}
```

As you can see, the device is set from the settings as well. The `machineName` setting is in charge for that.

#### value: temp

```JSON
  "temp": {
    "name": "temperature",
    "template": "{value}C°",
    "decimal": 1,
    "distinct": true
  }
```

Same here, the `temp` value get fixed at the first `decimal` position, renderst in the `template`, and compared to the last value. If the values changes, an actyx event is emitted.

```JS
{
  eventType: 'valueChanged',
  device: 'Machine 1',
  name: 'temperature',
  value: "31.4C°",
}
```

### machineStateEmitters

The `machineStateEmitters` is configured with 6 rules. `"Off"`, `"On"`, `"Power off"`, `"Error"`, `"Critical Error"`, and `"Emergency"`.

For each configuration, the rule gets validated. If a rule match, an actyx event `statusChanged` gets emitted. Additionally, if `generateError` is also set as true, am `errorOccurred` event gets emitted.

In our example, the `Critical Error` is the only matching rule.

```JSON
"Critical Error": {
  "state": 10,
  "rule": "state == 2 && error > 2 && error != 10",
  "description": "critical error: {error} at {state} - {errorDesc}",
  "generateError": true
},
```

```js
let state = 2
let error = 7(state == 2 && error > 2 && error != 10) === true
```

According to the configuration, following event is emitted.

```JS
{
  eventType: 'statusChanged',
  device: 'Machine 1',
  state: 10,
  stateDesc: 'critical error: 7 at 2 - Oil level critical',
}
```

In this example, `generateError` is also set as true and a errorOccurred event gets emitted in addition.

```JS
{
  eventType: 'errorOccurred',
  errorId: 'some-random-uuid',
  machineName: 'Machine 1',
  errorCode: 10,
  description: 'critical error: 7 at 2 - Oil level critical',
}
```
