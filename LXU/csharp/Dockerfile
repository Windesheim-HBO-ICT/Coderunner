FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0
ARG TARGETARCH
WORKDIR /source

# Get the source code from external volume
COPY *.csproj .

# Restore the dependencies
RUN dotnet restore

COPY script.sh .
RUN chmod +x script.sh

# Run the application
CMD ["/source/script.sh"]
