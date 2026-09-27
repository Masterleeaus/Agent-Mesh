@extends('titan-builder::management.layout')
@section('content')
<section class="tbm-grid-2 tbm-align-start">
    <div>
        <div class="tbm-section-head"><div><p class="tbm-eyebrow">Builder projects</p><h2>Projects</h2></div></div>
        <div class="tbm-list">
            @forelse($projects as $project)
                <a class="tbm-list-row" href="{{ route('titan-builder.manage.project',$project->getKey()) }}">
                    <div><strong>{{ $project->name }}</strong><span>{{ $project->slug }} · {{ ucfirst($project->surface) }}</span></div>
                    <div class="tbm-row-meta"><span>{{ $pageCounts[$project->getKey()] ?? 0 }} pages</span><span>Updated {{ optional($project->updated_at)->diffForHumans() }}</span></div>
                </a>
            @empty
                <div class="tbm-empty"><strong>No Builder projects yet</strong><p>Create a project or provision the four Titan applications.</p></div>
            @endforelse
        </div>
    </div>
    <form class="tbm-panel" data-tbm-json-form data-endpoint="{{ route('titan-builder.projects.store') }}" data-reload="true">
        <p class="tbm-eyebrow">Create</p><h2>New project</h2>
        <label>Name<input name="name" required maxlength="160" placeholder="Customer portal"></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="customer-portal"></label>
        <label>Surface<select name="surface"><option value="customer">Titan Hub</option><option value="field">Titan Go</option><option value="owner">Titan Command</option><option value="onboarding">Titan Onboarding</option></select></label>
        <button class="tbm-button is-primary" type="submit">Create project</button>
    </form>
</section>
@endsection
