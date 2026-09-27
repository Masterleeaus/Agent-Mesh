@php
    use Modules\QualityControl\Support\ModuleAccess;
@endphp

@if (ModuleAccess::userHasModule() && ModuleAccess::permissionLevel('view_quality_control') != 'none')
    <x-menu-item icon="camera-video" :text="__('quality_control::sidebar.quality_control')" :addon="App::environment('schedule')">
        <x-slot name="iconPath">
            <path fill-rule="evenodd"
                  d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
        </x-slot>
        <div class="accordionItemContent pb-2">
            @php
                $rDashboard = Route::has('quality-control.index')
                    ? route('quality-control.index')
                    : null;

                $rRecurring = Route::has('recurring-inspection_schedules.index')
                    ? route('recurring-inspection_schedules.index')
                    : (Route::has('recurring-schedules.index') ? route('recurring-schedules.index') : null);

                $rSchedules = Route::has('inspection_schedules.index')
                    ? route('inspection_schedules.index')
                    : (Route::has('schedules.index') ? route('schedules.index') : null);

                $rInspections = Route::has('schedule-inspection.index')
                    ? route('schedule-inspection.index')
                    : null;

                $rRecords = Route::has('qc-records.index')
                    ? route('qc-records.index')
                    : null;

                $rRatings = Route::has('cleaner-ratings.index')
                    ? route('cleaner-ratings.index')
                    : null;

                $rReclean = Route::has('reclean.index')
                    ? route('reclean.index')
                    : null;

                $rTemplates = Route::has('inspection-templates.index')
                    ? route('inspection-templates.index')
                    : null;
            @endphp

            @if($rDashboard)
                <x-sub-menu-item :link="$rDashboard" :text="__('quality_control::sidebar.qc_dashboard')"/>
            @endif

            @if($rRecurring)
                <x-sub-menu-item :link="$rRecurring" :text="__('quality_control::sidebar.recurring_quality')"/>
            @endif

            @if($rSchedules)
                <x-sub-menu-item :link="$rSchedules" :text="__('quality_control::sidebar.quality_schedules')"/>
            @endif

            @if($rInspections)
                <x-sub-menu-item :link="$rInspections" :text="__('quality_control::sidebar.quality_controls')"/>
            @endif

            @if($rRecords && ModuleAccess::permissionLevel('view_quality_control') != 'none')
                <x-sub-menu-item :link="$rRecords" :text="__('quality_control::sidebar.qc_records')"/>
            @endif

            @if($rRatings && ModuleAccess::permissionLevel('view_cleaner_ratings') != 'none')
                <x-sub-menu-item :link="$rRatings" :text="__('quality_control::sidebar.cleaner_ratings')"/>
            @endif

            @if($rReclean && ModuleAccess::permissionLevel('trigger_reclean') != 'none')
                <x-sub-menu-item :link="$rReclean" :text="__('quality_control::sidebar.reclean_management')"/>
            @endif

            @if($rTemplates && ModuleAccess::permissionLevel('manage_qc_templates') != 'none')
                <x-sub-menu-item :link="$rTemplates" :text="__('quality_control::sidebar.qc_templates')"/>
            @endif
        </div>
    </x-menu-item>
@endif
