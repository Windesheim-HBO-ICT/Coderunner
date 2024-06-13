FROM python:3 as base
WORKDIR /source

COPY script.sh script.sh
RUN chmod +x script.sh

# Run the application
ENTRYPOINT ["cat"]
