from pathlib import Path
import json
import sys

root = Path(__file__).resolve().parents[3]
checks = []

def need(rel: str, needle: str | None = None):
    path = root / rel
    ok = path.is_file()
    if ok and needle is not None:
        ok = needle in path.read_text(errors='ignore')
    checks.append((rel if needle is None else f'{rel}::{needle}', ok))

need('System/GenerativeUI/BuilderRegistry.php')
need('System/GenerativeUI/GenerativeUiSpecValidator.php')
need('System/GenerativeUI/GenerativeUiSpecNormaliser.php')
need('System/GenerativeUI/GenerativeUiResponseComposer.php')
need('System/Http/Controllers/GenerativeUiController.php')
need('System/Security/CompanyContext.php', "company_id")
need('System/TitanBuilderServiceProvider.php', 'titan-mobilekit-premium.css')
need('resources/assets/js/titan-generative-ui.js', 'TitanGenerativeUI')
need('resources/assets/js/titan-generative-ui.js', "registerComponent('mobile-accordion'")
need('resources/assets/js/titan-generative-ui.js', "registerComponent('product-card'")
need('resources/assets/js/titan-generative-ui.js', "registerComponent('auth-panel'")
need('resources/assets/js/titan-generative-ui.js', "registerComponent('chat-thread'")
need('resources/assets/js/titan-generative-ui.js', "registerComponent('invoice-header'")
need('resources/assets/js/titan-generative-ui.js', "registerComponent('article-header'")
need('resources/builder/templates/premium-commerce-app.json', 'company_id')
need('resources/builder/specs/premium-application-patterns.json', 'company_id')
need('resources/assets/css/titan-generative-ui.css', '.tgui-root')
need('resources/assets/css/titan-mobilekit-premium.css', '[data-tpm-theme="dark"]')
need('resources/assets/css/titan-mobilekit-premium.css', '[dir="rtl"]')
need('resources/builder/manifest.json', 'presentation-only')
need('extension.manifest.json', '"tenant_key": "company_id"')
need('tests/standalone/premium_mobilekit_v060_contract.php')

failed = [name for name, ok in checks if not ok]
print(json.dumps({'checks': len(checks), 'failed': failed}, indent=2))
sys.exit(1 if failed else 0)
