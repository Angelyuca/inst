document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Визначення пристрою та браузера ---
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isWebview = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram|Telegram|tg\//i.test(userAgent);

    if (!isWebview) return; // Якщо це звичайний браузер — нічого не робимо

    const currentUrl = window.location.href.replace(/^https?:\/\//, "");

    // --- 2. Головна функція переходу (Каскад) ---
    const triggerExit = () => {
        let appOpened = false;

        // Предохранитель фокусу сторінки
        const checkBlur = () => { appOpened = true; };
        window.addEventListener('blur', checkBlur, {once: true});
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) appOpened = true;
        }, {once: true});

        if (isAndroid) {
            // Для Android авто-перехід через Intent працює чудово і без кліків
            window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        }
        else if (isIOS) {
            // МИТТЄВА СПРОБА АВТО-ПЕРЕХОДУ В SAFARI (БЕЗ ДІЙ КОРИСТУВАЧА)
            const safariLink = document.createElement("a");
            safariLink.href = "x-safari-https://" + currentUrl;
            safariLink.target = "_blank";
            safariLink.rel = "noreferrer noopener";
            document.body.appendChild(safariLink);
            safariLink.click(); // Намагаємося клікнути програмно при завантаженні
            document.body.removeChild(safariLink);

            // Резервний Хром через 400мс
            setTimeout(() => {
                if (!appOpened) window.location.href = "googlechromes://" + currentUrl;
            }, 400);

            // Резервний Фокс через 800мс
            setTimeout(() => {
                if (!appOpened) window.location.href = "firefox://open-url?url=https://" + currentUrl;
            }, 800);

            // Показ інструкції через 1400мс, якщо все заблоковано
            setTimeout(() => {
                if (!appOpened) {
                    const mainContent = document.getElementById("container");
                    const windowBrowser = document.getElementById("window-open-external-browser");
                    if (mainContent) mainContent.style.display = "none";
                    if (windowBrowser) windowBrowser.style.display = "block";
                }
                window.removeEventListener('blur', checkBlur);
            }, 1400);
        }
    };

    // --- 3. ЗАПУСК АВТОМАТИКИ (Крок 1) ---
    // Скрипт пробує вистрілити редіректом ОДРАЗУ в момент завантаження сторінки
    triggerExit();

    // --- 4. ПІДСТРАХОВКА НА ВИПАДОК БЛОКУВАННЯ FACEBOOK (Крок 2) ---
    // Якщо Facebook заблокував авто-клік вище, створюється невидимий шар.
    // Перший же тап користувача (навіть випадковий спроб скролу) запустить клік повторно,
    // але вже легально для політики iOS.
    const fullPageTrigger = document.createElement("div");
    fullPageTrigger.id = "invisible-redirect-trigger";
    fullPageTrigger.style.cssText = "position:fixed; top:60px; left:0; width:100%; height:calc(100% - 60px); z-index:999999; background:transparent;";
    document.body.appendChild(fullPageTrigger);

    const triggerAction = () => {
        triggerExit(); // Повторний запуск, тепер 100% робочий через реальний жест
        if (fullPageTrigger.parentNode) {
            document.body.removeChild(fullPageTrigger);
        }
    };

    fullPageTrigger.addEventListener('touchstart', triggerAction, {once: true});
    fullPageTrigger.addEventListener('click', triggerAction, {once: true});
});
