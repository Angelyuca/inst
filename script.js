document.addEventListener('DOMContentLoaded', function() {
    // --- 1. Визначення пристрою та браузера ---
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    const isFacebook = /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(userAgent);
    const isInstagram = /Instagram/i.test(userAgent);
    const isWebview = isFacebook || isInstagram || /Telegram|tg\//i.test(userAgent);

    if (!isWebview) return; // Виходимо, якщо це звичайний браузер

    const url = window.location.href;
    const currentUrl = url.replace(/^https?:\/\//, "");

    // Елементи модалки (для Instagram)
    const modal = document.getElementById("iosBrowserModal");
    const confirmBtn = document.getElementById("confirmExit");
    const closeBtn = document.getElementById("closeModal");

    let appOpened = false;

    // Слідкуємо, чи вийшли ми з додатка
    const checkBlur = () => { appOpened = true; };
    window.addEventListener('blur', checkBlur, {once: true});
    window.addEventListener('visibilitychange', () => {
        if (document.hidden) appOpened = true;
    }, {once: true});

    // --- 2. Логіка виходу для iOS ---

    // Чистий редірект в Safari для Facebook (без модалок)
    function facebookSafariRedirect() {
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
    }

    // Каскадний перехід для Instagram (через Chrome/Firefox або показ інструкції)
    const triggerInstagramExit = () => {
        // 1. Пробуємо Chrome
        window.location.href = "googlechromes://" + currentUrl;

        // 2. Через 500мс перевіряємо, чи пішли звідси. Якщо ні — пробуємо Firefox
        setTimeout(() => {
            if (!appOpened) {
                window.location.href = "firefox://open-url?url=https://" + currentUrl;
            }
        }, 500);

        // 3. Фінальний крок (1200мс): якщо сторонні браузери не відкрились (стоїть лише Safari)
        setTimeout(() => {
            if (!appOpened) {
                if (modal) modal.close();
                const mainContent = document.getElementById("container");
                const windowBrowser = document.getElementById("window-open-external-browser");

                if (mainContent) mainContent.style.display = "none";
                if (windowBrowser) windowBrowser.style.display = "block";
            }
            window.removeEventListener('blur', checkBlur);
        }, 1200);
    };

    // --- 3. Керування інтерфейсом модалки ---
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (modal) modal.close();
            triggerInstagramExit();
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            if (modal) modal.close();
        };
    }

    // --- 4. Головний диспетчер перенаправлення ---
    function handleExternalRedirect() {
        if (isAndroid) {
            let urlWithoutScheme = url.replace(/^https?:\/\//i, '');
            window.location.replace(`intent://${urlWithoutScheme}#Intent;scheme=https;end`);
        }
        else if (isIOS) {
            if (isFacebook) {
                // У Facebook одразу б'ємо в Safari вашим робочим методом
                facebookSafariRedirect();
            } else if (isInstagram) {
                // В Instagram замість авто-виходу просто показуємо модалку
                if (modal && !modal.open) {
                    modal.showModal();
                }
            }
        }
    }

    // --- 5. Обхід обмежень через невидимий шар ---
    // Авто-спроба для Facebook / Android при завантаженні
    if (isAndroid || isFacebook) {
        handleExternalRedirect();
        setTimeout(handleExternalRedirect, 300);
    }

    // Невидимий шар (залишаємо зверху 60px під хрестик закриття)
    const fullPageTrigger = document.createElement("div");
    fullPageTrigger.id = "invisible-redirect-trigger";
    fullPageTrigger.style.cssText = "position:fixed; top:60px; left:0; width:100%; height:calc(100% - 60px); z-index:999999; background:transparent;";
    document.body.appendChild(fullPageTrigger);

    const triggerAction = () => {
        handleExternalRedirect();

        // Видаляємо шар, щоб не заважати користувачу натискати кнопки в модалці Instagram
        if (fullPageTrigger.parentNode) {
            document.body.removeChild(fullPageTrigger);
        }
    };

    fullPageTrigger.addEventListener('touchstart', triggerAction, {once: true});
    fullPageTrigger.addEventListener('click', triggerAction, {once: true});
});
