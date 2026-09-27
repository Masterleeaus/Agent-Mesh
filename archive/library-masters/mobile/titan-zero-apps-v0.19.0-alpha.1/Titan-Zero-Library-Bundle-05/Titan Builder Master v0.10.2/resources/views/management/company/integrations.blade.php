@extends('titan-builder::management.layout')
@section('content')
<section class="tbm-section"><div class="tbm-section-head"><div><p class="tbm-eyebrow">Capability discovery</p><h2>Connected Titan platform</h2></div><span>{{ count($capabilities) }} available</span></div>
<div class="tbm-capability-grid">@foreach(['crm'=>'CRM','titan-ai'=>'TitanAI','interaction-engine'=>'Interaction Engine','titan-connect'=>'Titan Connect','chatbot'=>'Chatbot','mobile'=>'Titan Mobile'] as $prefix=>$label) @php($hits=collect($capabilities)->filter(fn($cap)=>str_starts_with($cap,$prefix.'.') || str_starts_with($cap,$prefix.'-'))); <article class="tbm-panel"><div class="tbm-card-top"><h3>{{ $label }}</h3>@include('titan-builder::management.partials.status',['status'=>$hits->isNotEmpty()?'ready':'blocked'])</div><p>{{ $hits->isNotEmpty() ? $hits->count().' capabilities discovered.' : 'No matching capability manifest is currently available.' }}</p>@foreach($hits->take(6) as $cap)<code>{{ $cap }}</code>@endforeach</article>@endforeach</div>
</section>
@endsection
