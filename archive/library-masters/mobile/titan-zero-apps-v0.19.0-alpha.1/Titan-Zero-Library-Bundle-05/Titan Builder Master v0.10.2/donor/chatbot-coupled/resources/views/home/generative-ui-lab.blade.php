@extends('panel.layout.app')
@section('title', __('Generative UI Lab'))
@push('css')
<link rel="stylesheet" href="{{ asset('vendor/chatbot/css/titan-generative-ui.css') }}">
<style>.tgui-lab{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.4fr);gap:1rem}.tgui-lab textarea{width:100%;min-height:65vh;font-family:ui-monospace,monospace;font-size:12px}.tgui-lab-preview{min-height:65vh;padding:1rem;border:1px solid #dce1ea;border-radius:1rem;background:#f8fafc}@media(max-width:900px){.tgui-lab{grid-template-columns:1fr}}</style>
@endpush
@section('content')
<div class="container-xl py-8" x-data="titanGenerativeUiLab()">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 class="text-2xl font-semibold">{{ __('Generative UI Lab') }}</h1><p class="opacity-70">{{ __('Validate, repair and preview presentation-only chat interfaces.') }}</p></div><div class="flex gap-2"><button class="btn" @click="validate">{{ __('Validate') }}</button><button class="btn btn-primary" @click="repair">{{ __('Repair') }}</button></div></div>
    <div class="tgui-lab"><div><textarea x-model="source" @input.debounce.250ms="render"></textarea><pre class="mt-3 whitespace-pre-wrap text-xs" x-text="status"></pre></div><div class="tgui-lab-preview" x-ref="preview"></div></div>
</div>
@endsection
@push('script')
<script src="{{ asset('vendor/chatbot/js/titan-generative-ui.js') }}"></script>
<script>
function titanGenerativeUiLab(){return{source:@js(json_encode($initialSpec, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)),status:'',runtime:null,init(){this.render()},parse(){try{return JSON.parse(this.source)}catch(e){this.status=e.message;return null}},render(){const spec=this.parse();if(!spec)return;this.runtime?.destroy?.();this.runtime=window.TitanGenerativeUI.renderSpec(spec,this.$refs.preview,{persistenceKey:'titan-ui-lab:'+String(spec.id||'draft')});this.status=this.runtime.validation.valid?'Valid':'Invalid: '+this.runtime.validation.issues.map(i=>i.message).join('; ')},async validate(){const spec=this.parse();if(!spec)return;const r=await fetch(@js(route('dashboard.chatbot.generative-ui.validate')),{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name=csrf-token]')?.content||''},body:JSON.stringify({spec})});const data=await r.json();this.status=JSON.stringify(data,null,2)},async repair(){const spec=this.parse();if(!spec)return;const r=await fetch(@js(route('dashboard.chatbot.generative-ui.repair')),{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name=csrf-token]')?.content||''},body:JSON.stringify({spec})});const data=await r.json();if(data.spec){this.source=JSON.stringify(data.spec,null,2);this.render()}this.status=JSON.stringify(data.changes||data,null,2)}}}
</script>
@endpush
