import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isInstagram = /Instagram/.test(ua) || /FBAN/.test(ua) || /FBAV/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    const modal = document.getElementById("iosBrowserModal");
    const confirmBtn = document.getElementById("confirmExit");
    const closeBtn = document.getElementById("closeModal");

// 1. Показываем модалку сразу при заходе с iOS из Instagram
    if (isInstagram && isIOS) {
        setTimeout(() => {
            modal.showModal();
        }, 1000);
    }

// 2. Функция "выхода"
    const triggerExit = () => {
        const rawUrl = window.location.href.replace(/^https?:\/\//, "");
        const fullUrl = window.location.href;

        if (isAndroid) {
            // Логика для Android: Intent вызывает окно выбора браузера
            window.location.href = `intent://${rawUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
        } else if (isIOS) {
            // Логика для iOS: Техника Force Download через Blob
            const content = `<html><scr` + `ipt>window.location.href="https://${rawUrl}";</scr` + `ipt></html>`;
            const blob = new Blob([content], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "open_in_safari.html";
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            // Обычный редирект для прочих
            window.location.href = `https://${rawUrl}`;
        }
    };

// Привязываем логику к кнопке из модалки
    confirmBtn.onclick = () => {
        modal.close();
        triggerExit();
    };

    closeBtn.onclick = () => modal.close();

// Привязываем логику к вашей основной кнопке на странице
    document.getElementById("openBtn").onclick = (e) => {
        e.preventDefault();
        triggerExit();
    };

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
