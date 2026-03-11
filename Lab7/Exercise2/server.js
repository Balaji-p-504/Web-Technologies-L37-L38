const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3001;
const url = 'mongodb://localhost:27017';
const dbName = 'bookstore_manager';

app.use(cors());
app.use(express.json());

let db;
let booksCollection;

// API Routes
// 1. Search by Title (Regex)
app.get('/books/search', async (req, res) => {
  try {
    const { title } = req.query;
    const query = { title: { $regex: title, $options: 'i' } };
    const books = await booksCollection.find(query).toArray();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Filter by Category
app.get('/books/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const books = await booksCollection.find({ category }).toArray();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Sort Books (Price Asc or Rating Desc)
app.get('/books/sort/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let sortQuery = {};
    if (type === 'price') sortQuery = { price: 1 };
    else if (type === 'rating') sortQuery = { rating: -1 };
    
    const books = await booksCollection.find().sort(sortQuery).toArray();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Top Rated Books (Rating >= 4, limit 5)
app.get('/books/top', async (req, res) => {
  try {
    const books = await booksCollection.find({ rating: { $gte: 4 } }).limit(5).toArray();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Pagination (skip and limit)
app.get('/books', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const books = await booksCollection.find().skip(skip).limit(limit).toArray();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  try {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    booksCollection = db.collection('books');
    console.log('Connected to MongoDB successfully (Exercise 2)');
    
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
