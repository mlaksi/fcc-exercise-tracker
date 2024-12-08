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

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const database = db.getDb();

    //pick up user data from form and route params
    let formattedDate = new Date(req.body.date).toDateString();
    if (!req.body.date) {
      const timestamp = Date.now();
      formattedDate = new Date(timestamp).toDateString();
    }

    const duration = parseInt(req.body.duration);
    const description = req.body.description;
    const id = new ObjectId(req.params._id);

    //find user with corresponding id
    const user = await database.collection("users").findOne({ _id: id });

    //if there is no user, respond with error
    if (!user) {
      res.status(404).send("User not found");
    }

    const stringId = user._id.toString();

    await database.collection("exercises").insertOne({
      userid: user._id,
      username: user.username,
      date: formattedDate,
      duration: duration,
      description: description,
    });

    res.json({
      username: user.username,
      description: description,
      duration: duration,
      date: formattedDate,
      _id: user._id,
    });

    // const exercise = await database
    //   .collection("exercises")
    //   .findOne({ userid: user._id });

    // res.json({
    //   username: exercise.username,
    //   description: exercise.description,
    //   duration: exercise.duration,
    //   date: exercise.date,
    //   _id: exercise.userid,
    // });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error inserting exercise.");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const database = db.getDb();
    const stringId = req.params._id;
    const objectId = new ObjectId(stringId);

    //optional query params
    const fromDate = req.query.from;
    console.log(fromDate);

    const userExercises = await database
      .collection("exercises")
      .find({ userid: objectId })
      .toArray();
    //console.log(userExercises);
    const user = await database.collection("users").findOne({ _id: objectId });
    const username = user.username;

    const formattedExercises = userExercises.map(
      ({ description, duration, date }) => ({ description, duration, date })
    );
    //console.log(formattedExercises);

    await database.collection("logs").insertOne({
      username: username,
      count: formattedExercises.length,
      _id: objectId,
      log: formattedExercises,
    });

    res.json({
      username: username,
      count: formattedExercises.length,
      _id: objectId,
      log: formattedExercises,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching logs.");
  }
});

db.connectToDatabase().then(() => {
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
  });
});
