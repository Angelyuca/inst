import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {
    const isInstagram = /Instagram/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.platform);

    if (isInstagram && isIOS) {

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
