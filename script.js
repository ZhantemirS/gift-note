// 🔥 Firebase конфигурация (вставь сюда свои данные!)
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
const storage = firebase.storage();

// Элементы страницы
const noteForm = document.getElementById('noteForm');
const userNameInput = document.getElementById('userName');
const avatarUpload = document.getElementById('avatarUpload');
const previewAvatar = document.getElementById('previewAvatar');
const uploadText = document.getElementById('uploadText');
const userAvatarUrlInput = document.getElementById('userAvatarUrl');
const noteInput = document.getElementById('noteInput');
const notesContainer = document.getElementById('notesContainer');
const submitBtn = document.getElementById('submitBtn');

// Предварительный просмотр аватарки
avatarUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewAvatar.src = e.target.result;
            previewAvatar.style.display = 'block';
            uploadText.textContent = '✅ Фото загружено!';
        }
        reader.readAsDataURL(file);
    }
});

// Показываем загрузку
notesContainer.innerHTML = '<div class="loading">Загрузка записок... <span class="heart">💕</span></div>';

// Отправка записки
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userName = userNameInput.value.trim();
    const noteText = noteInput.value.trim();
    const avatarFile = avatarUpload.files[0];
    
    if (!userName || !noteText) {
        alert('Пожалуйста, заполни ник и текст записки!');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '📤 Загрузка...';
    
    try {
        let avatarUrl = '';
        
        // Если есть фото, загружаем его
        if (avatarFile) {
            uploadText.textContent = '📤 Загрузка фото...';
            
            // Создаем уникальное имя файла
            const fileName = `avatars/${Date.now()}_${avatarFile.name}`;
            const storageRef = storage.ref();
            const avatarRef = storageRef.child(fileName);
            
            // Загружаем фото
            await avatarRef.put(avatarFile);
            
            // Получаем URL фото
            avatarUrl = await avatarRef.getDownloadURL();
        }
        
        // Сохраняем записку в Firestore
        await db.collection('notes').add({
            username: userName,
            avatarUrl: avatarUrl,
            content: noteText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Очищаем форму
        noteInput.value = '';
        userNameInput.value = '';
        avatarUpload.value = '';
        previewAvatar.style.display = 'none';
        uploadText.textContent = '📷 Загрузи фото профиля';
        noteInput.focus();
        
    } catch (error) {
        console.error('Ошибка при добавлении записки:', error);
        alert('Произошла ошибка. Попробуйте еще раз!');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '💌 Отправить записку';
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
            
            // Аватарка (если есть URL) или стандартная иконка
            const avatarHtml = note.avatarUrl ? 
                `<img class="note-avatar" src="${note.avatarUrl}" alt="Avatar" onerror="this.style.display='none';this.parentElement.innerHTML='👤'">` :
                '👤';
            
            noteElement.innerHTML = `
                <div class="note-header">
                    <div>${avatarHtml}</div>
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