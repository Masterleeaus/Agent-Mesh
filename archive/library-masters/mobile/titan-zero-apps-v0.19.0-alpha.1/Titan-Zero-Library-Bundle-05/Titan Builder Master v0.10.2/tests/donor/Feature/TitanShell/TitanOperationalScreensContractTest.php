<?php

test('operational workspace is connected to the template shell', function (): void {
    $root = dirname(__DIR__, 3);
    $frontpage = file_get_contents($root.'/resources/views/frontend-ui/frontend-ui-frontpage.blade.php');
    $workspace = file_get_contents($root.'/resources/views/frontend-ui/components/operational-workspace.blade.php');
    $runtime = file_get_contents($root.'/resources/js/titan-operational-screens.js');

    expect($frontpage)->toContain('components.operational-workspace')
        ->and($frontpage)->toContain('titan-operational-screens.js')
        ->and($workspace)->toContain('data-titan-operational')
        ->and($runtime)->toContain('window.TitanOperationalScreens')
        ->and($runtime)->toContain("authority: 'proposal-only'")
        ->and($runtime)->toContain('listRecords');
});
