(function (global) {
    'use strict';

    const clampPercent = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        return Math.min(100, Math.max(0, numeric));
    };

    const API = {
        version: '0.7.0',
        authority: 'presentation-only',
        bindNetworkState(root) {
            if (!root || typeof global.addEventListener !== 'function') return () => {};
            const sync = () => {
                const online = typeof global.navigator === 'undefined' ? true : global.navigator.onLine !== false;
                root.dataset.network = online ? 'online' : 'offline';
                root.querySelectorAll?.('[data-tpm-network-status]').forEach((node) => {
                    node.dataset.online = online ? 'true' : 'false';
                });
            };
            global.addEventListener('online', sync);
            global.addEventListener('offline', sync);
            sync();
            return () => {
                global.removeEventListener('online', sync);
                global.removeEventListener('offline', sync);
            };
        },
        setInstallCapability(root, detail) {
            if (!root) return;
            root.dataset.installAvailable = detail?.available === true ? 'true' : 'false';
        },
        setDisclosure(root, id, open) {
            if (!root || typeof id !== 'string' || id === '') return false;
            const node = root.querySelector?.(`[data-tpm-disclosure="${id}"]`);
            if (!node) return false;
            const isOpen = open === true;
            node.dataset.open = isOpen ? 'true' : 'false';
            node.setAttribute?.('aria-hidden', isOpen ? 'false' : 'true');
            return true;
        },
        setPresentationMode(root, detail) {
            if (!root) return;
            const theme = detail?.theme === 'dark' ? 'dark' : 'light';
            const direction = detail?.direction === 'rtl' ? 'rtl' : 'ltr';
            root.dataset.tpmTheme = theme;
            root.setAttribute?.('dir', direction);
        },
        setProgress(root, value) {
            if (!root) return 0;
            const percent = clampPercent(value);
            const node = root.querySelector?.('[data-tpm-progress]');
            if (node) {
                node.dataset.value = String(percent);
                node.style?.setProperty('--tpm-progress', `${percent}%`);
                node.setAttribute?.('aria-valuenow', String(percent));
            }
            return percent;
        },
    };

    global.TitanMobilekitPremium = Object.freeze(API);
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
