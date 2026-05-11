import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {

    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isInstagram = /Instagram|FBAN|FBAV/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    const modal = document.getElementById("iosBrowserModal");

// Показываем модалку для iOS
    if (isInstagram && isIOS) {
        setTimeout(() => {
            modal.showModal();
        }, 1000);
    }

// Универсальная функция Deep Link перехода
    function openExternal() {
        const rawUrl = window.location.href.replace(/^https?:\/\//, "");

        if (isAndroid) {
            // Android: Вызывает системное окно выбора (твой скриншот)
            window.location.href = `intent://${rawUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
        }
        else if (isIOS) {
            // iOS: Пытаемся по очереди открыть в установленных браузерах
            // 1. Пробуем Chrome
            window.location.href = `googlechromes://${rawUrl}`;

            // 2. Если Chrome нет, через 500мс пробуем Firefox
            setTimeout(() => {
                window.location.href = `firefox://open-url?url=https://${rawUrl}`;
            }, 500);

            // 3. Если ничего не сработало, через 1500мс показываем подсказку про Safari
            setTimeout(() => {
                alert("Если браузер не открылся, нажмите '...' в углу и выберите 'Открыть в Safari'");
            }, 1500);
        }
    }

// Привязываем к твоей кнопке openBtn
    document.getElementById("openBtn").onclick = (e) => {
        e.preventDefault();
        openExternal();
    };

// Привязываем к кнопке в модалке
    document.getElementById("confirmExit").onclick = () => {
        modal.close();
        openExternal();
    };

    document.getElementById("closeModal").onclick = () => modal.close();

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
