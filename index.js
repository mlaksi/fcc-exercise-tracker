const express = require("express");

const db = require("./db");
const app = express();
const cors = require("cors");
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

db.connectToDatabase().then(() => {
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
  });
});
