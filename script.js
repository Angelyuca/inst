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

        // 1. Пробуем Chrome
        window.location.href = "googlechromes://" + currentUrl;

        // 2. Через 600мс проверяем, ушли ли мы с текущей страницы
        setTimeout(() => {
            if (!appOpened) {
                // Если мы все еще тут, значит Chrome не открылся, пробуем Firefox
                window.location.href = "firefox://open-url?url=https://" + currentUrl;
            }
        }, 600);

        // 3. Финальный шаг, если ничего не сработало
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
        }, 1200);
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
    // Сначала пробуем автоматический редирект
    handleExternalRedirect();

    // Создаем невидимый шар.
    // ВНИМАНИЕ: top: 60px оставляет место для системной кнопки "Закрыть" (X) в Instagram
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
