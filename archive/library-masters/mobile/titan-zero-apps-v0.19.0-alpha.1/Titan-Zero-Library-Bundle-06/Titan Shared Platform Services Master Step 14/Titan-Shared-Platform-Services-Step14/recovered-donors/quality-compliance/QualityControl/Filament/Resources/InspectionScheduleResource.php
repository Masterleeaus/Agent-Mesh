<?php

namespace Modules\QualityControl\Filament\Resources;

use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Modules\QualityControl\Entities\Schedule;
use Modules\QualityControl\Filament\Resources\InspectionScheduleResource\Pages\ListInspectionSchedules;
use Modules\QualityControl\Filament\Resources\InspectionScheduleResource\Pages\ViewInspectionSchedule;
use Modules\QualityControl\Support\InspectionPermissions;

final class InspectionScheduleResource extends Resource
{
    protected static ?string $model = Schedule::class;
    protected static ?string $slug = 'quality-control/inspections';
    protected static ?string $recordTitleAttribute = 'subject';
    protected static \BackedEnum|string|null $navigationIcon = 'heroicon-o-clipboard-document-check';
    protected static \UnitEnum|string|null $navigationGroup = 'Quality';
    protected static ?int $navigationSort = 1;
    protected static ?string $navigationLabel = 'Inspections';
    protected static ?string $modelLabel = 'Inspection';
    protected static ?string $pluralModelLabel = 'Inspections';

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
                Tables\Columns\TextColumn::make('subject')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('worker.name')->label('Worker')->searchable(),
                Tables\Columns\TextColumn::make('inspector.name')->label('Inspector')->searchable(),
                Tables\Columns\TextColumn::make('issue_date')->label('Inspection Date')->date()->sortable(),
                Tables\Columns\TextColumn::make('status')->badge()->sortable(),
                Tables\Columns\TextColumn::make('priority')->badge()->sortable(),
                Tables\Columns\TextColumn::make('qc_outcome')
                    ->label('QC Outcome')
                    ->badge()
                    ->color(fn (?string $state): string => match ($state) {
                        'pass' => 'success',
                        'fail', 'escalated' => 'danger',
                        'needs_reclean' => 'warning',
                        default => 'gray',
                    }),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'open' => 'Open',
                    'pending' => 'Pending',
                    'resolved' => 'Resolved',
                    'closed' => 'Closed',
                ]),
                SelectFilter::make('qc_outcome')->options([
                    'pending' => 'Pending',
                    'pass' => 'Pass',
                    'fail' => 'Fail',
                    'needs_reclean' => 'Needs Reclean',
                    'escalated' => 'Escalated',
                ]),
            ])
            ->actions([Tables\Actions\ViewAction::make()])
            ->bulkActions([])
            ->defaultSort('issue_date', 'desc');
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Inspection schedule')
                ->columns(2)
                ->schema([
                    TextEntry::make('id')->label('ID'),
                    TextEntry::make('subject'),
                    TextEntry::make('worker.name')->label('Worker'),
                    TextEntry::make('inspector.name')->label('Inspector'),
                    TextEntry::make('issue_date')->label('Inspection Date')->date(),
                    TextEntry::make('status')->badge(),
                    TextEntry::make('priority')->badge(),
                    TextEntry::make('qc_outcome')->label('QC Outcome')->badge(),
                    TextEntry::make('qc_outcome_set_at')->label('Outcome Set At')->dateTime(),
                    TextEntry::make('remark')->columnSpanFull(),
                ]),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListInspectionSchedules::route('/'),
            'view' => ViewInspectionSchedule::route('/{record}'),
        ];
    }
}
