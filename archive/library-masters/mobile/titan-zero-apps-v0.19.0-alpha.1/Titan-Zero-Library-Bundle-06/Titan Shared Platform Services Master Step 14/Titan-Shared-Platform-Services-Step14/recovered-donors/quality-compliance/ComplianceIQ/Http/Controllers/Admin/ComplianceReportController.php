<?php
declare(strict_types=1);namespace Modules\ComplianceIQ\Http\Controllers\Admin;
use Illuminate\Http\Request;use Illuminate\Routing\Controller;use Modules\ComplianceIQ\Entities\ComplianceReport;use Modules\ComplianceIQ\Services\Compliance\ComplianceReportService;use Modules\TitanZeroAssurance\Services\ExecutionContextStore;
final class ComplianceReportController extends Controller {
 public function index(){return view('complianceiq::reports.index',['reports'=>ComplianceReport::query()->latest()->paginate(25)]);}
 public function show(int $id,ComplianceReportService $service){$r=ComplianceReport::query()->findOrFail($id);return response()->json(['report'=>$r,'computed'=>$service->build($r)]);}
}