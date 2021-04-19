# TSAP Connector

This connector application shows how to implement a generic, configurable TSAP connector to talk to S7/Siemens Logo! PLCs

The possible settings are described using JSON schema and are validated during application startup. Settings can be passed to the application using the `APP_SETTINGS` environment variable.

Values from the PLC are [polled in a configurable interval](./plc-connect.ts#L38), [converted to events](./plc-connect.ts#L66) using a [configurable rule set](./settings.ts#L38) and emitted in case the value changed.

Error events are emitted based on the `generateError` property from the conversion rule configuration.

## Settings Example

```JSON
{
  "machineName": "Machine 1",
  "tsap": {
    "port": 102,
    "host": "192.168.0.1",
    "localTSAP": "0x0100",
    "remoteTSAP": "0x0200",
    "timeout": 8000
  },
  "pollInterval": 500,
  "errorTag": ["Machine:{id}", "MachineError:{uuid}"],
  "bdeVariables": {
    "address": "IB0",
    "mask": "11111111",
    "publishUnknownState": false
  },
  "analogVariables": {
    "counter": {
      "address": "DB1,INT1024"
    }
  },
  "rules": {
    "On": {
      "bdeState": 1,
      "inputs": 1
    },
    "Off": {
      "bdeState": 0,
      "inputs": 0
    },
    "Error A": {
      "bdeState": 10,
      "inputs": 3,
      "generateError": true
    },
    "Emergency": {
      "bdeState": 99,
      "inputs": 128
    }
  }
}
```
