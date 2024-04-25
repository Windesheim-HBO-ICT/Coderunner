FROM python:3 as base
WORKDIR /source

COPY *.sh .
RUN chmod +x script.sh
RUN chmod +x exit.sh

# Run the application
CMD ["/source/exit.sh"]
