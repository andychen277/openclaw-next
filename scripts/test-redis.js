const { createClient } = require('redis');

async function testRedis() {
    const url = process.env.REDIS_URL;
    console.log('Connecting to:', url ? 'URL hidden' : 'NULL');
    const client = createClient({ url, socket: { connectTimeout: 5000 } });
    client.on('error', (err) => console.log('Redis Error:', err));

    try {
        await client.connect();
        console.log('Connected!');
        const val = await client.get('openclaw:tasks');
        console.log('Tasks:', val);
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}

testRedis();
