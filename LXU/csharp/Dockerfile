FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0
ARG TARGETARCH
WORKDIR /source

COPY *.csproj .
RUN dotnet restore

COPY *.sh .
RUN chmod +x script.sh
RUN chmod +x exit.sh

# Run the container while input is supplied
ENTRYPOINT ["/source/exit.sh"]
