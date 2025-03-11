import { Elysia } from 'elysia'
import { cron } from '@elysiajs/cron'
import db, { todos } from 'model';
import { connect } from "amqplib";
import { eq } from 'drizzle-orm';

const EXCHANGE_NAME = "notification"

const rabbitMQClient = await connect(process.env.RABBITMQ_URL || '');
const rabbitMQChannel = await rabbitMQClient.createChannel();
await rabbitMQChannel.assertExchange(
    EXCHANGE_NAME,
    "direct",
    {
        durable: false,
    }
)

new Elysia()
    .use(
        cron({
            name: 'send-email',
            pattern: '*/1 * * * *', // run every minute
            async run() {
                console.log(new Date(), "Runing JOB");
                const data = await db.select().from(todos).where(eq(todos.is_completed, false)); // ? Just Send Incompleted TODOS
                rabbitMQChannel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(data)))
            }
        })
    )
    .listen(3000)