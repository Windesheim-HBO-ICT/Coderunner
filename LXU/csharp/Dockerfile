FROM mcr.microsoft.com/dotnet/sdk:8.0
WORKDIR /source

COPY *.csproj .
RUN dotnet restore

COPY *.sh .
RUN chmod +x script.sh

# Run the container while input is supplied
ENTRYPOINT ["cat"]
