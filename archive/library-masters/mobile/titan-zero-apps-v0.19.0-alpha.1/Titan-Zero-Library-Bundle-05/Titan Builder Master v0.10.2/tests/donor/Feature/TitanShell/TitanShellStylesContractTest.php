<?php
it('includes responsive and reduced-motion shell styles', function (): void {
    $css = file_get_contents(dirname(__DIR__, 3).'/resources/assets/css/titan-app-shell.css');
    expect($css)->toContain('@media(min-width:768px)')->toContain('@media(min-width:1100px)')->toContain('prefers-reduced-motion');
});
