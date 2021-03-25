FROM node:10-alpine as build
WORKDIR /usr/src/app

COPY src/machine-connector/package-prod.json ./package.json
RUN npm install --production
COPY build/machine-connector/. .

FROM node:10-alpine
COPY --from=build /usr/src/app /
CMD ["node", "machine-connector/index.js"]
