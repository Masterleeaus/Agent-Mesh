<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];
$contractPath = $root.'/database/schema-contract.json';
$migrationDir = $root.'/database/migrations';

if (! is_file($contractPath)) {
    fwrite(STDERR, "ERROR: database/schema-contract.json is missing\n");
    exit(1);
}

try {
    $contract = json_decode((string) file_get_contents($contractPath), true, flags: JSON_THROW_ON_ERROR);
} catch (JsonException $exception) {
    fwrite(STDERR, 'ERROR: schema contract JSON: '.$exception->getMessage()."\n");
    exit(1);
}

$files = glob($migrationDir.'/*.php') ?: [];
sort($files);
$schemaFiles = [];
$additiveFiles = [];

$combined = '';
foreach ($files as $file) {
    $source = (string) file_get_contents($file);
    $combined .= "\n".$source;
    if (str_contains($source, 'Schema::create(')) {
        $schemaFiles[] = $file;
        if (! str_contains($source, 'Schema::hasTable(')) {
            $errors[] = basename($file).' is not schema-idempotent';
        }
    } elseif (str_contains($source, 'Schema::table(')) {
        $additiveFiles[] = $file;
        if (! str_contains($source, 'Schema::hasTable(')) {
            $errors[] = basename($file).' additive migration has no table guard';
        }
        if (! str_contains($source, 'Schema::hasColumn(')) {
            $errors[] = basename($file).' additive migration has no column guards';
        }
    } elseif (str_contains($source, 'MapsMenuInstaller::sync()')) {
        // Operational navigation migrations may be added as menu definitions grow; all must use the idempotent synchronizer.
    } else {
        $errors[] = basename($file).' is an unrecognised non-schema migration';
    }
    // Required application/event times must not use bare TIMESTAMP. On MySQL hosts with
    // legacy implicit TIMESTAMP defaults enabled, a second NOT NULL TIMESTAMP can receive
    // an illegal zero-date default under strict SQL modes (SQLSTATE 1067).
    if (preg_match_all('/\$table->timestamp\([^;]+;/', $source, $timestampStatements) > 0) {
        foreach ($timestampStatements[0] as $statement) {
            if (! str_contains($statement, '->nullable()')
                && ! str_contains($statement, '->useCurrent()')
                && ! str_contains($statement, '->default(')) {
                $errors[] = basename($file).' contains a required bare timestamp; use dateTime() for application-supplied event times: '.trim($statement);
            }
        }
    }

    if (str_contains($source, 'Schema::drop')) {
        $errors[] = basename($file).' contains a destructive rollback';
    }
    if (preg_match('/public\s+function\s+down\s*\(\s*\)\s*:\s*void/', $source) !== 1) {
        $errors[] = basename($file).' has no forward-only down() method';
    }
}

if (count($schemaFiles) !== count($contract)) {
    $errors[] = sprintf('expected %d schema migrations, found %d', count($contract), count($schemaFiles));
}

foreach ($contract as $table => $columns) {
    if (! str_contains($combined, "Schema::create('{$table}'")) {
        $errors[] = "missing migration for {$table}";
        continue;
    }

    $tableStart = strpos($combined, "Schema::create('{$table}'");
    $nextCreate = strpos($combined, 'Schema::create(', $tableStart + 1);
    $tableSource = substr($combined, $tableStart, $nextCreate === false ? null : $nextCreate - $tableStart);
    $columnSource = $tableSource;
    foreach ($files as $migrationFile) {
        $migrationSource = (string) file_get_contents($migrationFile);
        if (str_contains($migrationSource, "Schema::table('{$table}'")) {
            $columnSource .= "\n".$migrationSource;
        }
    }

    foreach ($columns as $column) {
        if ($column === 'id') {
            $found = str_contains($columnSource, "uuid('id')");
        } else {
            $found = preg_match("/->(?:string|char|uuid|boolean|unsignedTinyInteger|unsignedSmallInteger|unsignedInteger|unsignedBigInteger|bigInteger|integer|decimal|json|text|timestamp|dateTime|date)\\('".preg_quote($column, '/')."'/", $columnSource) === 1;
        }
        if (! $found) {
            $errors[] = "{$table}.{$column} is missing from migration source";
        }
    }

    if (! str_contains($tableSource, "'company_id'")) {
        $errors[] = "{$table} is not company-scoped";
    }
    if (! str_contains($tableSource, '->timestamps()')) {
        $errors[] = "{$table} is missing Eloquent timestamps";
    }
}

$modelTable = [];
foreach (glob($root.'/Models/*.php') ?: [] as $modelFile) {
    if (basename($modelFile) === 'CompanyScopedModel.php') {
        continue;
    }
    $source = (string) file_get_contents($modelFile);
    if (preg_match('~protected \\$table = \'([^\']+)\'~', $source, $m) !== 1) {
        $errors[] = basename($modelFile).' has no explicit table';
        continue;
    }
    $table = $m[1];
    $modelTable[] = $table;
    if (! isset($contract[$table])) {
        $errors[] = basename($modelFile)." table {$table} is absent from schema contract";
        continue;
    }
    if (preg_match('~protected \\$fillable = \\[(.*?)\\];~s', $source, $m) === 1) {
        preg_match_all("/'([^']+)'/", $m[1], $fields);
        foreach ($fields[1] as $field) {
            if (! in_array($field, $contract[$table], true)) {
                $errors[] = basename($modelFile)." fillable field {$field} is absent from {$table} migration";
            }
        }
    }
}

sort($modelTable);
$contractTables = array_keys($contract);
sort($contractTables);
if ($modelTable !== $contractTables) {
    $errors[] = 'model tables and schema-contract tables differ';
}

if (substr_count($combined, "->index('" ) < 12) {
    $errors[] = 'expected at least one explicit index in each migration';
}

if ($errors !== []) {
    foreach ($errors as $error) {
        fwrite(STDERR, "ERROR: {$error}\n");
    }
    exit(1);
}

echo sprintf(
    "OK: %d owned tables, %d total migrations (%d schema + %d additive + %d operational), model fillables covered, forward-only rollbacks verified\n",
    count($contract),
    count($files),
    count($schemaFiles),
    count($additiveFiles),
    count($files) - count($schemaFiles) - count($additiveFiles),
);
