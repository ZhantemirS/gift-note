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
const noteInput = document.getElementById('noteInput');
const notesContainer = document.getElementById('notesContainer');
const submitBtn = document.getElementById('submitBtn');

// Уникальный идентификатор устройства
function getDeviceId() {
    return btoa(navigator.userAgent + screen.width + screen.height);
}

// Загрузка сохраненных данных пользователя
function loadUserData() {
    const deviceId = getDeviceId();
    const savedData = localStorage.getItem(`user_${deviceId}`);
    
    if (savedData) {
        const userData = JSON.parse(savedData);
        userNameInput.value = userData.username || '';
        
        if (userData.avatarUrl) {
            previewAvatar.src = userData.avatarUrl;
            previewAvatar.style.display = 'block';
            uploadText.textContent = '✅ Используется сохраненное фото';
            // Сохраняем URL в скрытое поле
            document.getElementById('userAvatarUrl').value = userData.avatarUrl;
        }
    }
}

// Сохранение данных пользователя
function saveUserData(username, avatarUrl) {
    const deviceId = getDeviceId();
    const userData = {
        username: username,
        avatarUrl: avatarUrl,
        timestamp: Date.now()
    };
    localStorage.setItem(`user_${deviceId}`, JSON.stringify(userData));
}

// Предварительный просмотр аватарки
avatarUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Проверяем размер файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Фото слишком большое! Максимум 5MB.');
            avatarUpload.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewAvatar.src = e.target.result;
            previewAvatar.style.display = 'block';
            uploadText.textContent = '✅ Фото готово к загрузке!';
        }
        reader.readAsDataURL(file);
    }
});

// Функция сжатия изображения
function compressImage(file, quality = 0.7) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Ограничиваем размер до максимум 600px
            let { width, height } = img;
            const maxSize = 600;
            
            if (width > height && width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            } else if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Показываем загрузку при старте
notesContainer.innerHTML = '<div class="loading">Загрузка записок... <span class="heart">💕</span></div>';

// Загружаем сохраненные данные при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
});

// Отправка записки
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userName = userNameInput.value.trim();
    const noteText = noteInput.value.trim();
    const avatarFile = avatarUpload.files[0];
    const savedAvatarUrl = document.getElementById('userAvatarUrl').value;
    
    if (!userName || !noteText) {
        alert('Пожалуйста, заполни ник и текст записки!');
        return;
    }
    
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '📤 Отправка...';
    
    try {
        let avatarUrl = savedAvatarUrl;
        const deviceId = getDeviceId();
        const savedData = localStorage.getItem(`user_${deviceId}`);
        const userData = savedData ? JSON.parse(savedData) : null;
        
        // Проверяем, нужно ли загружать новое фото
        const shouldUploadNewAvatar = avatarFile || 
            !savedAvatarUrl || 
            (userData && userData.username !== userName);
        
        if (shouldUploadNewAvatar && avatarFile) {
            uploadText.textContent = '📤 Сжатие и загрузка фото...';
            
            // Сжимаем фото
            const compressedFile = await compressImage(avatarFile, 0.7);
            
            // Создаем уникальное имя файла
            const fileName = `avatars/${deviceId}_${Date.now()}.jpg`;
            const storageRef = storage.ref();
            const avatarRef = storageRef.child(fileName);
            
            // Загружаем фото
            await avatarRef.put(compressedFile);
            
            // Получаем URL фото
            avatarUrl = await avatarRef.getDownloadURL();
        }
        
        // Сохраняем данные пользователя
        saveUserData(userName, avatarUrl);
        
        // Сохраняем URL в скрытое поле для следующего использования
        document.getElementById('userAvatarUrl').value = avatarUrl;
        
        // Сохраняем записку в Firestore
        await db.collection('notes').add({
            username: userName,
            avatarUrl: avatarUrl,
            content: noteText,
            deviceId: deviceId, // Для отладки
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Очищаем только текст записки
        noteInput.value = '';
        noteInput.focus();
        
        // Обновляем текст загрузки
        if (avatarUrl) {
            uploadText.textContent = '✅ Фото сохранено!';
        }
        
    } catch (error) {
        console.error('Ошибка при добавлении записки:', error);
        alert('Произошла ошибка. Попробуйте еще раз!');
    } finally {
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }, 1000);
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
            
            // Аватарка
            let avatarHtml = '👤';
            if (note.avatarUrl) {
                avatarHtml = `<img class="note-avatar" src="${note.avatarUrl}" alt="${note.username}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='👤'">`;
            }
            
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