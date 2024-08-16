const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb setup
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://job-task-databasepb:OMA7AxSXveZ7OVAp@cluster0.hv89ofo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    productCollection = client.db("productDB").collection("product");
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

run().catch(console.dir);

app.get("/getProduct", async (req, res) => {
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);
  const searchQuery = req.query.search || "";
  const brandFilter = req.query.brand || "";
  const categoryFilter = req.query.category || "";
  const priceMin = parseInt(req.query.priceMin) || 0;
  const priceMax = parseInt(req.query.priceMax) || 10000;

  try {
    const query = {
      ...(searchQuery && { name: { $regex: searchQuery, $options: 'i' } }),
      ...(brandFilter && { brand: { $regex: brandFilter, $options: 'i' } }),
      ...(categoryFilter && { category: { $regex: categoryFilter, $options: 'i' } }),
      price: { $gte: priceMin, $lte: priceMax }
    };

    const products = await productCollection
      .find(query)
      .skip(page * size)
      .limit(size)
      .toArray();

    const totalCount = await productCollection.countDocuments(query);

    res.send({
      products,
      totalCount
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.get("/productcount", async (req, res) => {
  try {
    const count = await productCollection.estimatedDocumentCount();
    res.send({ count });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Alhamdulillah, your server is now working, Mashallah.");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
