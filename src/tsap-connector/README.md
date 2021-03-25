# TSAP-connector

- Example for advanced settings with schema and what you can achieve
- Connect to a S7/Siemens Logo! and pool values in a interval
- Convert inputs with a rule set to events
- read analog values and emit on change
- create error-occurred events, with tags from the settings


## Settings

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
