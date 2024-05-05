# Yggdrasil
A chess game designed to run as many variations of Fairy chess as possible.

A WIP port to the Godot game engine.

## Building

### Game (Client + Server)

```bash
> dotnet build
```

### Standalone Server

#### Local

```bash
> cd ./server/nakama
> npm run type-check
> npm run build
```

#### Dockerized

```bash
> cd ./server/nakama
> npm run type-check
> npm run build
> docker-compose -f docker-compose.yml up -d --build
```
