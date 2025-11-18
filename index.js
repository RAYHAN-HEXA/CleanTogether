const express = require('express')
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());

// MongoDB Server Connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = "mongodb+srv://CleanTogether:s8G9xHeveagmbMxd@cluster0.d0osb03.mongodb.net/?appName=Cluster0";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const issuesCollection = client.db("issuesDB").collection("all-issues");
    const contributionCollection = client
      .db("issuesDB")
      .collection("all-contributions");
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //insert issue data
    app.post("/all-issues", async (req, res) => {
      const issue = req.body;
      const result = await issuesCollection.insertOne(issue);
      res.send(result);
    });

    // get all issues data
    app.get("/all-issues", async (req, res) => {
      const result = await issuesCollection.find().toArray();
      res.send(result);
    });

    // get single issues data by id
    app.get("/all-issues/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);
      res.send(result);
    });

    // get recent complaints 6 card data
    app.get("/recent-issues", async (req, res) => {
      const query = issuesCollection
        .find()
        .sort({ date: "descending" })
        .limit(6);
      const result = await query.toArray();
      res.send(result);
    });

    // get single card recent complaints
    app.get("/recent-issues/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);
      res.send(result);
    });

    // get my added issues
    app.get("/my-issues", async (req, res) => {
      try {
        const query = {};
        const email = req.query.email;
        if (email) {
          query.email = email; // add email filter if provided
        }
        const cursor = issuesCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch issues" });
      }
    });

    // update/put added my issues
    app.put("/my-issues/:id", async (req, res) => {
      try {
        const id = req.params.id;
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
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update issue" });
      }
    });

    // delete my added issues
    app.delete("/my-issues/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.deleteOne(query);
      res.send(result);
    });

    // post a new contribution
    app.post("/all-contributions", async (req, res) => {
      const contribution = req.body;
      const result = await contributionCollection.insertOne(contribution);
      res.send(result);
    });

    // get contributions for the logged-in user only
    app.get("/all-contributions", async (req, res) => {
      try {
        const userEmail = req.query.email; // get email from query
        if (!userEmail) {
          return res.status(401).send({ message: "Unauthorized Man" });
        }

        // fetch contributions only for this user
        const result = await contributionCollection
          .find({ email: userEmail })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server Error" });
      }
    });

    // GET all contributions for a specific issue
    app.get("/all-contributions/:id", async (req, res) => {
      const issueId = req.params.id;
      const result = await contributionCollection.find({ issueId }).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Clean Together Server Running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});