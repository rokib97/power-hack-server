const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iks79.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const billCollection = client.db("power_hack").collection("bills");

    // add billling api
    app.post("/add-billing", async (req, res) => {
      const bill = req.body;
      const result = await billCollection.insertOne(bill);
      res.send(result);
    });

    // get billing list api
    app.get("/billing-list", async (req, res) => {
      const bills = await billCollection.find().toArray();
      res.send(bills);
    });

    // update bill api
    app.put("/update-billing/:id", async (req, res) => {
      const id = req.params.id;
      const updatedBill = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: updatedBill,
      };
      const result = await billCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // delete bill api
    app.delete("/delete-billing/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await billCollection.deleteOne(query);
      res.send(result);
    });

    console.log("db connected");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From Power Hack!");
});

app.listen(port, () => {
  console.log(`Power Hack app listening on port ${port}`);
});
