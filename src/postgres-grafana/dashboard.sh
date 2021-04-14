#!/usr/bin/env bash
# Like this script? 
# Generate boilerplate for similar ones at https://bashplate.wolfgang-werner.net.

set -o errexit  # exit on error
set -o nounset  # don't allow unset variables
# set -o xtrace # enable for debugging

usage() {
  printf "Start dashboard and database.\nRequires docker on the path.\n\n"

  printf "Usage: $(basename "$0") "
  printf -- "[-h] "
  printf -- "[-v] "
  printf -- "[-c] "
  printf -- "[-i] "
  printf -- "[-s] "
  printf -- "[-x] "
  printf -- "[-d=< data >] "
  printf -- "[-p=< provisioning >] "
  printf "\n"

  printf "  -%s\t%s - %s%s\n" "h" "help" "Show this help message." ""
  printf "  -%s\t%s - %s%s\n" "v" "version" "Show version information." ""
  printf "  -%s\t%s - %s%s\n" "c" "clean" "Remove existing containers and data" ""
  printf "  -%s\t%s - %s%s\n" "i" "init" "Start containers for the first time" ""
  printf "  -%s\t%s - %s%s\n" "s" "start" "Start existing containers" ""
  printf "  -%s\t%s - %s%s\n" "x" "stop" "Stop running containers" ""
  printf "  -%s\t%s - %s%s\n" "d" "data" "Data folder for PostgreSQL data" " (default: grafana-provisioning)"
  printf "  -%s\t%s - %s%s\n" "p" "provisioning" "Data folder for provisioning Grafana" " (default: pg-data)"
}

version() {
  printf "0.0.1\n"
}

# default values
opt_help="false"
opt_version="false"
opt_clean="false"
opt_init="false"
opt_start="false"
opt_stop="false"
opt_provisioning="grafana-provisioning"
opt_data="pg-data"

# declared functions
clean() {
  echo "Cleaning data ($opt_data) and removing docker images ..." 
  docker stop actyx_demo_box-grafana && docker rm actyx_demo_box-grafana 
  docker stop actyx_demo_box-postgres && docker rm actyx_demo_box-postgres 
  rm -rf $opt_data
  echo "Cleaning data ($opt_data) and removing docker images ..." 
}

init() {
  echo "Initializing and starting dashboard and database" 
  mkdir -p $opt_data
  docker run -d --name actyx_demo_box-postgres --restart always \
    -v ${PWD}/${opt_data}:/var/lib/postgresql/data \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=postgres \
    -p 5432:5432 \
  postgres:12-alpine

# init grafana
  docker run -d --name actyx_demo_box-grafana --restart always \
    -v ${PWD}/${opt_provisioning}:/etc/grafana/provisioning/ \
    -e GF_AUTH_ANONYMOUS_ENABLED=true \
    -p 3000:3000 \
    --add-host="db:172.17.0.1" \
    grafana/grafana:latest
  echo "... done." 
  echo "Open the dashboard at http://localhost:3000/d/actyx-adb/actyx-demo-box or log in at http://localhost:3000/login using admin/admin" 
}
start() {
  echo "Starting existing containers w/ pre-populated data" 
  docker start actyx_demo_box-postgres
  docker start actyx_demo_box-grafana
  echo "... done." 
  echo "Open the dashboard at http://localhost:3000/d/actyx-adb/actyx-demo-box or log in at http://localhost:3000/login using admin/admin" 
}
stop() {
  echo "Stopping running containers" 
  docker stop actyx_demo_box-postgres
  docker stop actyx_demo_box-grafana
  echo "... done." 
}

# option parsing
OPTSPEC=:hvcisxd:p:
while getopts $OPTSPEC option; do
  case "$option" in
    h ) opt_help="true"; usage; exit 0  ;;
    v ) opt_version="true"; version; exit 0  ;;
    c ) opt_clean="true"; clean;  ;;
    i ) opt_init="true"; init;  ;;
    s ) opt_start="true"; start;  ;;
    x ) opt_stop="true"; stop;  ;;
    d ) opt_data=$OPTARG;  ;;
    p ) opt_provisioning=$OPTARG;  ;;
   \? ) echo "Unknown option: -$OPTARG" >&2; exit 1;;
    : ) echo "Missing option argument for -$OPTARG" >&2; exit 1;;
    * ) echo "Unimplemented option: -$OPTARG" >&2; exit 1;;
  esac
done
shift $((OPTIND - 1))
