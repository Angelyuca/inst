import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {
    const isInstagram = /Instagram/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.platform);

    if (isInstagram && isIOS) {


    }

    document
        .getElementById("openBtn")
        .onclick = () => {

        const url = window.location.href.replace(/^https?:\/\//, "");

        // Пытаемся по очереди разные браузеры
        // 1. Chrome
        window.location.href = "googlechromes://" + url;

        // 2. Firefox (через 500мс, если первый не сработал)
        setTimeout(() => {
            window.location.href = "firefox://open-url?url=https://" + url;
        }, 500);

        // 3. Если всё мимо — показываем оверлей с инструкцией для Safari
        setTimeout(() => {
            alert('saf')
        }, 1500);

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
