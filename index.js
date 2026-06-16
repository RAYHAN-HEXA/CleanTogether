const express = require('express');
const cors = require('cors');
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const app = express();
app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("Clean Together Server Running!");
});

app.post("/all-issues", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const issue = req.body;
    const result = await issuesCollection.insertOne(issue);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/all-issues", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const result = await issuesCollection.find().toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/all-issues/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const query = { _id: new ObjectId(req.params.id) };
    const result = await issuesCollection.findOne(query);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/recent-issues", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const result = await issuesCollection.find().sort({ date: "descending" }).limit(6).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/recent-issues/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const query = { _id: new ObjectId(req.params.id) };
    const result = await issuesCollection.findOne(query);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/my-issues", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const query = {};
    if (req.query.email) {
      query.email = req.query.email;
    }
    const result = await issuesCollection.find(query).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch issues" });
  }
});

app.put("/my-issues/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const filter = { _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: {
        title: req.body.title,
        category: req.body.category,
        amount: req.body.amount,
        description: req.body.description,
        status: req.body.status,
      },
    };
    const result = await issuesCollection.updateOne(filter, updateDoc);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update issue" });
  }
});

app.delete("/my-issues/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const issuesCollection = db.collection("all-issues");
    const query = { _id: new ObjectId(req.params.id) };
    const result = await issuesCollection.deleteOne(query);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/all-contributions", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const contributionCollection = db.collection("all-contributions");
    const contribution = req.body;
    const result = await contributionCollection.insertOne(contribution);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/all-contributions", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const contributionCollection = db.collection("all-contributions");
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(401).json({ message: "Unauthorized Man" });
    }
    const result = await contributionCollection.find({ email: userEmail }).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/all-contributions/:id", async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const contributionCollection = db.collection("all-contributions");
    const result = await contributionCollection.find({ issueId: req.params.id }).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
