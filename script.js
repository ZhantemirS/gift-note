// Firebase конфигурация (создадим позже)
const firebaseConfig = {
  apiKey: "AIzaSyBB25BI8gQsUXihsLqiLN8gywYX4yxnFTg",
  authDomain: "notes-8741e.firebaseapp.com",
  projectId: "notes-8741e",
  storageBucket: "notes-8741e.firebasestorage.app",
  messagingSenderId: "424099145357",
  appId: "1:424099145357:web:d8b3bbd9540128afbd24c4"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Форма отправки
const noteForm = document.getElementById('noteForm');
const noteInput = document.getElementById('noteInput');
const notesContainer = document.getElementById('notesContainer');

// Отправка записки
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const noteText = noteInput.value.trim();
    if (noteText) {
        try {
            await db.collection('notes').add({
                content: noteText,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            noteInput.value = '';
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }
});

// Загрузка записок в реальном времени
db.collection('notes')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
        notesContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const note = doc.data();
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            
            const date = note.createdAt ? 
                new Date(note.createdAt.toDate()).toLocaleString('ru-RU') : 
                'Только что';
            
            noteElement.innerHTML = `
                <div>${note.content}</div>
                <div class="note-date">${date}</div>
            `;
            notesContainer.appendChild(noteElement);
        });
    });