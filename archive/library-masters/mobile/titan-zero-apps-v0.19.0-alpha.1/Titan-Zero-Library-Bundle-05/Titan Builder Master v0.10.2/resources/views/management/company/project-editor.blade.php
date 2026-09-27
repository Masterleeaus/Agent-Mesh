@extends('titan-builder::management.layout')
@section('topbar-actions')
<button class="tbm-button" type="button" data-tbm-publish data-endpoint="{{ route('titan-builder.publish',$record->getKey()) }}">Publish project</button>
@endsection
@section('content')
<div class="tbm-editor" data-tbm-editor
     data-project-id="{{ $record->getKey() }}"
     data-project-surface="{{ $record->surface }}"
     data-validate-url="{{ route('titan-builder.generative-ui.validate') }}"
     data-propose-url="{{ route('titan-builder.generative-ui.propose') }}"
     data-preview-url="{{ route('titan-builder.preview') }}"
     data-page-store-base="{{ url(config('titan-builder.route_prefix','titan-builder/api').'/pages') }}">
    <aside class="tbm-editor-rail">
        <div class="tbm-section-head"><div><p class="tbm-eyebrow">{{ $record->surface }}</p><h2>{{ $record->name }}</h2></div></div>
        <div class="tbm-page-list" role="list">
            @foreach($pages as $page)
                <button type="button" data-tbm-page data-page-id="{{ $page->getKey() }}" data-page-name="{{ $page->name }}">{{ $page->name }}<small>{{ $page->slug }}</small></button>
                <script type="application/json" id="tbm-spec-{{ $page->getKey() }}">@json($specs[$page->getKey()] ?? ['version'=>'1.1','surface'=>$record->surface,'root'=>'root','elements'=>['root'=>['type'=>'stack','props'=>['gap'=>'md'],'children'=>[]]]])</script>
            @endforeach
        </div>
        <form data-tbm-json-form data-endpoint="{{ route('titan-builder.pages.store',$record->getKey()) }}" data-reload="true" class="tbm-compact-form">
            <input name="name" required placeholder="Page name"><input name="slug" required pattern="[a-z0-9-]+" placeholder="page-slug"><button class="tbm-button is-small" type="submit">Add page</button>
        </form>
        <details class="tbm-details"><summary>Versions & rollback</summary>
            <div class="tbm-history">
                @foreach($snapshots as $snapshot)<button type="button" data-tbm-rollback data-endpoint="{{ route('titan-builder.rollback',[$record->getKey(),$snapshot->getKey()]) }}">Snapshot #{{ $snapshot->getKey() }} <small>{{ optional($snapshot->published_at)->diffForHumans() }}</small></button>@endforeach
            </div>
        </details>
    </aside>
    <section class="tbm-editor-center">
        <div class="tbm-editor-toolbar">
            <strong id="tbm-current-page">Select a page</strong>
            <div><button class="tbm-button is-small" type="button" data-tbm-validate>Validate</button><button class="tbm-button is-small" type="button" data-tbm-preview>Preview</button><button class="tbm-button is-small is-primary" type="button" data-tbm-save-spec>Save draft</button></div>
        </div>
        <textarea id="tbm-spec-editor" class="tbm-code" spellcheck="false" aria-label="Page specification"></textarea>
        <div class="tbm-ai-row"><input id="tbm-ai-prompt" placeholder="Ask TitanAI to improve this page…"><button class="tbm-button" type="button" data-tbm-ai>Generate proposal</button></div>
        <pre id="tbm-validation-output" class="tbm-output" hidden></pre>
    </section>
    <aside class="tbm-preview-pane">
        <div class="tbm-editor-toolbar"><strong>Validated preview</strong><select id="tbm-preview-device"><option>mobile</option><option>tablet</option><option>desktop</option></select></div>
        <div id="tbm-preview-canvas" class="tbm-device-frame"><div class="tbm-empty"><strong>Preview ready</strong><p>Select a page and choose Preview.</p></div></div>
    </aside>
</div>
@endsection
