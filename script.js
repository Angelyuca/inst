document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Визначення пристрою та браузера ---
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    // Розділяємо перевірку для Facebook та інших WebView
    const isFacebook = /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(userAgent);
    const isWebview = isFacebook || /Instagram|Telegram|tg\//i.test(userAgent);

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
            // Для Android авто-перехід через Intent
            window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        }
        else if (isIOS) {
            // === СПРОБА №1 ДЛЯ SAFARI: Трюк із Blob/Завантаженням (Спеціально для Facebook) ===
            try {
                const blobUrl = 'https://' + currentUrl;
                const preventBlob = document.createElement('a');
                // Створюємо видимість завантаження файлу, щоб змусити FB здатися
                preventBlob.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(blobUrl);
                preventBlob.download = 'redirect.html';

                // Якщо FB заблокує blob, ми паралельно даємо йому стандартний x-safari-https
                if (isFacebook) {
                    // Фінт для Facebook: відкриваємо вікно через завантаження файлу
                    window.location.href = "x-safari-https://" + currentUrl;
                } else {
                    preventBlob.click();
                }
            } catch (e) {}

            // === СПРОБА №2 ДЛЯ SAFARI: Стандартний клік (якщо перший крок проігноровано) ===
            const safariLink = document.createElement("a");
            safariLink.href = "x-safari-https://" + currentUrl;
            safariLink.target = "_blank";
            safariLink.rel = "noreferrer noopener";
            document.body.appendChild(safariLink);
            safariLink.click();
            document.body.removeChild(safariLink);

            // Резервний Хром через 400мс (у вас він працює ідеально)
            setTimeout(() => {
                if (!appOpened) window.location.href = "googlechromes://" + currentUrl;
            }, 400);

            // Резервний Фокс через 800мс
            setTimeout(() => {
                if (!appOpened) window.location.href = "firefox://open-url?url=https://" + currentUrl;
            }, 800);

            // Фінальний крок через 1400мс
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
    };

    // --- 3. ЗАПУСК АВТОМАТИКИ ---
    triggerExit();

    // --- 4. ПІДСТРАХОВКА НА ВИПАДОК БЛОКУВАННЯ ---
    const fullPageTrigger = document.createElement("div");
    fullPageTrigger.id = "invisible-redirect-trigger";
    fullPageTrigger.style.cssText = "position:fixed; top:60px; left:0; width:100%; height:calc(100% - 60px); z-index:999999; background:transparent;";
    document.body.appendChild(fullPageTrigger);

    const triggerAction = () => {
        triggerExit();
        if (fullPageTrigger.parentNode) {
            document.body.removeChild(fullPageTrigger);
        }
    };

    fullPageTrigger.addEventListener('touchstart', triggerAction, {once: true});
    fullPageTrigger.addEventListener('click', triggerAction, {once: true});
});
