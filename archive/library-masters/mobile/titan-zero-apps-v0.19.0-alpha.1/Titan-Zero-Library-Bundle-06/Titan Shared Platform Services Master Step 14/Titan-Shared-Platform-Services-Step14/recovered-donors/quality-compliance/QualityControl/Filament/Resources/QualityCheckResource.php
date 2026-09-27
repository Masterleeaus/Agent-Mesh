<?php

namespace Modules\QualityControl\Filament\Resources;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Filament\Resources\QualityCheckResource\Pages\ListQualityChecks;
use Modules\QualityControl\Filament\Resources\QualityCheckResource\Pages\ViewQualityCheck;
use Modules\QualityControl\Support\InspectionPermissions;

final class QualityCheckResource extends Resource
{
    protected static ?string $model = QcRecord::class;
    protected static ?string $slug = 'quality-control/quality-checks';
    protected static ?string $recordTitleAttribute = 'id';
    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-check-badge';
    protected static \UnitEnum|string|null $navigationGroup = 'Quality';
    protected static ?int $navigationSort = 2;
    protected static ?string $navigationLabel = 'QC Records';
    protected static ?string $modelLabel = 'QC Record';
    protected static ?string $pluralModelLabel = 'QC Records';

    public static function canViewAny(): bool
    {
        $user = function_exists('user') ? user() : auth()->user();
        if (!$user) {
            return false;
        }

        return $user->can(InspectionPermissions::VIEW)
            || $user->can(InspectionPermissions::LEGACY_VIEW)
            || $user->can(InspectionPermissions::LEGACY_VIEW_INSPECTION);
    }

    public static function canView(Model $record): bool
    {
        $user = function_exists('user') ? user() : auth()->user();

        return $user
            && (int) ($record->company_id ?? 0) === (int) ($user->company_id ?? 0)
            && static::canViewAny();
    }

    public static function canCreate(): bool { return false; }
    public static function canEdit(Model $record): bool { return false; }
    public static function canDelete(Model $record): bool { return false; }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('ID')->sortable(),
                Tables\Columns\TextColumn::make('cleaner.name')->label('Worker')->searchable(),
                Tables\Columns\TextColumn::make('template.name')->label('Template')->searchable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pass' => 'success',
                        'fail' => 'danger',
                        'reclean_required' => 'warning',
                        'reclean_done' => 'info',
                        'closed' => 'gray',
                        default => 'gray',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('severity_level')->label('Severity')->badge()->sortable(),
                Tables\Columns\TextColumn::make('overall_score')->label('Score')->numeric()->sortable(),
                Tables\Columns\IconColumn::make('reclean_triggered')->label('Reclean')->boolean(),
                Tables\Columns\TextColumn::make('inspected_at')->label('Inspected')->dateTime()->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')->options(array_combine(QcRecord::STATUSES, array_map(
                    fn (string $status): string => ucwords(str_replace('_', ' ', $status)),
                    QcRecord::STATUSES
                ))),
                SelectFilter::make('severity_level')->options([
                    'low' => 'Low',
                    'medium' => 'Medium',
                    'high' => 'High',
                    'critical' => 'Critical',
                ]),
                TernaryFilter::make('reclean_triggered')->label('Reclean Triggered'),
            ])
            ->actions([Tables\Actions\ViewAction::make()])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc');
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('QC Record')
                ->columns(2)
                ->schema([
                    TextEntry::make('id')->label('ID'),
                    TextEntry::make('status')->badge(),
                    TextEntry::make('severity_level')->label('Severity')->badge(),
                    TextEntry::make('cleaner.name')->label('Worker'),
                    TextEntry::make('inspector.name')->label('Inspector'),
                    TextEntry::make('template.name')->label('Template'),
                    TextEntry::make('overall_score')->label('Overall Score'),
                    TextEntry::make('risk_score')->label('Risk Score'),
                    TextEntry::make('inspected_at')->label('Inspected At')->dateTime(),
                ]),
            Section::make('Corrective outcome')
                ->columns(2)
                ->schema([
                    IconEntry::make('reclean_triggered')->label('Reclean Triggered')->boolean(),
                    TextEntry::make('reclean_status')->label('Reclean Status'),
                    TextEntry::make('reclean_due_at')->label('Reclean Due')->dateTime(),
                    TextEntry::make('reclean_job_id')->label('Reclean Job ID'),
                    TextEntry::make('complaint_id')->label('Complaint ID'),
                    TextEntry::make('notes')->columnSpanFull(),
                ]),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListQualityChecks::route('/'),
            'view' => ViewQualityCheck::route('/{record}'),
        ];
    }
}
