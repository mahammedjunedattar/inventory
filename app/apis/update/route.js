const { MongoClient } = require('mongodb');
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

export async function POST(request) {
    try {
        const data = await request.json(); // Parse incoming JSON data
        const { Action, name, initialquantaty } = data;
        console.log(Action,name)

        const client = await connectToDatabase();
        const db = client.db('stock');
        const collection = db.collection('inventory');

        const newQuantity = Action === 'plus' ? parseInt(initialquantaty)+1  : parseInt(initialquantaty) - 1;
        console.log(newQuantity)
        const result = await collection.updateOne(
            { name: name }, // Filter to select the document to update
            { $set: { "quantity": newQuantity } }
        );

        return NextResponse.json({ message: 'Document updated', result }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Unable to update document', details: e.message }, { status: 500 });
    }
}

async function listDatabases(client) {
    const db = client.db('stock');
    const collection = db.collection('inventory');
    const result = await collection.find().toArray(); // Convert the cursor to an array

    return result;
}
