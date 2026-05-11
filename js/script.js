import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isInstagram = /Instagram|FBAN|FBAV/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);


    const url = window.location.href.replace(/^https?:\/\//, "");

    if (isAndroid) {
        window.location.href = window.location.href = "intent://" + url + "#Intent;scheme=https;action=android.intent.action.VIEW;end";
    } else if (isInstagram && isIOS) {
        const modal = document.getElementById("iosBrowserModal");
        setTimeout(() => {
            modal.showModal();
        }, 1000);
    }

    const modal = document.getElementById("iosBrowserModal");
    const confirmBtn = document.getElementById("confirmExit");
    const closeBtn = document.getElementById("closeModal");

    confirmBtn.onclick = () => {
        modal.close();
        triggerExit();
    };

    closeBtn.onclick = () => modal.close();

    const triggerExit = () => {
        window.location.href = "googlechromes://" + url;

        setTimeout(() => {
            window.location.href = "firefox://open-url?url=https://" + url;
        }, 500);

        setTimeout(() => {
            alert("Если браузер не открылся, нажмите '...' в углу и выберите 'Открыть в Safari'");
        }, 1500);
    }



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
