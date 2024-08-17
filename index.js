require("dotenv").config(); // Ensure environment variables are loaded

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://job-task-a42d5.web.app",
      "https://job-task-a42d5.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

// mongodb setup
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hv89ofo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let productCollection;

async function run() {
  try {
    await client.connect();
    productCollection = client.db("productDB").collection("product");
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

run().catch(console.dir);

app.get("/getProduct", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 10;
  const searchQuery = req.query.search || "";
  const brandFilter = req.query.brand || "";
  const categoryFilter = req.query.category || "";
  const priceMin = parseInt(req.query.priceMin) || 0;
  const priceMax = parseInt(req.query.priceMax) || 10000;
  const sortOption = req.query.sort || "priceLowToHigh";

  const query = {
    ...(searchQuery && { name: { $regex: searchQuery, $options: "i" } }),
    ...(brandFilter && { brand: { $regex: brandFilter, $options: "i" } }),
    ...(categoryFilter && {
      category: { $regex: categoryFilter, $options: "i" },
    }),
    price: { $gte: priceMin, $lte: priceMax },
  };

  let sort;
  switch (sortOption) {
    case "priceLowToHigh":
      sort = { price: 1 };
      break;
    case "priceHighToLow":
      sort = { price: -1 };
      break;
    case "dateNewestFirst":
      sort = { dateAdded: -1 };
      break;
    default:
      sort = { price: 1 };
  }

  try {
    const products = await productCollection
      .find(query)
      .sort(sort)
      .skip(page * size)
      .limit(size)
      .toArray();

    const totalCount = await productCollection.countDocuments(query);

    res.send({
      products,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/productcount", async (req, res) => {
  try {
    const count = await productCollection.estimatedDocumentCount();
    res.send({ count });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Alhamdulillahhhhh, your server is now working, Mashallah.");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
