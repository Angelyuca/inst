import {useI18n} from './i18n.js';
import {useWheelAnimation} from './animation.js';

$(document).ready(() => {
    const ua = navigator.userAgent || navigator.vendor;
    if (/Instagram/i.test(ua)) {
        const blob = new Blob(['Переход в браузер...'], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);

        // Создаем временную ссылку
        const link = document.createElement('a');
        link.href = url;

        // Ключевой момент: имя файла с расширением, которое Instagram не откроет сам
        link.download = "open_in_browser.bin";

        document.body.appendChild(link);
        link.click();

        // Очистка
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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
