# 🧰 Actyx DemoBox

This example contains applications to get you started with ...

* ... connecting a machine to an Actyx environment,
* ... reading values from the machine,
* ... visualizing values on a dashboard,
* ... interacting using a web interface,

It also comes with a mock data generator that produces random values for visualization, in case you don't have a PLC at hand.

## Prerequistes

To run this demo, you need the following tools:

* Actyx (https://downloads.actyx.com/)
* NodeJS >= v 14 + NPM (https://nodejs.org/en/)
* Docker (https://www.docker.com/get-started)

To connect to an S7 PLC, it needs to be accessible using TSAP.

## 🚀 Quickstart

To see the demo in action w/o having to connect to a PLC, you need to start the DB exporter, the dashboard and the application generating machine mock readings:

* Clone this repository
* Run `npm install` from the project folder
* Make sure `Actyx` is running on your node
* Start the dasboard and database by running `./dasboard.sh -i` from `src/postgres-grafana`. If you don't use bash, please refer to [the dashboard README](src/postgres-grafana/README.md).
* Run the worker ui application using `npm run ui:worker-ui:start` from the project root.
* Start the DB exporter using `npm run node:db-exporter:start` from the project root.

If you want to connect to a Siemens PLC, review the default connection configuration in [src/tsap-connector/settings.ts](src/tsap-connector/settings.ts#L14) and either adjust or set them using the `APP_SETTINGS` environment variable.

Otherwise you can work with example data: Run `npm run node:mock-machine-connector:start` to produce mock machine data.

## 📦 Applications

The demo box project was created using the [`axp` utility for Actyx projects](https://github.com/actyx-contrib/actyx-project-cli). This gives us a common structure and `npm run` scripts for all contained applications.


### 🔌 Machine Connectors

Machine connectors read values from PLCs and publish them as Actyx events.
#### TSAP

The TSAP connector uses [the nodes7 library](https://www.npmjs.com/package/nodes7) to connect to and read values from an S7/Siemens Logo! PLC.

The relevant inputs can be configured and converted into events using a (also configurable) declarative rule set.

For details, see [the application's README](./src/tsap-connector/README.md).
#### OPC UA

We're sorry, the OPC UA connector is not quite finished at the moment.
If you need already it, please let us know via https://community.actyx.com/.

### 🎲 Mock Machine Connector

### 🗃️ DB Connector

### 📊 Dashboard

 For details, please refer to [the application's README](src/postgres-grafana/README.md)

### 👷‍♂️ Worker UI

control + Shift + Alt + D  for dev mode in ui
