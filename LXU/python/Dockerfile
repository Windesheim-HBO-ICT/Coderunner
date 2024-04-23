FROM python:3 as base
WORKDIR /source

COPY script.sh .
RUN chmod +x script.sh

# Run the application
CMD ["/source/script.sh"]
