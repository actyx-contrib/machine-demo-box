FROM node:10-alpine as build
WORKDIR /usr/src/app

COPY src/mock-machine-connector/package-prod.json ./package.json
RUN npm install --production
COPY build/mock-machine-connector/. .

FROM node:10-alpine
COPY --from=build /usr/src/app /
CMD ["node", "mock-machine-connector/index.js"]
