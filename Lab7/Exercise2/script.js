const API_URL = 'http://localhost:3001/books';

let currentPage = 1;
const booksList = document.getElementById('books-list');
const resultsTitle = document.getElementById('results-title');
const loadMoreBtn = document.getElementById('load-more-btn');

// Load books with pagination (Load More)
async function loadBooks(page = 1, append = false) {
    currentPage = page;
    try {
        const response = await fetch(`${API_URL}?page=${page}`);
        const books = await response.json();
        renderBooks(books, append);
        updateLoadMore(books.length);
        if (!append) resultsTitle.innerText = 'All Books';
    } catch (err) {
        console.error('Error loading books:', err);
    }
}

async function loadMore() {
    loadBooks(currentPage + 1, true);
}

// Search by title
async function searchBooks() {
    const title = document.getElementById('search-input').value;
    if (!title) {
        loadBooks(1, false);
        return;
    }
    try {
        const response = await fetch(`${API_URL}/search?title=${title}`);
        const books = await response.json();
        renderBooks(books, false);
        resultsTitle.innerText = `Search Results for "${title}"`;
        hideLoadMore();
    } catch (err) {
        console.error('Error searching books:', err);
    }
}

// Filter by category
async function filterByCategory() {
    const category = document.getElementById('category-filter').value;
    if (!category) {
        loadBooks(1, false);
        return;
    }
    try {
        const response = await fetch(`${API_URL}/category/${category}`);
        const books = await response.json();
        renderBooks(books, false);
        resultsTitle.innerText = `${category} Books`;
        hideLoadMore();
    } catch (err) {
        console.error('Error filtering books:', err);
    }
}

// Sort books
async function sortBooks() {
    const sortType = document.getElementById('sort-filter').value;
    if (!sortType) {
        loadBooks(1, false);
        return;
    }
    try {
        const response = await fetch(`${API_URL}/sort/${sortType}`);
        const books = await response.json();
        renderBooks(books, false);
        resultsTitle.innerText = `Books sorted by ${sortType}`;
        hideLoadMore();
    } catch (err) {
        console.error('Error sorting books:', err);
    }
}

// Top Rated
async function getTopRated() {
    try {
        const response = await fetch(`${API_URL}/top`);
        const books = await response.json();
        renderBooks(books, false);
        resultsTitle.innerText = 'Top Rated Books (4.0+)';
        hideLoadMore();
    } catch (err) {
        console.error('Error getting top rated books:', err);
    }
}

function renderBooks(books, append = false) {
    if (!append) {
        booksList.innerHTML = '';
    }
    
    if (books.length === 0 && !append) {
        booksList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #9aa0a6;">No books found.</p>';
        return;
    }
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <h3>${book.title}</h3>
            <div class="author">By ${book.author}</div>
            <div class="category">${book.category}</div>
            <div class="price">Rs. ${book.price}</div>
            <div class="rating">★ ${book.rating} / 5.0</div>
        `;
        booksList.appendChild(bookCard);
    });
}

function updateLoadMore(count) {
    loadMoreBtn.style.display = count < 5 ? 'none' : 'block';
}

function hideLoadMore() {
    loadMoreBtn.style.display = 'none';
}

// Initial Load
loadBooks(1);
