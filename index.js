const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hxj8t.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static("trainers"));
app.use(fileUpload());

const port = 5000;

app.get("/", (req, res) => {
  res.send("hello from db it's working working");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const admittanceCollection = client
    .db("learnDriving")
    .collection("admittance");

  app.post("/addAdmittance", (req, res) => {
    const admittance = req.body;
    // console.log(admittance);
    admittanceCollection.insertOne(admittance).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/admittance", (req, res) => {
    admittanceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/admittanceByDate", (req, res) => {
    const date = req.body;
    console.log(date.date);
    admittanceCollection.find({ date: date.date }).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/addATrainer", (req, res) => {
    const file = req.files.file;

    const name = req.body.name;
    const email = req.body.email;
    console.log(name, email, file);
    file.mv(`${__dirname}/trainers/${file.name}`, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ msg: "Failed to upload Image" });
      }
      return res.send({ name: file.name, path: `/${file.name}` });
    });
  });
});

app.listen(process.env.PORT || port);
