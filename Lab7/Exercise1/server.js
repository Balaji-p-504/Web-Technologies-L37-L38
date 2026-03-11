const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;
const url = 'mongodb://localhost:27017';
const dbName = 'student_notes_manager';

app.use(cors());
app.use(express.json());

let db;
let notesCollection;

async function connectDB() {
  try {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    notesCollection = db.collection('notes');
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
}

connectDB();

// POST: Add Note
app.post('/notes', async (req, res) => {
  try {
    const { title, subject, description } = req.body;
    const newNote = {
      title,
      subject,
      description,
      created_date: new Date().toISOString().split('T')[0]
    };
    const result = await notesCollection.insertOne(newNote);
    res.json({ ...newNote, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: View All Notes
app.get('/notes', async (req, res) => {
  try {
    const notes = await notesCollection.find({}).toArray();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update Note
app.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await notesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, description } }
    );
    res.json({ message: 'Note updated', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove Note
app.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await notesCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Note deleted', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
