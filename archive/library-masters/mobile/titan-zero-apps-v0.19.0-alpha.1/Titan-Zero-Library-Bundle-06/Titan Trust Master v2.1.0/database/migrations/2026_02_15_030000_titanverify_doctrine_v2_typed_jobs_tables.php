<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // TITAN WORK SCHEMA DOCTRINE v2 (TYPED) — Jobs domain
        // Required identity columns on ALL work_* tables:
        // company_id, user_id (NOT NULL), team_id NULL, created_by_team_id NULL, id PK, created_at/updated_at

        // ----------------------------
        // PRIMARY: work_jobs (optional; if already exists elsewhere, we don't create)
        // ----------------------------
        if (!Schema::hasTable('work_jobs')) {
            Schema::create('work_jobs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->string('reference', 100)->nullable();
                $table->string('title', 255)->nullable();
                $table->text('description')->nullable();
                $table->string('status', 50)->nullable();
                $table->string('priority', 50)->nullable();
                $table->timestamp('start_at')->nullable();
                $table->timestamp('due_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->json('meta_json')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id'], 'work_jobs_tenant_idx');
            });
        } else {
            Schema::table('work_jobs', function (Blueprint $table) {
                if (!Schema::hasColumn('work_jobs','team_id')) $table->unsignedBigInteger('team_id')->nullable()->after('user_id');
                if (!Schema::hasColumn('work_jobs','created_by_team_id')) $table->unsignedBigInteger('created_by_team_id')->nullable()->after('team_id');
                if (!Schema::hasColumn('work_jobs','meta_json')) $table->json('meta_json')->nullable();
            });
        }

        // ----------------------------
        // ITEMS: work_jobs_items (typed) — job_id + item_type required
        // ----------------------------
        if (!Schema::hasTable('work_jobs_items')) {
            Schema::create('work_jobs_items', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id');
                $table->string('item_type', 50); // REQUIRED
                $table->integer('sequence')->default(0);
                $table->string('title', 255);
                $table->text('description')->nullable();
                $table->string('status', 50)->nullable();

                // optional commercial fields
                $table->decimal('quantity', 12, 3)->nullable();
                $table->string('unit', 30)->nullable();
                $table->decimal('unit_price', 12, 2)->nullable();
                $table->decimal('amount', 12, 2)->nullable();

                // optional workflow fields
                $table->timestamp('due_at')->nullable();
                $table->timestamp('completed_at')->nullable();

                $table->json('meta_json')->nullable();
                $table->timestamps();

                $table->index(['company_id','user_id','job_id','item_type'], 'work_jobs_items_tenant_job_type_idx');
            });
        } else {
            Schema::table('work_jobs_items', function (Blueprint $table) {
                foreach (['team_id','created_by_team_id'] as $col) {
                    if (!Schema::hasColumn('work_jobs_items',$col)) $table->unsignedBigInteger($col)->nullable();
                }
                if (!Schema::hasColumn('work_jobs_items','item_type')) $table->string('item_type', 50)->default('instruction');
                if (!Schema::hasColumn('work_jobs_items','sequence')) $table->integer('sequence')->default(0);
                if (!Schema::hasColumn('work_jobs_items','meta_json')) $table->json('meta_json')->nullable();
                if (!Schema::hasColumn('work_jobs_items','completed_at')) $table->timestamp('completed_at')->nullable();
                if (!Schema::hasColumn('work_jobs_items','quantity')) $table->decimal('quantity', 12, 3)->nullable();
                if (!Schema::hasColumn('work_jobs_items','unit')) $table->string('unit', 30)->nullable();
                if (!Schema::hasColumn('work_jobs_items','unit_price')) $table->decimal('unit_price', 12, 2)->nullable();
                if (!Schema::hasColumn('work_jobs_items','amount')) $table->decimal('amount', 12, 2)->nullable();
            });
            // ensure index exists
            try {
                DB::statement("CREATE INDEX work_jobs_items_tenant_job_type_idx ON work_jobs_items (company_id, user_id, job_id, item_type)");
            } catch (\Throwable $e) {}
        }

        // ----------------------------
        // EVENTS: work_jobs_events (typed) — job_id + event_type + occurred_at required
        // ----------------------------
        if (!Schema::hasTable('work_jobs_events')) {
            Schema::create('work_jobs_events', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id');
                $table->string('event_type', 80); // REQUIRED
                $table->string('event_label', 255)->nullable();
                $table->string('severity', 20)->nullable();
                $table->text('message')->nullable();
                $table->dateTime('occurred_at'); // REQUIRED
                $table->json('meta_json')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id','event_type'], 'work_jobs_events_tenant_type_idx');
                $table->index(['company_id','user_id','job_id','occurred_at'], 'work_jobs_events_tenant_job_time_idx');
            });
        } else {
            Schema::table('work_jobs_events', function (Blueprint $table) {
                foreach (['team_id','created_by_team_id'] as $col) {
                    if (!Schema::hasColumn('work_jobs_events',$col)) $table->unsignedBigInteger($col)->nullable();
                }
                // rename old 'event' column to event_type if present (best-effort)
                if (Schema::hasColumn('work_jobs_events','event') && !Schema::hasColumn('work_jobs_events','event_type')) {
                    try { DB::statement("ALTER TABLE work_jobs_events CHANGE event event_type VARCHAR(80) NOT NULL"); } catch (\Throwable $e) {}
                }
                if (!Schema::hasColumn('work_jobs_events','event_type')) $table->string('event_type', 80)->default('updated');
                if (!Schema::hasColumn('work_jobs_events','event_label')) $table->string('event_label', 255)->nullable();
                if (!Schema::hasColumn('work_jobs_events','severity')) $table->string('severity', 20)->nullable();
                if (!Schema::hasColumn('work_jobs_events','occurred_at')) $table->dateTime('occurred_at')->nullable();
                if (!Schema::hasColumn('work_jobs_events','meta_json')) $table->json('meta_json')->nullable();
            });
            // backfill occurred_at if NULL using created_at
            try { DB::statement("UPDATE work_jobs_events SET occurred_at = COALESCE(occurred_at, created_at)"); } catch (\Throwable $e) {}
            // ensure indexes exist
            try { DB::statement("CREATE INDEX work_jobs_events_tenant_type_idx ON work_jobs_events (company_id, user_id, event_type)"); } catch (\Throwable $e) {}
            try { DB::statement("CREATE INDEX work_jobs_events_tenant_job_time_idx ON work_jobs_events (company_id, user_id, job_id, occurred_at)"); } catch (\Throwable $e) {}
        }

        // ----------------------------
        // EVIDENCE: work_jobs_evidence (typed) — job_id + evidence_type required
        // ----------------------------
        if (!Schema::hasTable('work_jobs_evidence')) {
            Schema::create('work_jobs_evidence', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id');
                $table->string('evidence_type', 50); // REQUIRED
                $table->string('label', 255)->nullable();

                $table->text('file_url')->nullable();
                $table->string('file_mime', 100)->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->string('hash_sha256', 64)->nullable();

                $table->dateTime('captured_at')->nullable();
                $table->json('meta_json')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id','job_id','evidence_type'], 'work_jobs_evidence_tenant_job_type_idx');
            });
        } else {
            Schema::table('work_jobs_evidence', function (Blueprint $table) {
                foreach (['team_id','created_by_team_id'] as $col) {
                    if (!Schema::hasColumn('work_jobs_evidence',$col)) $table->unsignedBigInteger($col)->nullable();
                }
                if (Schema::hasColumn('work_jobs_evidence','type') && !Schema::hasColumn('work_jobs_evidence','evidence_type')) {
                    try { DB::statement("ALTER TABLE work_jobs_evidence CHANGE type evidence_type VARCHAR(50) NOT NULL"); } catch (\Throwable $e) {}
                }
                if (!Schema::hasColumn('work_jobs_evidence','evidence_type')) $table->string('evidence_type', 50)->default('document');
                if (!Schema::hasColumn('work_jobs_evidence','file_url')) $table->text('file_url')->nullable();
                if (!Schema::hasColumn('work_jobs_evidence','file_mime')) $table->string('file_mime', 100)->nullable();
                if (!Schema::hasColumn('work_jobs_evidence','file_size')) $table->unsignedBigInteger('file_size')->nullable();
                if (!Schema::hasColumn('work_jobs_evidence','hash_sha256')) $table->string('hash_sha256', 64)->nullable();
                if (!Schema::hasColumn('work_jobs_evidence','meta_json')) $table->json('meta_json')->nullable();
            });
            try { DB::statement("CREATE INDEX work_jobs_evidence_tenant_job_type_idx ON work_jobs_evidence (company_id, user_id, job_id, evidence_type)"); } catch (\Throwable $e) {}
        }

        // ----------------------------
        // SITES: work_jobs_sites (join/typed optional, but identity columns still required)
        // ----------------------------
        if (!Schema::hasTable('work_jobs_sites')) {
            Schema::create('work_jobs_sites', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->string('name', 255);
                $table->string('address', 255)->nullable();
                $table->string('role', 50)->nullable(); // primary/secondary
                $table->json('meta_json')->nullable();
                $table->timestamps();

                $table->index(['company_id','user_id'], 'work_jobs_sites_tenant_idx');
            });
        } else {
            Schema::table('work_jobs_sites', function (Blueprint $table) {
                foreach (['team_id','created_by_team_id'] as $col) {
                    if (!Schema::hasColumn('work_jobs_sites',$col)) $table->unsignedBigInteger($col)->nullable();
                }
                // convert old meta to meta_json if needed
                if (Schema::hasColumn('work_jobs_sites','meta') && !Schema::hasColumn('work_jobs_sites','meta_json')) {
                    try { DB::statement("ALTER TABLE work_jobs_sites CHANGE meta meta_json JSON NULL"); } catch (\Throwable $e) {}
                }
                if (!Schema::hasColumn('work_jobs_sites','meta_json')) $table->json('meta_json')->nullable();
            });
        }

        // ----------------------------
        // ATTENDANCE: work_jobs_attendance (not a canonical typed table in doctrine, but must include identity columns)
        // ----------------------------
        if (!Schema::hasTable('work_jobs_attendance')) {
            Schema::create('work_jobs_attendance', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id');
                $table->unsignedBigInteger('staff_user_id')->nullable();

                $table->dateTime('clock_in_at')->nullable();
                $table->string('clock_in_source', 40)->nullable();
                $table->dateTime('clock_out_at')->nullable();
                $table->string('clock_out_source', 40)->nullable();

                $table->dateTime('derived_first_capture_at')->nullable();
                $table->dateTime('derived_last_capture_at')->nullable();

                $table->decimal('lat', 10, 7)->nullable();
                $table->decimal('lng', 10, 7)->nullable();
                $table->decimal('accuracy_m', 8, 2)->nullable();

                $table->text('notes')->nullable();
                $table->json('meta_json')->nullable();

                $table->timestamps();

                $table->unique(['company_id','user_id','job_id'], 'work_jobs_attendance_tenant_job_uniq');
            });
        } else {
            Schema::table('work_jobs_attendance', function (Blueprint $table) {
                foreach (['team_id','created_by_team_id'] as $col) {
                    if (!Schema::hasColumn('work_jobs_attendance',$col)) $table->unsignedBigInteger($col)->nullable();
                }
                if (!Schema::hasColumn('work_jobs_attendance','meta_json')) $table->json('meta_json')->nullable();
            });
        }

        // ----------------------------
        // INCIDENTS: work_jobs_incidents (identity columns required; already ok, ensure meta_json)
        // ----------------------------
        if (!Schema::hasTable('work_jobs_incidents')) {
            Schema::create('work_jobs_incidents', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('team_id')->nullable();
                $table->unsignedBigInteger('created_by_team_id')->nullable();

                $table->unsignedBigInteger('job_id');
                $table->string('incident_type', 40)->nullable();
                $table->string('severity', 20)->nullable();
                $table->string('title', 255);
                $table->text('description')->nullable();
                $table->string('status', 50)->nullable();
                $table->json('meta_json')->nullable();

                $table->dateTime('occurred_at')->nullable();
                $table->dateTime('resolved_at')->nullable();

                $table->timestamps();

                $table->index(['company_id','user_id','job_id'], 'work_jobs_incidents_tenant_job_idx');
            });
        } else {
            Schema::table('work_jobs_incidents', function (Blueprint $table) {
                foreach (['team_id','created_by_team_id'] as $col) {
                    if (!Schema::hasColumn('work_jobs_incidents',$col)) $table->unsignedBigInteger($col)->nullable();
                }
                if (!Schema::hasColumn('work_jobs_incidents','meta_json')) $table->json('meta_json')->nullable();
                if (!Schema::hasColumn('work_jobs_incidents','occurred_at')) $table->dateTime('occurred_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        // Safe rollback: we do NOT drop primary work_jobs (may be shared). We only drop tables created by this extension if they exist.
        foreach ([
            'work_jobs_items',
            'work_jobs_events',
            'work_jobs_evidence',
            'work_jobs_attendance',
            'work_jobs_incidents',
            'work_jobs_sites',
            'work_jobs_evidence_rules',
            'work_jobs_evidence_logs',
            'work_jobs_evidence_signoffs',
            'work_jobs_evidence_files',
        ] as $table) {
            // Many of these may be created by other passes; only drop if present AND safe for your environment.
            // Keeping conservative: do nothing on down by default.
        }
    }
};
