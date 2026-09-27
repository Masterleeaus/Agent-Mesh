<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('titan_builder_projects')) {
            Schema::create('titan_builder_projects', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->string('name');
                $table->string('slug', 120);
                $table->string('surface', 32)->default('owner');
                $table->unsignedBigInteger('active_publish_snapshot_id')->nullable()->index();
                $table->json('meta')->nullable();
                $table->timestamps();
                $table->unique(['company_id', 'slug']);
            });
        }

        if (! Schema::hasTable('titan_builder_versions')) {
            Schema::create('titan_builder_versions', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('project_id')->index();
                $table->unsignedInteger('version');
                $table->string('status', 32)->default('published');
                $table->string('created_by', 128)->nullable();
                $table->timestamp('published_at')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();
                $table->unique(['company_id', 'project_id', 'version'], 'titan_builder_versions_company_project_version_unique');
            });
        }

        if (! Schema::hasTable('titan_builder_pages')) {
            Schema::create('titan_builder_pages', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('project_id')->index();
                $table->string('slug', 120);
                $table->string('name');
                $table->unsignedInteger('sort_order')->default(0);
                $table->json('meta')->nullable();
                $table->timestamps();
                $table->unique(['company_id', 'project_id', 'slug'], 'titan_builder_pages_company_project_slug_unique');
            });
        }

        if (! Schema::hasTable('titan_builder_page_specs')) {
            Schema::create('titan_builder_page_specs', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('page_id')->index();
                $table->string('schema_version', 16)->default('1.1');
                $table->string('surface', 32)->default('page');
                $table->json('spec');
                $table->char('checksum', 64);
                $table->string('created_by', 128)->nullable();
                $table->timestamps();
                $table->index(['company_id', 'page_id', 'id'], 'titan_builder_page_specs_company_page_id_index');
            });
        }

        if (! Schema::hasTable('titan_builder_themes')) {
            Schema::create('titan_builder_themes', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('project_id')->nullable()->index();
                $table->string('slug', 120);
                $table->string('name');
                $table->json('tokens');
                $table->boolean('is_default')->default(false);
                $table->timestamps();
                $table->unique(['company_id', 'project_id', 'slug'], 'titan_builder_themes_company_project_slug_unique');
            });
        }

        if (! Schema::hasTable('titan_builder_templates')) {
            Schema::create('titan_builder_templates', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('project_id')->nullable()->index();
                $table->string('slug', 120);
                $table->string('name');
                $table->string('surface', 32);
                $table->json('definition');
                $table->timestamps();
                $table->unique(['company_id', 'project_id', 'slug'], 'titan_builder_templates_company_project_slug_unique');
            });
        }

        if (! Schema::hasTable('titan_builder_assets')) {
            Schema::create('titan_builder_assets', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('project_id')->nullable()->index();
                $table->string('disk', 64)->default('public');
                $table->string('path', 1024);
                $table->string('mime_type', 128);
                $table->unsignedBigInteger('size_bytes');
                $table->char('checksum', 64);
                $table->json('meta')->nullable();
                $table->timestamps();
                $table->index(['company_id', 'checksum']);
            });
        }

        if (! Schema::hasTable('titan_builder_publish_snapshots')) {
            Schema::create('titan_builder_publish_snapshots', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('project_id')->index();
                $table->unsignedInteger('version');
                $table->json('snapshot');
                $table->char('checksum', 64);
                $table->string('created_by', 128)->nullable();
                $table->timestamp('published_at');
                $table->timestamps();
                $table->unique(['company_id', 'project_id', 'version'], 'titan_builder_snapshots_company_project_version_unique');
            });
        }

        if (! Schema::hasTable('titan_builder_ai_generation_jobs')) {
            Schema::create('titan_builder_ai_generation_jobs', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('project_id')->nullable()->index();
                $table->unsignedBigInteger('page_id')->nullable()->index();
                $table->string('provider', 80)->nullable();
                $table->string('status', 32)->default('queued');
                $table->char('prompt_hash', 64);
                $table->json('request')->nullable();
                $table->json('response')->nullable();
                $table->text('error')->nullable();
                $table->timestamps();
                $table->index(['company_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('titan_builder_ai_generation_jobs');
        Schema::dropIfExists('titan_builder_publish_snapshots');
        Schema::dropIfExists('titan_builder_assets');
        Schema::dropIfExists('titan_builder_templates');
        Schema::dropIfExists('titan_builder_themes');
        Schema::dropIfExists('titan_builder_page_specs');
        Schema::dropIfExists('titan_builder_pages');
        Schema::dropIfExists('titan_builder_versions');
        Schema::dropIfExists('titan_builder_projects');
    }
};
