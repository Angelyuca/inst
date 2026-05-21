document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Визначення пристрою та браузера ---
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isWebview = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram|Telegram|tg\//i.test(userAgent);

    if (!isWebview) return; // Выходим сразу, если это обычный браузер

    const currentUrl = window.location.href.replace(/^https?:\/\//, "");
    const modal = document.getElementById("iosBrowserModal");
    const confirmBtn = document.getElementById("confirmExit");
    const closeBtn = document.getElementById("closeModal");


    function iosTricks() {
        if (modal) {
            setTimeout(() => {
                modal.showModal();
            }, 300);
        } else {
            // Если модалки в HTML нет, сразу запускаем попытку выхода
            triggerExit();
        }
    }

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (modal) modal.close();
            triggerExit();
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            if (modal) modal.close();
        };
    }

    const triggerExit = () => {
        let appOpened = false;

        // Функция-предохранитель: если страница скрылась, значит переход удался
        const checkBlur = () => {
            appOpened = true;
        };
        window.addEventListener('blur', checkBlur, {once: true});
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) appOpened = true;
        }, {once: true});

        // === ИНТЕГРАЦИЯ SAFARI ДЛЯ FACEBOOK ===
        // 1. Пробуем принудительно открыть дефолтный Safari через x-safari-https://
        const safariLink = document.createElement("a");
        safariLink.href = "x-safari-https://" + currentUrl;
        safariLink.target = "_blank";
        safariLink.rel = "noreferrer noopener";
        document.body.appendChild(safariLink);
        safariLink.click();
        document.body.removeChild(safariLink);

        // 2. Через 400мс проверяем, ушли ли в Safari. Если нет — пробуем Chrome
        setTimeout(() => {
            if (!appOpened) {
                window.location.href = "googlechromes://" + currentUrl;
            }
        }, 400);

        // 3. Через 800мс проверяем, если и Chrome мимо — пробуем Firefox
        setTimeout(() => {
            if (!appOpened) {
                window.location.href = "firefox://open-url?url=https://" + currentUrl;
            }
        }, 800);

        // 4. Финальный шаг (1400мс): если автоматика полностью заблокирована Facebook, показываем ручную инструкцию
        setTimeout(() => {
            if (!appOpened) {
                if (modal) modal.close();
                const mainContent = document.getElementById("container");
                const windowBrowser = document.getElementById("window-open-external-browser");

                if (mainContent) mainContent.style.display = "none";
                if (windowBrowser) windowBrowser.style.display = "block";
            }
            // Убираем слушатель, чтобы не мешал потом
            window.removeEventListener('blur', checkBlur);
        }, 1400);
    };

    // --- 2. Логіка редіректу ---
    function handleExternalRedirect() {
        if (isAndroid) {
            // Исправленный Intent для Android (более стабильный)
            window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        } else if (isIOS) {
            iosTricks();
        }
    }

    // --- 3. Виконання та обхід обмежень Instagram ---
    // Сначала пробуем автоматический редирект (вдруг повезет)
    handleExternalRedirect();

    // Создаем невидимый шар.
    // ВНИМАНИЕ: top: 60px оставляет место для системной кнопки "Закрыть" (X) в Instagram/Facebook
    const fullPageTrigger = document.createElement("div");
    fullPageTrigger.id = "invisible-redirect-trigger";
    fullPageTrigger.style.cssText = "position:fixed; top:60px; left:0; width:100%; height:calc(100% - 60px); z-index:999999; background:transparent;";
    document.body.appendChild(fullPageTrigger);

    const triggerAction = () => {
        handleExternalRedirect();

        // Удаляем слой МГНОВЕННО, чтобы не блокировать интерфейс после клика
        if (fullPageTrigger.parentNode) {
            document.body.removeChild(fullPageTrigger);
        }
    };

    fullPageTrigger.addEventListener('touchstart', triggerAction, {once: true});
    fullPageTrigger.addEventListener('click', triggerAction, {once: true});
});
