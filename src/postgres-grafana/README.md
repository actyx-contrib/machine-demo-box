# Postgres + Grafana


## start Postgres

`docker run -d --name postgres --restart always -v pg-data:/var/lib/postgresql/data -e "POSTGRES_PASSWORD=postgres" -e "POSTGRES_DB=postgres" -p 5432:5432 postgres:12-alpine`

## start Grafana

`docker run -d --name grafana --restart always -p 3000:3000 grafana/grafana:latest`


## start pgAdmin

Handy tool to manage the postgres database

`docker run -d --name pgadmin4 --restart unless-stopped -e "PGADMIN_DEFAULT_EMAIL=user@domain.com" -e "PGADMIN_DEFAULT_PASSWORD=password" -p 8099:80 dpage/pgadmin4`


## dashboard:

per machine:
  - KPI (groupBy status) (PieChart) (check readme - settings in tsap-connector)
  - OEE
  - Values in graphen over time
  - Error barchart over time: Ignored Yellow) / Acknowledged

