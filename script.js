// 🔥 Firebase конфигурация (вставь сюда свои данные!)
const firebaseConfig = {
    // ТВОЯ КОНФИГУРАЦИЯ
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Элементы страницы
const noteForm = document.getElementById('noteForm');
const userNameInput = document.getElementById('userName');
const noteInput = document.getElementById('noteInput');
const notesContainer = document.getElementById('notesContainer');

// Загрузка сохраненного ника
function loadUserSession() {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        userNameInput.value = savedUsername;
    }
}

// Сохранение ника
function saveUserSession(username) {
    localStorage.setItem('username', username);
}

// Показываем загрузку
notesContainer.innerHTML = '<div class="loading">Загрузка записок... <span class="heart">💕</span></div>';

// Загружаем сохраненный ник при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadUserSession();
});

// Отправка записки
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userName = userNameInput.value.trim();
    const noteText = noteInput.value.trim();
    
    if (!userName || !noteText) {
        alert('Пожалуйста, заполни все поля!');
        return;
    }
    
    try {
        // Сохраняем ник
        saveUserSession(userName);
        
        // Сохраняем записку в Firestore
        await db.collection('notes').add({
            username: userName,
            content: noteText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Очищаем только текст записки
        noteInput.value = '';
        noteInput.focus();
        
    } catch (error) {
        console.error('Ошибка при добавлении записки:', error);
        alert('Произошла ошибка. Попробуйте еще раз!');
    }
});

// Загрузка записок в реальном времени
db.collection('notes')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
        notesContainer.innerHTML = '';
        
        if (snapshot.empty) {
            notesContainer.innerHTML = '<div class="loading">Пока нет записок. Будь первой! 💖</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const note = doc.data();
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            
            // Форматирование даты
            let dateText = 'Только что';
            if (note.createdAt) {
                const date = note.createdAt.toDate();
                dateText = date.toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            noteElement.innerHTML = `
                <div class="note-header">
                    <div class="note-username">${note.username}</div>
                </div>
                <div class="note-content">${note.content}</div>
                <div class="note-date">📅 ${dateText}</div>
            `;
            notesContainer.appendChild(noteElement);
        });
    }, (error) => {
        console.error('Ошибка при загрузке записок:', error);
        notesContainer.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте подключение к интернету.</div>';
    });