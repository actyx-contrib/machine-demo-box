FROM node:10-alpine as build
WORKDIR /usr/src/app

COPY src/opcua-mock-plc/package-prod.json ./package.json
RUN npm install --production
COPY build/opcua-mock-plc/. .

FROM node:10-alpine
COPY --from=build /usr/src/app /
CMD ["node", "opcua-mock-plc/index.js"]
