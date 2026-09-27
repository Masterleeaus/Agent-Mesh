<?php

namespace Tests\Feature\TitanShell;

use PHPUnit\Framework\TestCase;

final class TitanShellBuilderContractTest extends TestCase
{
    public function test_builder_contract_files_are_present(): void
    {
        $root = dirname(__DIR__, 3);
        self::assertFileExists($root . '/resources/js/titan-shell-builder.js');
        self::assertFileExists($root . '/resources/views/home/edit-window/edit-steps/titan-shell-builder.blade.php');
        self::assertFileExists($root . '/database/migrations/2026_07_28_000100_add_titan_shell_builder_config_to_ext_chatbots.php');
        $request = file_get_contents($root . '/System/Http/Requests/ChatbotCustomizeRequest.php');
        self::assertStringContainsString('shell_builder_config', $request);
        self::assertStringContainsString('titan_template', $request);
    }
}
