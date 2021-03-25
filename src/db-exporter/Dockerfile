FROM node:10-alpine as build
WORKDIR /usr/src/app

COPY src/db-exporter/package-prod.json ./package.json
RUN npm install --production
COPY build/db-exporter/. .

FROM node:10-alpine
COPY --from=build /usr/src/app /
CMD ["node", "db-exporter/index.js"]
