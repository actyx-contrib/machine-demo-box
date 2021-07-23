FROM node:10-alpine as build
WORKDIR /usr/src/app

COPY src/opcua-connector/package-prod.json ./package.json
RUN npm install --production
COPY build/opcua-connector/. .

FROM node:10-alpine
COPY --from=build /usr/src/app /
CMD ["node", "opcua-connector/index.js"]
