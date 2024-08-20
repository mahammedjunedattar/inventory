import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

let cachedClient = null;


async function connectToDatabase() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is not set');
    }

    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // Adjust timeout as needed
        tls: true, // Use TLS for secure connection
        tlsAllowInvalidCertificates: true, // Allow invalid certificates (for development only)
        tlsAllowInvalidHostnames: true // Allow invalid hostnames (for development only)
    });

    cachedClient = await client.connect();
    return cachedClient;
}
export async function GET(request) { 
    try {
     return   NextResponse.json({message:"ok"},{status : 200})

        
    } catch (error) {
        return   NextResponse.json({message:error.message},{status : 500})

        
    }
}
