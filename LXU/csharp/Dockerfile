FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0
ARG TARGETARCH
WORKDIR /source

RUN dotnet tool install -g dotnet-script

ENV PATH="${PATH}:/root/.dotnet/tools"

COPY script.sh .
RUN chmod +x script.sh

# Run the application
CMD ["/source/script.sh"]
