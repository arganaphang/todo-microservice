import { Elysia, t } from 'elysia'
import { swagger } from "@elysiajs/swagger"
import { cors } from "@elysiajs/cors"
import { eq } from 'drizzle-orm';
import db, { todos } from 'model';
import { createClient } from "redis";

const redisClient = await createClient({
    url: process.env.REDIS_URL,
})
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

new Elysia()
    .use(cors())
    .use(swagger({
        documentation: {
            tags: [
                { name: 'Todo', description: 'Todo endpoints' },
                { name: 'Health Check', description: 'Health Check endpoints' },
            ]
        }
    }))
    .get('/healthz', () => ({ success: true, message: 'I am alive!' }), { detail: { tags: ['Health Check'] } })
    .group('/todos', (app) => {
        return app.
            get('/', async () => {
                const data = await db.select().from(todos);
                return { success: true, message: 'get todos', data: data }
            }, { detail: { tags: ['Todo'] } })
            .post('/', async ({ body }) => {
                const data = await db.insert(todos).values({ title: body.title, is_completed: body.is_completed }).returning();
                return { success: true, message: 'create todo', data: data[0] }
            }, {
                body: t.Object({
                    title: t.String(),
                    is_completed: t.Boolean({
                        default: false
                    })
                }),
                detail: { tags: ['Todo'] }
            })
            .get('/:id', async ({ set, params: { id } }) => {
                const todoCache = await redisClient.get(`todo:${id}`);
                if (todoCache) {
                    set.headers['x-cache-by'] = 'redis';
                    return { success: true, message: 'get todo by id', data: JSON.parse(todoCache) }
                }
                const data = await db.select().from(todos).where(eq(todos.id, id)).limit(1);
                await redisClient.set(`todo:${id}`, JSON.stringify(data[0]), { 'EX': 60 * 5 }); // 5 minutes
                return { success: true, message: 'get todo by id', data: data[0] }
            }, {
                params: t.Object({
                    id: t.Number()
                }),
                detail: { tags: ['Todo'] }
            })
            .put('/:id', async ({ params: { id }, body }) => {
                const data = await db.update(todos).set({ title: body.title, is_completed: body.is_completed }).where(eq(todos.id, id)).returning();
                return { success: true, message: 'create todo', data: data[0] }
            }, {
                params: t.Object({
                    id: t.Number()
                }),
                body: t.Object({
                    title: t.String(),
                    is_completed: t.Boolean()
                }),
                detail: { tags: ['Todo'] }
            })
            .delete('/:id', async ({ params: { id } }) => {
                await db.delete(todos).where(eq(todos.id, id));
                return { success: true, message: 'delete todo by id' }
            }, {
                params: t.Object({
                    id: t.Number()
                }),
                detail: { tags: ['Todo'] }
            })
    })
    .listen(8000)