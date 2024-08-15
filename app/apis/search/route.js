import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

let cachedClient = null;

async function connectToDatabase() {
    const uri = "mongodb://junedattar455:qNpORoxFrz3xn9RI@ac-eecfgef-shard-00-00.ladkaob.mongodb.net:27017,ac-eecfgef-shard-00-01.ladkaob.mongodb.net:27017,ac-eecfgef-shard-00-02.ladkaob.mongodb.net:27017/?ssl=true&replicaSet=atlas-8nj8fx-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

    if (!uri) {
        throw new Error('MONGODB_URI is not set');
    }

    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true
    });

    cachedClient = await client.connect();
    return cachedClient;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url, `http://${request.headers.get('host')}`);
    const q = searchParams.get('q');

    if (!q || typeof q !== 'string' || q.trim() === '') {
        return NextResponse.json({ error: 'Query parameter "q" is required and should be a non-empty string' }, { status: 400 }); // Bad Request
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('stock');
        const collection = db.collection('inventory');
        const pipeline = [
            {
                $search: {
                    index: 'default', // Ensure you have an appropriate search index configured in your MongoDB Atlas
                    text: {
                        query: q,
                        path: 'name' // The field to search on
                    }
                }
            },
            { $limit: 10 }
        ];
        const results = await collection.aggregate(pipeline).toArray();

        return NextResponse.json(results, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Unable to search the database', details: e.message }, { status: 500 });
    }
}
