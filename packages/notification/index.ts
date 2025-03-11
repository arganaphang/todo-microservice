import { connect } from "amqplib";
import { createTransport } from "nodemailer";

const EXCHANGE_NAME = "notification"
const QUEUE_NAME = "notification-queue";

const rabbitMQClient = await connect(process.env.RABBITMQ_URL || '');
const rabbitMQChannel = await rabbitMQClient.createChannel();
await rabbitMQChannel.assertQueue(QUEUE_NAME, { durable: false });
await rabbitMQChannel.bindQueue(
    QUEUE_NAME,
    EXCHANGE_NAME,
    ''
);

const mailClient = createTransport({
    port: 1025,
});

const MAIL_SENDER = 'noreply@domain.com';

(async () => {
    rabbitMQChannel.consume(QUEUE_NAME, async (message) => {
        if (message) {
            const todos = JSON.parse(message.content.toString());
            await sendMail(todos);
        }
    }, {
        noAck: true
    });
})()

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function sendMail(todos: any) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const listHTML = todos?.map((todo: any) => `<li>${todo?.id} - ${todo?.title} - Completed? ${todo?.is_completed ? 'Yes' : 'NO'}</li>`)?.join('')
    await mailClient.sendMail({
        from: MAIL_SENDER,
        to: MAIL_SENDER, // TODO: Change This
        subject: 'notification todo',
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        text: todos?.map((todo: any) => `${todo?.id} - ${todo?.title} - Completed? ${todo?.is_completed ? 'Yes' : 'NO'}`)?.join('\n'),
        html:
            `<ul>${listHTML}</ul>`,
    });
}
