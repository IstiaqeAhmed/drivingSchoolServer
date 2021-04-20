const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs-extra");
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
  const trainerCollection = client.db("learnDriving").collection("trainers");

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
    // console.log(date.date);
    const email = req.body.email;
    trainerCollection.find({ email: email }).toArray((err, trainers) => {
      const filter = { date: date.date };
      if (trainers.length === 0) {
        filter.email = email;
      }

      admittanceCollection.find(filter).toArray((err, documents) => {
        res.send(documents);
      });
    });
  });

  app.post("/addATrainer", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    // console.log(name, email, file);
    const filePath = `${__dirname}/trainers/${file.name}`;

    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ msg: "Failed to upload Image" });
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString("base64");

      var image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer.from(encImg, "base64"),
      };

      // return res.send({ name: file.name, path: `/${file.name}` });
      trainerCollection.insertOne({ name, email, image }).then((result) => {
        fs.remove(filePath, (error) => {
          if (error) {
            console.log(error);
            res.status(500).send({ msg: "Failed to upload Image" });
          }
          res.send(result.insertedCount > 0);
        });
        // res.send(result.insertedCount > 0);
      });
    });
  });

  app.post("/isTrainer", (req, res) => {
    const email = req.body.email;
    trainerCollection.find({ email: email }).toArray((err, trainers) => {
      res.send(trainers.length > 0);
    });
  });
});

app.listen(process.env.PORT || port);
