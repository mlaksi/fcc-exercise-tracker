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

app.post("/api/users", async (req, res) => {
  //res.json({ test: req.body.username });
  try {
    const database = db.getDb();
    const existingUser = await database
      .collection("users")
      .findOne({ username: req.body.username });
    if (existingUser) {
      res.json({ username: existingUser.username, _id: existingUser._id });
    } else {
      await database
        .collection("users")
        .insertOne({ username: req.body.username });
      const userObject = await database
        .collection("users")
        .findOne({ username: req.body.username });

      res.json({ username: req.body.username, _id: userObject._id });
    }
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
    const from = req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;

    const noFrom = isNaN(new Date(from).getTime());
    const noTo = isNaN(new Date(to).getTime());
    const noLimit = !limit;

    // console.log("no from", noFrom);
    // console.log("no to", noTo);
    // console.log("no limit", noLimit);

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

    const existingLog = await database
      .collection("logs")
      .findOne({ username: username });

    if (existingLog) {
      await database
        .collection("logs")
        .updateOne({ _id: objectId }, { $set: { log: formattedExercises } });
      console.log("UPDATING LOG");
    } else {
      await database.collection("logs").insertOne({
        username: username,
        count: formattedExercises.length,
        _id: objectId,
        log: formattedExercises,
      });
      console.log("INSERTING LOG");
    }

    if (noFrom && noTo && noLimit) {
      res.json({
        username: username,
        count: formattedExercises.length,
        _id: objectId,
        log: formattedExercises,
      });
    }
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
