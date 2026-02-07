const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;

async function startServer() {
    try {
        await client.connect();
        db = client.db("codenexus");

        console.log("✅ MongoDB Atlas Connected");

        app.get("/", (req, res) => {
            res.send("Backend Running");
        });

        app.post("/save", async (req, res) => {
            const data = req.body;
            await db.collection("users").insertOne(data);
            res.json({ success: true });
        });

        app.listen(5000, () => {
            console.log("🚀 Server running on port 5000");
        });

    } catch (err) {
        console.log("❌ MongoDB Connection Error:", err.message);
    }
}

startServer();
