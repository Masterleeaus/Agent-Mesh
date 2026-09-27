<template x-if="message.is_generative_ui && message.ui_spec">
    <section
        class="tgui-chat-surface"
        x-data="{ collapsed: false, expanded: false, canvas: false, runtime: null, canvasRuntime: null, closeCanvas(){ this.canvasRuntime?.destroy?.(); this.canvasRuntime = null; this.canvas = false } }"
        :class="{ 'is-collapsed': collapsed, 'is-expanded': expanded, 'has-local-state': true }"
        x-init="$nextTick(() => { runtime = renderGenerativeUiMessage(message, $refs.surface) })"
    >
        <header class="tgui-chat-toolbar">
            <p class="tgui-chat-label">
                <span x-text="message.ui_meta?.title || 'Generated interface'"></span>
                <small>{{ __('Presentation-only UI') }}</small>
            </p>
            <div class="tgui-chat-controls">
                <button type="button" @click="collapsed = !collapsed" x-text="collapsed ? '{{ __('Show') }}' : '{{ __('Hide') }}'"></button>
                <button type="button" @click="expanded = !expanded">{{ __('Expand') }}</button>
                <button type="button" @click="canvas = true">{{ __('Canvas') }}</button>
                <button type="button" @click="runtime?.store?.undo?.()">{{ __('Undo') }}</button>
                <button type="button" @click="runtime?.store?.redo?.()">{{ __('Redo') }}</button>
            </div>
        </header>
        <div x-show="!collapsed" class="tgui-chat-body">
            <p class="mb-3 text-xs opacity-70" x-text="message.fallback_text"></p>
            <div x-ref="surface"></div>
        </div>
        <template x-if="canvas">
            <div class="tgui-canvas-overlay" @click.self="closeCanvas()" @keydown.escape.window="closeCanvas()">
                <div class="tgui-canvas">
                    <header class="tgui-canvas-header">
                        <div><strong x-text="message.ui_meta?.title || 'Generated interface'"></strong><span>{{ __('Presentation-only canvas') }}</span></div>
                        <button class="tgui-canvas-close" type="button" @click="closeCanvas()" aria-label="{{ __('Close') }}">×</button>
                    </header>
                    <div class="tgui-canvas-body" x-init="$nextTick(() => { canvasRuntime = renderGenerativeUiMessage(message, $el, { persistenceSuffix: ':canvas', surface: 'canvas' }) })"></div>
                </div>
            </div>
        </template>
    </section>
</template>
