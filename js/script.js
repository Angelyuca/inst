import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {
    const isInstagram = /Instagram/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.platform);

    if (isInstagram && isIOS) {
        const url = window.location.href
        window.location.href = url.replace('https://', 'ftp://');

        // Либо через создание невидимой ссылки с атрибутом download
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = 'true'; // На iOS это часто триггерит выход в Safari
        link.click();
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
