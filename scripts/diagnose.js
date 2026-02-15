const { createClient } = require('redis');
const path = require('path');
const fs = require('fs');

// Load env
const envLocal = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocal)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envLocal));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function main() {
    console.log('🔍 OpenClaw Diagnostics');
    console.log('=======================');

    const url = process.env.REDIS_URL;
    if (!url) {
        console.error('❌ REDIS_URL not found in .env.local');
        process.exit(1);
    }

    console.log(`📡 Connecting to Redis...`);
    const client = createClient({ url });

    try {
        await client.connect();
        console.log('✅ Redis connected successfully');

        const TASKS_KEY = 'openclaw:tasks';
        const tasksJson = await client.get(TASKS_KEY);

        if (tasksJson) {
            const tasks = JSON.parse(tasksJson);
            console.log(`\n📋 Found ${tasks.length} total tasks:`);

            const todo = tasks.filter(t => t.status === 'todo' || t.frontendStatus === 'todo');
            const ongoing = tasks.filter(t => t.status === 'in_progress' || t.frontendStatus === 'ongoing' || t.frontendStatus === 'in_progress');
            const done = tasks.filter(t => t.status === 'done' || t.frontendStatus === 'done');

            console.log(`   - Todo: ${todo.length}`);
            console.log(`   - Ongoing: ${ongoing.length}`);
            console.log(`   - Done: ${done.length}`);

            if (todo.length > 0) {
                console.log('\n   Latest Todo Item:');
                console.log(`   [${todo[0].id}] ${todo[0].task}`);
            }
        } else {
            console.log('⚠️ No tasks found (Key openclaw:tasks is empty)');
        }

    } catch (e) {
        console.error('❌ Redis error:', e);
    } finally {
        await client.disconnect();
    }
}

main();
