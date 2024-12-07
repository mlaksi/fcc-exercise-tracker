const express = require("express");

const db = require("./db");
const app = express();
const cors = require("cors");
const { ObjectId } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//TEST ROUTE
//create a test BOOK collection inside a db, insert one document into it
app.get("/mlaksi", async (req, res) => {
  try {
    const database = db.getDb();
    await database.collection("books").insertOne({
      title: "The Count of Monte Cristo",
      author: "Alexandre Dumas",
      year: 1844,
      genres: ["Adventure", "Historical Fiction"],
      available: true,
    });
    res.status(200).send("Book inserted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error inserting book.");
  }
});

app.post("/api/users", async (req, res) => {
  //res.json({ test: req.body.username });
  try {
    const database = db.getDb();
    await database
      .collection("users")
      .insertOne({ username: req.body.username });
    const userObject = await database
      .collection("users")
      .findOne({ username: req.body.username });
    //console.log(userObject);
    //console.log(typeof userObject);
    res.json({ username: req.body.username, _id: userObject._id });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error inserting user.");
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const database = db.getDb();
    const users = await database.collection("users").find().toArray();
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching users.");
  }
});

// 7. You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
// 8. The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const database = db.getDb();

    //pick up user data from form and route params
    const formattedDate = new Date(req.body.date).toDateString();
    const duration = req.body.duration;
    const description = req.body.description;
    const id = new ObjectId(req.params._id);

    //find user with corresponding id
    const user = await database.collection("users").findOne({ _id: id });

    //if there is no user, respond with error
    if (!user) {
      res.status(404).send("User not found");
    }

    res.json({
      _id: user._id,
      username: user.username,
      date: formattedDate,
      duration: duration,
      description: description,
    });

    // await database.collection("exercises").insertOne({
    //   _id: user._id,
    //   username: user.username,
    //   date: formattedDate,
    //   duration: duration,
    //   description: description,
    // });
    // const exercise = database
    //   .collection("exercises")
    //   .findOne({ _id: user._id });
    // if (exercise) {
    //   res.json({ exercise });
    // }
    //await database.collection("exercises").insertOne({});
  } catch (err) {
    console.log(err);
    res.status(500).send("Error inserting exercise.");
  }
});

db.connectToDatabase().then(() => {
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
  });
});
