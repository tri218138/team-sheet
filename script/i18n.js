const I18N_STORAGE_KEY = 'teamSheetLang';
let translations = {};

// Tải file ngôn ngữ
async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load ${lang}.json`);
        }
        translations = await response.json();
    } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English if loading fails
        if (lang !== 'en') {
            await loadTranslations('en');
        }
    }
}

// Lấy bản dịch
function t(key, replacements = {}) {
    let text = translations[key] || key;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
}

// Cập nhật các phần tử HTML
function translatePage() {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        const text = t(key);
        if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = text;
        } else if (el.tagName === 'LABEL' && el.htmlFor) {
            // For file input labels
            el.textContent = text;
        } 
        else {
            el.textContent = text;
        }
    });
    // Cập nhật tiêu đề trang
    document.title = t('appTitle');
}

// Lấy ngôn ngữ đã lưu hoặc mặc định là 'vi'
function getLanguage() {
    return localStorage.getItem(I18N_STORAGE_KEY) || 'vi';
}

// Lưu ngôn ngữ
function setLanguage(lang) {
    localStorage.setItem(I18N_STORAGE_KEY, lang);
}

// Khởi tạo và thiết lập i18n
async function initI18n() {
    const lang = getLanguage();
    await loadTranslations(lang);
    translatePage();
    return { t, setLanguage, getLanguage, translatePage };
}

export { initI18n, t };
