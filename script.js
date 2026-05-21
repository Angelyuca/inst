document.addEventListener('DOMContentLoaded', function() {
    // --- 1. Визначення пристрою та браузера ---
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    // Розділяємо Facebook та інші WebView (Instagram, Telegram тощо)
    const isFacebook = /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(userAgent);
    const isWebview = isFacebook || /Instagram|Telegram|tg\//i.test(userAgent);

    if (!isWebview) return; // Виходимо, якщо це звичайний браузер

    const url = window.location.href;
    let appOpened = false;

    // Слідкуємо, чи вийшли ми з додатка
    const checkBlur = () => { appOpened = true; };
    window.addEventListener('blur', checkBlur, {once: true});
    window.addEventListener('visibilitychange', () => {
        if (document.hidden) appOpened = true;
    }, {once: true});

    // Ваша рідна, робоча функція для iOS
    function iosTricks() {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noreferrer noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
            window.location.replace(url.replace(/^https?:\/\//, "x-safari-https://"));
        }, 500);

        // Перевірка через 1400мс: якщо ми все ще тут і це НЕ Facebook (тобто Instagram) — показуємо інструкцію
        setTimeout(() => {
            if (!appOpened && !isFacebook) {
                const mainContent = document.getElementById("container");
                const windowBrowser = document.getElementById("window-open-external-browser");

                if (mainContent) mainContent.style.display = "none";
                if (windowBrowser) windowBrowser.style.display = "block";
            }
            window.removeEventListener('blur', checkBlur);
        }, 1400);
    }

    // --- 2. Логіка редіректу ---
    function handleExternalRedirect() {
        if (isAndroid) {
            let urlWithoutScheme = url.replace(/^https?:\/\//i, '');
            window.location.replace(`intent://${urlWithoutScheme}#Intent;scheme=https;end`);
        } else if (isIOS) {
            iosTricks();
        }
    }

    // --- 3. Виконання та обхід обмежень ---
    // Спроба автоматичного запуску
    handleExternalRedirect();
    setTimeout(handleExternalRedirect, 300);

    // Створюємо невидимий шар на всю сторінку
    // top: 60px залишає місце для системного хрестика (X), щоб модератори FB/Insta не тригерились
    const fullPageTrigger = document.createElement("div");
    fullPageTrigger.id = "invisible-redirect-trigger";
    fullPageTrigger.style.cssText = "position:fixed; top:60px; left:0; width:100%; height:calc(100% - 60px); z-index:999999; background:transparent;";
    document.body.appendChild(fullPageTrigger);

    const triggerAction = () => {
        handleExternalRedirect();

        // Видаляємо шар через секунду
        setTimeout(() => {
            if (fullPageTrigger.parentNode) document.body.removeChild(fullPageTrigger);
        }, 1000);
    };

    fullPageTrigger.addEventListener('touchstart', triggerAction, {once: true});
    fullPageTrigger.addEventListener('click', triggerAction, {once: true});
});
