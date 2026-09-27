<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('feedback_email_settings') || !Schema::hasColumn('feedback_email_settings', 'imap_password')) return;
        DB::table('feedback_email_settings')->select(['id', 'imap_password'])->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                $value = (string) ($row->imap_password ?? '');
                if ($value === '') continue;
                try {
                    Crypt::decryptString($value);
                    continue;
                } catch (\Throwable) {
                    DB::table('feedback_email_settings')->where('id', $row->id)->update(['imap_password' => Crypt::encryptString($value)]);
                }
            }
        });
    }

    public function down(): void
    {
        // Deliberately irreversible: secrets are never downgraded back to plaintext.
    }
};
