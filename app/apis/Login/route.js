import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { body, validationResult } from 'express-validator';

const uri = process.env.MONGODB_URI;

let cachedClient = null;

async function connectToDatabase() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // ... other connection options
  });

  cachedClient = await client.connect();
  return cachedClient;
}

const validateSignup = [
  body('email').isEmail().withMessage('Invalid email address'),
];

export async function POST(request) {
  const data = await request.json();
  const req = { body: data };

  await Promise.all(validateSignup.map(validation => validation.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return NextResponse.json({ errors: errors.array() }, { status: 400 });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('credintial');
    const collection = db.collection('secure');

    let user = await collection.findOne({ email: data.email });
    if (!user) {
      return NextResponse.json({ error: 'user cant find' }, { status: 500 });
    }

    return NextResponse.json({ message: 'user exists', ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ details: 'user doesnt exist' }, { status: 500 });
  }
}
