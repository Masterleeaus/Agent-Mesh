<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /** @var array<int,string> */
    private const COMPANY_ABILITIES = [
        'builder.read',
        'builder.edit',
        'builder.publish',
        'builder.assets.manage',
        'builder.templates.manage',
    ];

    /** @var array<int,string> */
    private const ADMIN_ABILITIES = [
        'builder.read',
        'builder.edit',
        'builder.publish',
        'builder.assets.manage',
        'builder.templates.manage',
        'builder.admin',
    ];

    /** @var array<string,array<int,string>> */
    private const ROLE_DEFAULTS = [
        'user' => self::COMPANY_ABILITIES,
        'admin' => self::ADMIN_ABILITIES,
        'super_admin' => self::ADMIN_ABILITIES,
    ];

    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();
        foreach (self::ADMIN_ABILITIES as $ability) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $ability, 'guard_name' => 'web'],
                ['updated_at' => $now, 'created_at' => $now],
            );
        }

        if (Schema::hasTable('roles') && Schema::hasTable('role_has_permissions')) {
            foreach (self::ROLE_DEFAULTS as $roleName => $abilities) {
                $roleId = DB::table('roles')->where('name', $roleName)->where('guard_name', 'web')->value('id');
                if (! is_numeric($roleId)) {
                    continue;
                }

                foreach ($abilities as $ability) {
                    $permissionId = DB::table('permissions')->where('name', $ability)->where('guard_name', 'web')->value('id');
                    if (! is_numeric($permissionId)) {
                        continue;
                    }

                    DB::table('role_has_permissions')->updateOrInsert([
                        'permission_id' => (int) $permissionId,
                        'role_id' => (int) $roleId,
                    ]);
                }
            }
        }

        $this->forgetPermissionCache();
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $permissionIds = DB::table('permissions')
            ->where('guard_name', 'web')
            ->whereIn('name', self::ADMIN_ABILITIES)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        if ($permissionIds !== [] && Schema::hasTable('roles') && Schema::hasTable('role_has_permissions')) {
            DB::table('role_has_permissions')->whereIn('permission_id', $permissionIds)->delete();
        }

        DB::table('permissions')
            ->where('guard_name', 'web')
            ->whereIn('name', self::ADMIN_ABILITIES)
            ->delete();

        $this->forgetPermissionCache();
    }

    private function forgetPermissionCache(): void
    {
        if (class_exists(PermissionRegistrar::class)) {
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }
    }
};
