# Payload Performance Pass 05

Pass 05 adds an authority-neutral locale-on-demand loader for the existing 55 Titan locale bundles. No locale file or current language option is removed; locale resolution preserves exact locale, base-language fallback, then the existing English fallback.

Per Manager directive `TZ-MGR-DONOR-SLIM-M42-002`, this pass also carries the authorized Phase-2 retirement tranche: `content.js`, `monica-popup.js`, `monica-popup.css`, and 70 Manager-audited static assets. `chatTab.html` and `monicaOptions.html` now load `titan-zero-chat-content.compat.js`; `monicaPopup.html` now loads the retained Titan runtime compat JS/CSS. `content.css`, all protected Titan compat runtimes, Retriever, and the Monica background runtime boundary are retained unchanged.
