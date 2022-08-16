# syntax=docker/dockerfile:1

FROM golang:1.19-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY *.go ./
COPY build/ ./build/
COPY data.json ./data.json

RUN go build -o /docker-cah

EXPOSE 8080

CMD [ "/docker-cah" ]