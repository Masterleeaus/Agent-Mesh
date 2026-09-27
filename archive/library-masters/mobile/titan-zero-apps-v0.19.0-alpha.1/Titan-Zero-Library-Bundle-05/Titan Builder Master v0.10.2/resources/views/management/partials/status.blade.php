@php($status = $status ?? 'unknown')
<span class="tbm-status is-{{ $status }}"><span></span>{{ ucfirst(str_replace('-', ' ', $status)) }}</span>
