FROM oven/bun:latest as base
WORKDIR /source

COPY *.sh .
RUN chmod +x script.sh
RUN chmod +x exit.sh

# Run the application
ENTRYPOINT [ "cat" ]
