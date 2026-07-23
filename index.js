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
        const lessons = await PublicLessonsCollection.find({
          $or: [
            { status: "Approved" },
            { status: "Published" },
            { status: { $exists: false } },
          ],
        }).toArray();

        res.send(lessons);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Admin All Lessons
    app.get("/admin/public-lessons", async (req, res) => {
      try {
        const lessons = await PublicLessonsCollection.find().toArray();

        res.send(lessons);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    //Public Lessons Home Page
    app.get("/publiclessons-home", async (req, res) => {
      try {
        const result = await PublicLessonsCollection.find({
          $or: [
            { status: "Approved" },
            { status: "Published" },
            { status: { $exists: false } },
          ],
        })
          .limit(3)
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
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
        const lesson = {
          ...req.body,
          status: "Pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

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

    // Approve Lesson API
    app.patch("/public-lessons/approve/:id", async (req, res) => {
      try {
        const id = req.params.id;

        console.log("Approve ID:", id);

        const result = await PublicLessonsCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              status: "Approved",
              updatedAt: new Date(),
            },
          },
        );

        console.log("Update Result:", result);

        res.send({
          success: true,
          message: "Lesson approved successfully",
          result,
        });
      } catch (error) {
        console.log(error);

        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Unapprove Lesson API
    app.patch("/public-lessons/unapprove/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await PublicLessonsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "Pending",
              updatedAt: new Date(),
            },
          },
        );

        res.send({
          success: true,
          message: "Lesson unapproved successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Publish Lesson API
    app.patch("/public-lessons/publish/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await PublicLessonsCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              status: "Published",
              updatedAt: new Date(),
            },
          },
        );

        res.send({
          success: true,
          message: "Lesson published successfully",
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

    const { userId, userName, userEmail, userImage, comment } = req.body;

    await lessonCommentsCollection.insertOne({
      lessonId,
      userId,
      userName,
      userEmail,
      userImage,
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
      },
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

//Comment GET Korar API
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

//Testimonials.jsx e 3ta Comment Show
app.get("/public-comments", async (req, res) => {
  try {
    const comments = await lessonCommentsCollection
      .find()
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

//Comment delete er kaj
app.delete("/public-lessons/comment/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // আগে comment খুঁজে বের করো
    const comment = await lessonCommentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!comment) {
      return res.status(404).send({
        success: false,
        message: "Comment not found",
      });
    }

    // comment delete
    const result = await lessonCommentsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    // lesson এর comment count কমাও
    await PublicLessonsCollection.updateOne(
      {
        _id: new ObjectId(comment.lessonId),
      },
      {
        $inc: {
          comments: -1,
        },
      },
    );

    res.send({
      success: true,
      message: "Comment deleted successfully",
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

//Comment Edit korar jonno
app.put("/public-lessons/comment/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { comment } = req.body;

    const result = await lessonCommentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          comment,
          updatedAt: new Date(),
        },
      },
    );

    res.send({
      success: true,
      message: "Comment updated successfully",
      result,
    });
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

    const { name, email, image, password, profession, country, phone, bio } =
      req.body;

    const updateData = {
      name,
      email,
      image,
      profession,
      country,
      phone,
      bio,
      updatedAt: new Date(),
    };

    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateData,
      },
    );

    res.send({
      success: true,
      message: "Profile updated successfully",
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
