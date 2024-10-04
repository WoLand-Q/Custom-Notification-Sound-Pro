chrome.storage.sync.get(['volume', 'isEnabled'], (data) => {
    if (data.isEnabled && data.volume !== undefined) {
        const volume = parseFloat(data.volume);

        const adjustAudioVolume = () => {
            const audios = document.querySelectorAll('audio');
            audios.forEach((audio) => {
                audio.volume = volume;
            });
        };

        adjustAudioVolume();

        const observer = new MutationObserver(adjustAudioVolume);
        observer.observe(document.body, { childList: true, subtree: true });

        // Также отслеживаем добавление новых аудио элементов
        document.addEventListener(
            'play',
            (e) => {
                if (e.target.tagName === 'AUDIO') {
                    e.target.volume = volume;
                }
            },
            true
        );

        // Слушаем изменения громкости в хранилище
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes.volume) {
                const newVolume = parseFloat(changes.volume.newValue);
                const audios = document.querySelectorAll('audio');
                audios.forEach((audio) => {
                    audio.volume = newVolume;
                });
            }
        });
    }
});
