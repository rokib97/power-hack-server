const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
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

function verifyJWT(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "UnAuthorized" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    await client.connect();
    const billCollection = client.db("power_hack").collection("bills");
    const userCollection = client.db("power_hack").collection("users");

    // add billling api
    app.post("/add-billing", verifyJWT, async (req, res) => {
      const bill = req.body;
      const result = await billCollection.insertOne(bill);
      result.acknowledged
        ? res.status(200).send({
            success: true,
            message: "Data Saved Succesfully!",
          })
        : res.status(500).send({
            success: false,
            message: "Internal Server Error",
          });
      wq;
    });

    // get billing list api
    app.get("/billing-list", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      let bills;
      if (size || page) {
        bills = await billCollection
          .find()
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        bills = await billCollection.find().toArray();
      }

      res.send(bills);
    });

    // all bills
    app.get("/all-bill", async (req, res) => {
      const bills = await billCollection.find().toArray();
      res.send(bills);
    });

    // page count api
    app.get("/billing-listCount", async (req, res) => {
      const count = await billCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // update bill api
    app.put("/update-billing/:id", verifyJWT, async (req, res) => {
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
    app.delete("/delete-billing/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await billCollection.deleteOne(query);
      res.send(result);
    });

    // get auth users
    app.get("/users", verifyJWT, async (req, res) => {
      const email = req.decoded;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    // user registration api
    app.post("/registration", async (req, res) => {
      const email = req.body.email;
      const name = req.body.name;
      const password = req.body.password;
      const hashedPassword = bcryptjs.hashSync(password, 10);

      const requester = await userCollection.findOne({ email: email });

      if (requester) {
        res.send({ status: 401, message: "user already exits in database" });
      } else {
        const user = {
          email,
          name,
          hashedPassword,
        };
        const result = await userCollection.insertOne(user);
        res.send({ status: 200, message: "User created successfull" });
      }
    });

    // user Login api
    app.post("/login", async (req, res) => {
      const email = req.body.email;
      const password = req.body.password;
      const requesterAccount = await userCollection.findOne({ email: email });
      if (requesterAccount) {
        const isPasswordCorrect = bcryptjs.compareSync(
          password,
          requesterAccount.hashedPassword
        );
        if (isPasswordCorrect) {
          const userToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
          res.send({
            status: 200,
            message: "Login Successfull",
            token: userToken,
          });
        } else {
          res.send({ status: 401, message: "User or pass does not match" });
        }
      } else {
        res.send({ status: 401, message: "User or pass does not match" });
      }
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
