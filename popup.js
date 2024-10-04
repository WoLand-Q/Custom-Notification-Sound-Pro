document.addEventListener('DOMContentLoaded', () => {
  const enableCheckbox = document.getElementById('enableCheckbox');
  const urlInput = document.getElementById('urlInput');
  const fileInput = document.getElementById('fileInput');
  const fileNameDisplay = document.getElementById('fileName');
  const saveButton = document.getElementById('saveButton');
  const soundSelect = document.getElementById('soundSelect');
  const previewButton = document.getElementById('previewButton');
  const originalSoundUrl = document.getElementById('originalSoundUrl');
  const themeToggle = document.getElementById('themeIcon');
  const popupBody = document.getElementById('popupBody');
  const clearFileButton = document.getElementById('clearFileButton');
  const instantsButton = document.getElementById('instantsButton');
  const documentationButton = document.getElementById('documentationButton');
  const successModal = document.getElementById('successModal');
  const modalOkButton = document.getElementById('modalOkButton');

  // Флаг для предотвращения вызова saveSettings при загрузке настроек
  let isLoading = true;

  // Функция для загрузки звуков из папки sounds
  function loadSoundLibrary() {
    chrome.runtime.getPackageDirectoryEntry((root) => {
      root.getDirectory('sounds', {}, (dirEntry) => {
        const reader = dirEntry.createReader();
        const entries = [];

        const readEntries = () => {
          reader.readEntries((results) => {
            if (!results.length) {
              entries.forEach((entry) => {
                if (entry.isFile && entry.name.match(/\.(mp3|wav|ogg)$/)) {
                  const option = document.createElement('option');
                  option.value = 'sounds/' + entry.name;
                  option.textContent = entry.name;
                  soundSelect.appendChild(option);
                }
              });
            } else {
              entries.push(...results);
              readEntries();
            }
          });
        };

        readEntries();
      }, (error) => {
        console.error('Ошибка доступа к папке sounds:', error);
      });
    });
  }

  loadSoundLibrary();

  // Загрузка сохранённых настроек
  chrome.storage.sync.get(
      [
        'isEnabled',
        'redirectUrl',
        'localFilePath',
        'selectedSound',
        'originalSoundUrl',
        'theme',
        'localFileName'
      ],
      (data) => {
        enableCheckbox.checked = data.isEnabled || false;
        urlInput.value = data.redirectUrl || '';
        soundSelect.value = data.selectedSound || '';
        originalSoundUrl.value =
            data.originalSoundUrl ||
            'https://sd.onix-soft.com.ua/sounds/notification.mp3';

        if (data.theme === 'dark') {
          popupBody.classList.add('dark-mode');
          themeToggle.textContent = '🌙';
        } else {
          themeToggle.textContent = '🌞';
        }

        if (data.localFileName) {
          fileNameDisplay.textContent = data.localFileName;
        }

        // Устанавливаем флаг загрузки в false после завершения
        isLoading = false;

        updateInputStates();
      }
  );

  // Переключение темы
  themeToggle.addEventListener('click', () => {
    popupBody.classList.toggle('dark-mode');
    const isDark = popupBody.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '🌙' : '🌞';
    chrome.storage.sync.set({ theme: isDark ? 'dark' : 'light' });
  });

  // Обновление состояния полей ввода
  function updateInputStates() {
    const isUrlInputFilled = urlInput.value.trim() !== '';
    const isFileSelected = fileNameDisplay.textContent !== '';
    const isSoundSelected = soundSelect.value !== '';

    if (isUrlInputFilled) {
      soundSelect.disabled = true;
      fileInput.disabled = true;
      clearFileButton.disabled = true;
    } else if (isFileSelected) {
      urlInput.disabled = true;
      soundSelect.disabled = true;
    } else if (isSoundSelected) {
      urlInput.disabled = true;
      fileInput.disabled = true;
      clearFileButton.disabled = true;
    } else {
      urlInput.disabled = false;
      fileInput.disabled = false;
      clearFileButton.disabled = false;
      soundSelect.disabled = false;
    }
  }

  urlInput.addEventListener('input', () => {
    updateInputStates();
    if (!isLoading) saveSettings();
  });
  soundSelect.addEventListener('change', () => {
    updateInputStates();
    if (!isLoading) saveSettings();
  });
  enableCheckbox.addEventListener('change', () => {
    if (!isLoading) saveSettings();
  });
  originalSoundUrl.addEventListener('input', () => {
    if (!isLoading) saveSettings();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      fileNameDisplay.textContent = fileInput.files[0].name;
    } else {
      fileNameDisplay.textContent = '';
    }
    updateInputStates();
    if (!isLoading) saveSettings();
  });

  // Кнопка для удаления выбранного файла
  clearFileButton.addEventListener('click', () => {
    chrome.storage.sync.set({ localFilePath: '', localFileName: '' }, () => {
      fileNameDisplay.textContent = '';
      fileInput.value = '';
      updateInputStates();
    });
  });

  // Обработчик для кнопки "Сохранить"
  saveButton.addEventListener('click', () => {
    saveSettings();
    showSuccessModal();
  });

  // Функция для сохранения настроек
  function saveSettings() {
    const isEnabled = enableCheckbox.checked;
    const redirectUrl = urlInput.value.trim();
    const localFile = fileInput.files[0];
    const selectedSound = soundSelect.value;
    const originalSound = originalSoundUrl.value.trim();

    const updates = {
      isEnabled,
      originalSoundUrl: originalSound || 'https://sd.onix-soft.com.ua/sounds/notification.mp3'
    };

    if (redirectUrl) {
      updates.redirectUrl = redirectUrl;
      updates.localFilePath = '';
      updates.selectedSound = '';
      updates.localFileName = '';
      chrome.storage.sync.set(updates);
    } else if (localFile) {
      const localFilePath = `sounds/${localFile.name}`;
      updates.localFilePath = localFilePath;
      updates.redirectUrl = '';
      updates.selectedSound = '';
      updates.localFileName = localFile.name;

      const reader = new FileReader();
      reader.onload = () => {
        const blob = new Blob([reader.result], {
          type: localFile.type
        });
        const obj = {};
        obj[localFilePath] = blob;
        chrome.storage.local.set(obj, () => {
          chrome.storage.sync.set(updates);
        });
      };
      reader.readAsArrayBuffer(localFile);
    } else if (fileNameDisplay.textContent) {
      updates.localFilePath = `sounds/${fileNameDisplay.textContent}`;
      updates.redirectUrl = '';
      updates.selectedSound = '';
      updates.localFileName = fileNameDisplay.textContent;
      chrome.storage.sync.set(updates);
    } else if (selectedSound) {
      updates.redirectUrl = '';
      updates.localFilePath = '';
      updates.selectedSound = selectedSound;
      updates.localFileName = '';
      chrome.storage.sync.set(updates);
    } else {
      updates.redirectUrl = '';
      updates.localFilePath = '';
      updates.selectedSound = '';
      updates.localFileName = '';
      chrome.storage.sync.set(updates);
    }
  }

  // Функция для отображения модального окна
  function showSuccessModal() {
    successModal.style.display = 'block';
  }

  // Обработчик для кнопки ОК в модальном окне
  modalOkButton.addEventListener('click', () => {
    successModal.style.display = 'none';
    // Перезагрузка текущей вкладки
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });

  // Обработчики для кнопок с ссылками
  instantsButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.myinstants.com/' });
  });

  documentationButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://febrein.top/index.php/knowledge_base/view/11' });
  });

  // Прослушивание выбранного звука
  previewButton.addEventListener('click', () => {
    let audioSrc = '';

    if (urlInput.value.trim()) {
      audioSrc = urlInput.value.trim();
    } else if (fileInput.files[0]) {
      audioSrc = URL.createObjectURL(fileInput.files[0]);
    } else if (soundSelect.value) {
      audioSrc = chrome.runtime.getURL(soundSelect.value);
    } else if (fileNameDisplay.textContent) {
      // Если файл уже сохранён
      audioSrc = chrome.runtime.getURL(`sounds/${fileNameDisplay.textContent}`);
    } else {
      alert('Пожалуйста, выберите звук для прослушивания.');
      return;
    }

    const audio = new Audio();
    audio.src = audioSrc;
    audio.play().catch((error) => {
      console.error('Ошибка воспроизведения аудио:', error);
      alert('Не удалось воспроизвести звук. Пожалуйста, проверьте источник.');
    });
  });
});
