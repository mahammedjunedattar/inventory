import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Replace with your actual connection string (avoid storing in code)
const uri = "mongodb://junedattar455:qNpORoxFrz3xn9RI@ac-eecfgef-shard-00-00.ladkaob.mongodb.net:27017,ac-eecfgef-shard-00-01.ladkaob.mongodb.net:27017,ac-eecfgef-shard-00-02.ladkaob.mongodb.net:27017/?ssl=true&replicaSet=atlas-8nj8fx-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

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
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirm-password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
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

    const existingUser = await collection.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await collection.insertOne({
      email: data.email,
      password: hashedPassword,
    });

    const tokenData = { id: user.insertedId }; // Use inserted ID for user
    const authtoken = jwt.sign(tokenData, uri);

    return NextResponse.json({ message: 'Document inserted', authtoken, ok: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to insert document', details: e.message }, { status: 500 });
  }
}
