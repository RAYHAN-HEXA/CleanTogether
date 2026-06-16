const express = require('express')
const app = express();
const cors = require('cors');

require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());

// MongoDB Server Connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db("issuesDB");
  
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}

async function run(req, res) {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const contributionCollection = db.collection("all-contributions");

    const method = req.method;
    const path = req.url;

    //insert issue data
    if (method === 'POST' && path === '/all-issues') {
      const issue = req.body;
      const result = await issuesCollection.insertOne(issue);
      return res.status(200).json(result);
    }

    // get all issues data
    if (method === 'GET' && path === '/all-issues') {
      const result = await issuesCollection.find().toArray();
      return res.status(200).json(result);
    }

    // get single issues data by id
    if (method === 'GET' && path.startsWith('/all-issues/')) {
      const id = path.split('/all-issues/')[1];
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);
      return res.status(200).json(result);
    }

    // get recent complaints 6 card data
    if (method === 'GET' && path === '/recent-issues') {
      const query = issuesCollection
        .find()
        .sort({ date: "descending" })
        .limit(6);
      const result = await query.toArray();
      return res.status(200).json(result);
    }

    // get single card recent complaints
    if (method === 'GET' && path.startsWith('/recent-issues/')) {
      const id = path.split('/recent-issues/')[1];
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);
      return res.status(200).json(result);
    }

    // get my added issues
    if (method === 'GET' && path === '/my-issues') {
      try {
        const query = {};
        const email = req.query.email;
        if (email) {
          query.email = email;
        }
        const cursor = issuesCollection.find(query);
        const result = await cursor.toArray();
        return res.status(200).json(result);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch issues" });
      }
    }

    // update/put added my issues
    if (method === 'PUT' && path.startsWith('/my-issues/')) {
      try {
        const id = path.split('/my-issues/')[1];
        const updatedIssue = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: updatedIssue.title,
            category: updatedIssue.category,
            amount: updatedIssue.amount,
            description: updatedIssue.description,
            status: updatedIssue.status,
          },
        };

        const result = await issuesCollection.updateOne(filter, updateDoc);
        return res.status(200).json(result);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update issue" });
      }
    }

    // delete my added issues
    if (method === 'DELETE' && path.startsWith('/my-issues/')) {
      const id = path.split('/my-issues/')[1];
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.deleteOne(query);
      return res.status(200).json(result);
    }

    // post a new contribution
    if (method === 'POST' && path === '/all-contributions') {
      const contribution = req.body;
      const result = await contributionCollection.insertOne(contribution);
      return res.status(200).json(result);
    }

    // get contributions for the logged-in user only
    if (method === 'GET' && path === '/all-contributions') {
      try {
        const userEmail = req.query.email;
        if (!userEmail) {
          return res.status(401).json({ message: "Unauthorized Man" });
        }

        const result = await contributionCollection
          .find({ email: userEmail })
          .toArray();
        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: "Server Error" });
      }
    }

    // GET all contributions for a specific issue
    if (method === 'GET' && path.startsWith('/all-contributions/')) {
      const issueId = path.split('/all-contributions/')[1];
      const result = await contributionCollection.find({ issueId }).toArray();
      return res.status(200).json(result);
    }

    // health check
    if (method === 'GET' && path === '/') {
      return res.status(200).send("Clean Together Server Running!");
    }

    return res.status(404).json({ message: "Not Found" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = run;