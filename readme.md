# todos

## How to Run

1. Spin up docker compose
   `docker compose up -d`
2. Create .env file, just copy and paste .env.example
3. Run Migration Database

```sh
cd packages/model
bun drizzle push
```

4. Run API Service

```sh
cd packages/api
bun dev
```

5. Run Notification Service

```sh
cd packages/notification
bun dev
```

6. Run Scheduler Service

```sh
cd packages/scheduler
bun dev
```

## Open Dashboard

1. Swagger http://localhost:8000/swagger
2. RabbitMQ Dashboard http://localhost:15672 -> port see docker-compose.yaml
   > username: guest, password: guest
3. Mail Dashboard http://localhost:8025
