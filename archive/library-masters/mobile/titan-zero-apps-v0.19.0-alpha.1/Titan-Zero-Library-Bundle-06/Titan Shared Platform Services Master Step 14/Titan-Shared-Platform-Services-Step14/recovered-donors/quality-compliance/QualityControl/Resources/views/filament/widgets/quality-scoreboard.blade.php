<x-filament-widgets::widget>
    <x-filament::section :heading="$this->getHeading()">
        <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div class="col-span-2 space-y-3">
                <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Inspection schedules (last {{ $period }})</p>
                <div class="flex items-center justify-between"><span>Total</span><strong>{{ $insp_total }}</strong></div>
                <div class="flex items-center justify-between"><span>Pass rate</span><strong>{{ $insp_pass_rate !== null ? $insp_pass_rate . '%' : '—' }}</strong></div>
                <div class="flex items-center justify-between"><span>Failed / escalated</span><strong>{{ $insp_failed }}</strong></div>
                <div class="flex items-center justify-between"><span>Needs re-clean</span><strong>{{ $insp_reclean }}</strong></div>
            </div>
            <div class="col-span-2 space-y-3">
                <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">QC records (last {{ $period }})</p>
                <div class="flex items-center justify-between"><span>Total</span><strong>{{ $qc_total }}</strong></div>
                <div class="flex items-center justify-between"><span>Pass rate</span><strong>{{ $qc_pass_rate !== null ? $qc_pass_rate . '%' : '—' }}</strong></div>
                <div class="flex items-center justify-between"><span>Average score</span><strong>{{ $qc_avg_score ?? '—' }}</strong></div>
                <div class="flex items-center justify-between"><span>Failed</span><strong>{{ $qc_failed }}</strong></div>
                <div class="flex items-center justify-between"><span>Re-clean triggered</span><strong>{{ $qc_reclean }}</strong></div>
            </div>
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
