# Etapa 1: Base de Build (SDK)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia apenas os arquivos de projeto e restaura dependências (camada de cache)
COPY *.csproj ./
RUN dotnet restore

# Copia todo o restante do código e compila
COPY . ./
RUN dotnet publish -c Release -o /out

# Etapa 2: Base de Execução (Runtime leve)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /out .

# Expõe as portas configuradas pelo Render
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Backend.dll"]
