# syntax=docker/dockerfile:1

FROM golang:1.22 AS build-stage

# Set destination for COPY
RUN mkdir /CodeRunner
ADD . /CodeRunner
WORKDIR /CodeRunner

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code. Note the slash at the end, as explained in
# https://docs.docker.com/reference/dockerfile/#copy
COPY *.go ./

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o CodeRunner .

# Deploy the application binary into a lean image
FROM alpine AS build-release-stage

WORKDIR /

# Copy the binary from the build stage
COPY --from=build-stage /CodeRunner/CodeRunner /CodeRunner
# Copy the language defenitions to the image
COPY languages.json /languages.json

EXPOSE 8080

ENTRYPOINT ["/CodeRunner"]
