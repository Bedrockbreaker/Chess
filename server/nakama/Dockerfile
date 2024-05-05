FROM node:alpine AS build

WORKDIR /backend

COPY package*.json ./
RUN npm ci

COPY *config.js* ./
COPY src/*.ts src/
RUN npm run type-check
RUN npm run build

FROM registry.heroiclabs.com/heroiclabs/nakama:3.21.1

COPY --from=build /backend/build /nakama/data/modules/
COPY local.yml /nakama/data/