const API_URL = 'http://localhost:3000/notes';

// DOM Elements
const notesList = document.getElementById('notes-list');
const noteIdInput = document.getElementById('note-id');
const titleInput = document.getElementById('title');
const subjectInput = document.getElementById('subject');
const descriptionInput = document.getElementById('description');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

// Fetch and display notes
async function loadNotes() {
    try {
        const response = await fetch(API_URL);
        const notes = await response.json();
        renderNotes(notes);
    } catch (err) {
        console.error('Error loading notes:', err);
    }
}

function renderNotes(notes) {
    notesList.innerHTML = '';
    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <h3>${note.title}</h3>
            <div class="subject">${note.subject}</div>
            <p>${note.description}</p>
            <div class="footer">
                <span>${note.created_date}</span>
                <div class="note-actions">
                    <button class="edit-btn" onclick="editNote('${note._id}', '${note.title}', '${note.subject}', '${note.description.replace(/'/g, "\\'")}')">Edit</button>
                    <button class="delete-btn" onclick="deleteNote('${note._id}')">Delete</button>
                </div>
            </div>
        `;
        notesList.appendChild(noteCard);
    });
}

// Add or Update note
async function saveNote() {
    const id = noteIdInput.value;
    const noteData = {
        title: titleInput.value,
        subject: subjectInput.value,
        description: descriptionInput.value
    };

    if (!noteData.title || !noteData.subject || !noteData.description) {
        alert('Please fill in all fields');
        return;
    }

    try {
        let response;
        if (id) {
            // Update
            response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: noteData.title, description: noteData.description })
            });
        } else {
            // Create
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
        }

        if (response.ok) {
            clearForm();
            loadNotes();
        }
    } catch (err) {
        console.error('Error saving note:', err);
    }
}

// Delete note
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadNotes();
        }
    } catch (err) {
        console.error('Error deleting note:', err);
    }
}

// Edit mode
function editNote(id, title, subject, description) {
    noteIdInput.value = id;
    titleInput.value = title;
    subjectInput.value = subject;
    subjectInput.disabled = true;
    descriptionInput.value = description;
    
    formTitle.innerText = 'Edit Note';
    saveBtn.innerText = 'Update Note';
    cancelBtn.style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    clearForm();
}

function clearForm() {
    noteIdInput.value = '';
    titleInput.value = '';
    subjectInput.value = '';
    subjectInput.disabled = false;
    descriptionInput.value = '';
    
    formTitle.innerText = 'Add New Note';
    saveBtn.innerText = 'Add Note';
    cancelBtn.style.display = 'none';
}

// Initial Load
loadNotes();
