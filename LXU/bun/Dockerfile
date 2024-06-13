FROM oven/bun:latest as base
WORKDIR /source

COPY *.sh .
RUN chmod +x script.sh

# Run the application
ENTRYPOINT [ "cat" ]
