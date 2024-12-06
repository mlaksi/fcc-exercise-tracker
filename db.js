const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let database;

async function connect() {
  const client = await MongoClient.connect(
    "mongodb+srv://mladenka:mlaksi@exercisetracker.v4tfe.mongodb.net/?retryWrites=true&w=majority&appName=ExerciseTracker"
  );
  database = client.db("ExerciseTracker");
}

function getDb() {
  if (!database) {
    throw { message: "ERROR: DB connection NOT established!" };
  }
  return database;
}

module.exports = {
  connectToDatabase: connect,
  getDb: getDb,
};
