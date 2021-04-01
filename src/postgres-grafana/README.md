# Visualizing data from the shop floor

Machine data is exported to a [postgreSQL](https://www.postgresql.org/) DB using visualized using the `db-exporter` connector application. From there, we visualize the data using [Grafana](https://grafana.org/).

## Quickstart

We'll run both the database and grafana within docker. Use the snippet below to start both containers with default configurations. 
Point your browser to http://localhost:3000/. 

TODO: @Alex, what was the reason not to use `docker-compose`? Would make linking postgres & grafana more straight forward, IMHO

```bash
# clean up
docker stop dmb-grafana && docker rm dmb-grafana 
docker stop dmb-postgres && docker rm dmb-postgres 

# start postgres
docker run -d --name dmb-postgres --restart always \
  -v pg-data:/var/lib/postgresql/data \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  postgres:12-alpine

# start grafana
docker run -d --name dmb-grafana --restart always \
  -v${PWD}/grafana-provisioning:/etc/grafana/provisioning/ \
  -e GF_AUTH_ANONYMOUS_ENABLED=true \
  -p 3000:3000 \
  --add-host="db:172.17.0.1" \
  grafana/grafana:latest
```

### Default credentials

PostgreSQL:

* DB: postgres
* User: postgres
* Password: postgres

Grafana:

* Login URL: http://localhost:3000/
* User: admin
* Password: admin

### start pgAdmin

Handy tool to manage the postgres database

`docker run -d --name pgadmin4 --restart unless-stopped -e "PGADMIN_DEFAULT_EMAIL=user@domain.com" -e "PGADMIN_DEFAULT_PASSWORD=password" -p 8099:80 dpage/pgadmin4`

## Grafana

Dashboards and datasources for grafana are provisioned from `grafana-provisioning`.

To add datasources, create a new `<my datasource>.yml` file in `grafana-provisioning/datasources`.

To add a new dashboard, ...

* ... create a dashboard using the UI,
* ... copy the definition (`Dashboard Settings` (cog wheel icon to the upper right) ->  `JSON Model` -> copy JSON contents)
* ... and paste it to a new `<my dashboard>.json` file in `grafana-provisioning/dashboards`.

To make changes to the dashboards, go to http://localhost:3000/ and log in using `admin`/`admin`

To persist changes in the default dashboard, export the dashboard JSON from the Grafana UI and save the contents to `grafana-provisioning/dashboards/default.json`

## dashboard

per machine:

* KPI (groupBy status) (PieChart) (check readme - settings in tsap-connector)
* OEE
* Values in graphen over time
* Error barchart over time: Ignored Yellow) / Acknowledged

