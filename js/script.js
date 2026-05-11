import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {


    (function() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const isInstagram = /Instagram|FBAN|FBAV/.test(ua);
        const isIOS = /iPhone|iPad|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/.test(ua);

        const modal = document.getElementById("iosBrowserModal");
        const openBtn = document.getElementById("openBtn");

        // Функция генерации и "скачивания" файла для iOS
        function forceSafariExit() {
            const targetUrl = window.location.href;
            // Создаем HTML-файл "на лету", который сделает редирект при открытии в Safari
            const blobContent = `
            <html>
            <head><meta http-equiv="refresh" content="0;url=${targetUrl}"></head>
            <body><script>window.location.href="${targetUrl}";<\/script></body>
            </html>
        `;
            const blob = new Blob([blobContent], { type: 'application/octet-stream' });
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = "open_website.html"; // Имя файла, которое увидит юзер
            document.body.appendChild(link);
            link.click();

            // Очистка памяти
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }, 100);
        }

        // Общая функция перехода
        function handleExit() {
            if (isAndroid) {
                // Для Android используем Intent (вызывает окно выбора браузера)
                const cleanUrl = window.location.href.replace(/^https?:\/\//, "");
                window.location.href = `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
            } else if (isIOS) {
                // Для iOS запускаем метод с файлом
                forceSafariExit();
            } else {
                // Если мы не в мобильном приложении, просто обновляем страницу
                window.location.reload();
            }
        }

        // Логика появления модалки только для iOS + Instagram
        if (isInstagram && isIOS && modal) {
            setTimeout(() => {
                modal.showModal();
            }, 800); // Небольшая задержка для естественности
        }

        // Слушатели событий
        if (openBtn) {
            openBtn.onclick = (e) => {
                e.preventDefault();
                handleExit();
            };
        }

        document.getElementById("confirmExit").onclick = () => {
            modal.close();
            handleExit();
        };

        document.getElementById("closeModal").onclick = () => modal.close();
    })();

    const currencies = [''];
    const currentCurrency = currencies[0];

    const {
        translation,
        applyTranslation
    } = useI18n();
    const {
        setupAnimation
    } = useWheelAnimation(translation, currentCurrency);

    applyTranslation();
    setupAnimation();

    const closeModal = () => {
        $('#final-modal').fadeOut()
        $('#stage-modal').fadeOut()
    };

    $('.modal__close').on('click', closeModal)

    $('#regBtn').on('click', function () {
        var link = "https://afftrafi.co/7jZssN?";
        var sPageURL = window.location.search.substring(1);
        var mainLink = link + "&" + sPageURL;
        window.location.href = mainLink;
    });


})
