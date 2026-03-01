FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY Directory.Build.props .
COPY PriceMate.sln .
COPY src/PriceMate.Domain/PriceMate.Domain.csproj src/PriceMate.Domain/
COPY src/PriceMate.Application/PriceMate.Application.csproj src/PriceMate.Application/
COPY src/PriceMate.Infrastructure/PriceMate.Infrastructure.csproj src/PriceMate.Infrastructure/
COPY src/PriceMate.API/PriceMate.API.csproj src/PriceMate.API/
RUN dotnet restore
COPY . .
RUN dotnet publish src/PriceMate.API/PriceMate.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "PriceMate.API.dll"]
