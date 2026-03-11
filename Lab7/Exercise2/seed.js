const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'bookstore_manager';

async function seedDB() {
  const client = await MongoClient.connect(url);
  const db = client.db(dbName);
  const collection = db.collection('books');

  const books = [
    { title: "JavaScript Essentials", author: "John Smith", category: "Programming", price: 450, rating: 4.5, year: 2023 },
    { title: "MongoDB Basics", author: "Jane Doe", category: "Database", price: 550, rating: 4.2, year: 2024 },
    { title: "Node.js Web Development", author: "David Herron", category: "Programming", price: 480, rating: 4.4, year: 2023 },
    { title: "React Native in Action", author: "Nader Dabit", category: "Mobile", price: 650, rating: 4.7, year: 2022 },
    { title: "Clean Code", author: "Robert C. Martin", category: "Software Engineering", price: 750, rating: 4.9, year: 2008 },
    { title: "The Pragmatic Programmer", author: "Andrew Hunt", category: "Software Engineering", price: 720, rating: 4.8, year: 1999 },
    { title: "Design Patterns", author: "Erich Gamma", category: "Software Engineering", price: 850, rating: 4.7, year: 1994 },
    { title: "Fullstack React", author: "Anthony Accomazzo", category: "Web Development", price: 600, rating: 4.6, year: 2022 },
    { title: "Learning Python", author: "Mark Lutz", category: "Programming", price: 580, rating: 4.3, year: 2021 },
    { title: "Eloquent JavaScript", author: "Marijn Haverbeke", category: "Programming", price: 400, rating: 4.8, year: 2018 },
    { title: "Mastering TypeScript", author: "Nathan Rozentals", category: "Programming", price: 520, rating: 4.6, year: 2021 },
    { title: "The Road to React", author: "Robin Wieruch", category: "Web Development", price: 350, rating: 4.8, year: 2022 },
    { title: "Database Systems", author: "Abraham Silberschatz", category: "Database", price: 900, rating: 4.5, year: 2019 },
    { title: "Flutter for Beginners", author: "Alessandro Biessek", category: "Mobile", price: 420, rating: 4.1, year: 2023 },
    { title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "Software Engineering", price: 1200, rating: 4.9, year: 2009 },
    { title: "Vue.js 3 Cookbook", author: "Heitor Ramon", category: "Web Development", price: 540, rating: 4.3, year: 2021 },
    { title: "Python Crash Course", author: "Eric Matthes", category: "Programming", price: 470, rating: 4.8, year: 2019 },
    { title: "SQL Performance Explained", author: "Markus Winand", category: "Database", price: 380, rating: 4.6, year: 2012 },
    { title: "Mobile App Development", author: "Jeff McWherter", category: "Mobile", price: 610, rating: 3.9, year: 2012 },
    { title: "Refactoring", author: "Martin Fowler", category: "Software Engineering", price: 800, rating: 4.8, year: 2018 }
  ];

  await collection.deleteMany({});
  await collection.insertMany(books);

  console.log('Seeded 20 books successfully into bookstore_manager database');
  await client.close();
}

seedDB();
