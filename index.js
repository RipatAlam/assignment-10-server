const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let usersCollection; // ✅ global scope
let PublicLessonsCollection;
let lessonLikesCollection;
let lessonCommentsCollection;

async function run() {
  try {
    await client.connect();

    const db = client.db("assignment-10");
    usersCollection = db.collection("users");
    PublicLessonsCollection = db.collection("public_lessons");
    lessonLikesCollection = db.collection("lesson_likes");
    lessonCommentsCollection = db.collection("lesson_comments");

    //Public Lessons ALL-API
    app.get("/public-lessons", async (req, res) => {
      try {
        const lessons = await PublicLessonsCollection.find().toArray();
        res.send(lessons);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //Public Lessons Home Page
    app.get("/publiclessons-home", async (req, res) => {
      try {
        const lessons = await PublicLessonsCollection.find().limit(3);
        const result = await lessons.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //Public Lessons Single Dynamic-API
    app.get("/public-lessons/:id", async (req, res) => {
      try {
        const id = req.params.id;

        let lesson;

        // ObjectId দিয়ে try করবে
        if (ObjectId.isValid(id)) {
          lesson = await PublicLessonsCollection.findOne({
            _id: new ObjectId(id),
          });
        }

        // না পেলে string id দিয়ে try করবে
        if (!lesson) {
          lesson = await PublicLessonsCollection.findOne({
            _id: id,
          });
        }

        if (!lesson) {
          return res.status(404).send({
            success: false,
            message: "Lesson not found",
          });
        }

        res.send(lesson);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });
    //Add Lesson API
    app.post("/public-lessons", async (req, res) => {
      try {
        const lesson = req.body;

        const result = await PublicLessonsCollection.insertOne(lesson);

        res.status(201).send({
          success: true,
          message: "Lesson added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    //Add Lesson Dynamic { ID } Edit API
    app.put("/public-lessons/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedLesson = req.body;

        const result = await PublicLessonsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: updatedLesson,
          },
        );

        res.send({
          success: true,
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    //Add Lesson API Delete
    app.delete("/public-lessons/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await PublicLessonsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send({
          success: true,
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    console.log("MongoDB connected");
  } catch (err) {
    console.log(err);
  }
}

//Like count er jonno API
app.patch("/public-lessons/like/:id", async (req, res) => {
  try {
    const lessonId = req.params.id;
    const { userId, userName, userEmail } = req.body;

    // আগে check করবে user like দিয়েছে কিনা
    const alreadyLiked = await lessonLikesCollection.findOne({
      lessonId,
      userId,
    });

    if (alreadyLiked) {
      return res.send({
        success: false,
        message: "Already liked",
      });
    }

    // lesson_likes এ save করবে
    await lessonLikesCollection.insertOne({
      lessonId,
      userId,
      userName,
      userEmail,
      createdAt: new Date(),
    });

    // public_lessons এ likes +1 করবে
    const result = await PublicLessonsCollection.updateOne(
      {
        _id: lessonId,
      },
      {
        $inc: {
          likes: 1,
        },
      },
    );

    console.log(result);

    console.log(result);

    res.send({
      success: true,
      message: "Liked successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

//Comment ADD Korar API
app.post("/public-lessons/comment/:id", async (req, res) => {
  try {
    const lessonId = req.params.id;

    const {
      userId,
      userName,
      userEmail,
      comment,
    } = req.body;

    await lessonCommentsCollection.insertOne({
      lessonId,
      userId,
      userName,
      userEmail,
      comment,
      createdAt: new Date(),
    });

    await PublicLessonsCollection.updateOne(
      {
        _id: lessonId,
      },
      {
        $inc: {
          comments: 1,
        },
      }
    );

    res.send({
      success: true,
      message: "Comment added successfully",
    });

  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});


app.get("/public-lessons/comments/:id", async (req, res) => {
  try {
    const lessonId = req.params.id;

    const comments = await lessonCommentsCollection
      .find({ lessonId })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(comments);

  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

//Sob Comment Anar API
app.get("/public-lessons/comments/:id", async (req, res) => {
  try {
    const lessonId = req.params.id;

    const comments = await lessonCommentsCollection
      .find({ lessonId })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(comments);

  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

//TestimonialsSection Comment Show
app.get("/public-comments", async (req, res) => {
  try {
    const comments = await lessonCommentsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    res.send(comments);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});


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
      { $set: updateData },
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
