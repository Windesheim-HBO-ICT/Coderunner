ARG BASE_IMAGE_BUILDER=golang
ARG ALPINE_VERSION=3.19
ARG GO_VERSION=1.22

FROM ${BASE_IMAGE_BUILDER}:${GO_VERSION}-alpine${ALPINE_VERSION} AS builder
WORKDIR /tmp/gobuild
COPY ./ .
RUN go build .

FROM ${BASE_IMAGE_BUILDER}:${GO_VERSION}-alpine${ALPINE_VERSION} AS docker-builder
ARG DOCKER_VERSION=v23.0.0
RUN apk add -U -q --progress --no-cache git bash coreutils gcc musl-dev
WORKDIR /go/src/github.com/docker/cli
RUN git clone --branch ${DOCKER_VERSION} --single-branch --depth 1 https://github.com/docker/cli.git . > /dev/null 2>&1
ENV CGO_ENABLED=0 \
    # GOARCH=${GOARCH} \
    DISABLE_WARN_OUTSIDE_CONTAINER=1
RUN ./scripts/build/binary
RUN rm build/docker && mv build/docker-linux-* build/docker

FROM scratch
ENTRYPOINT [ "bin/coderunner" ]
COPY languages.json /languages.json
COPY --from=docker-builder /go/src/github.com/docker/cli/build/docker /bin/docker
COPY --from=builder /tmp/gobuild/CodeRunner /bin/coderunner
