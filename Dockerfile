# syntax=docker/dockerfile:1

# node build
FROM node:26-alpine3.24 as node-builder

WORKDIR /usr/src/front

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY vite.config.mts ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/

RUN npm ci
RUN npm run build

# go build
FROM golang:1.19-alpine as go-builder

WORKDIR /usr/src/back

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY *.go ./

RUN go build -o ./docker-cah

# final stage
FROM golang:1.19-alpine

WORKDIR /app

COPY --from=node-builder /usr/src/front/build ./build
COPY --from=go-builder /usr/src/back/docker-cah ./
COPY data.json ./data.json

EXPOSE 8080

CMD [ "/app/docker-cah" ]