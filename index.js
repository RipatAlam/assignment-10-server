const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb://assignment-10:dxDSXKs4yOeZDEWz@ac-s3wo6ow-shard-00-00.yij54yk.mongodb.net:27017,ac-s3wo6ow-shard-00-01.yij54yk.mongodb.net:27017,ac-s3wo6ow-shard-00-02.yij54yk.mongodb.net:27017/?ssl=true&replicaSet=atlas-udtgap-shard-0&authSource=admin&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let usersCollection; // ✅ global scope

async function run() {
  try {
    await client.connect();

    const db = client.db("assignment-10");
    usersCollection = db.collection("users");

    console.log("MongoDB connected");
  } catch (err) {
    console.log(err);
  }
}

run();

// test route
app.get("/", (req, res) => {
  res.send("Assignment 10 server is running");
});

// 🔥 PROFILE UPDATE API
app.patch("/profile/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, image, password } = req.body;

    const updateData = {
      name,
      email,
      image,
    };

    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});