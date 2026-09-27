<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Http\Controllers;

use App\Extensions\TitanMcp\System\Mcp\Support\AuditLogger;
use App\Extensions\TitanMcp\System\Mcp\Support\McpCatalogue;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationsInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\RecoveryInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\RuntimeDiagnostics;
use App\Extensions\TitanMcp\System\Mcp\Support\TitanMcpMenuSynchronizer;
use App\Extensions\TitanMcp\System\Mcp\Support\TitanMcpSettingsRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\View\View;

final class TitanMcpSettingsController extends Controller
{
    public function __construct(
        private readonly TitanMcpSettingsRepository $settings,
        private readonly TitanMcpMenuSynchronizer $menus,
        private readonly RuntimeDiagnostics $runtime,
        private readonly AuditLogger $audit,
        private readonly OperationsInspector $operations,
        private readonly RecoveryInspector $recovery,
    ) {}


    public function styles(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);
        $path=dirname(__DIR__,3).'/resources/assets/css/admin-overview.css';
        abort_unless(is_file($path),404);
        return response((string)file_get_contents($path),200,[
            'Content-Type'=>'text/css; charset=UTF-8',
            'Cache-Control'=>'private, max-age=3600',
            'X-Content-Type-Options'=>'nosniff',
        ]);
    }

    public function overview(Request $request): View
    {
        $this->authorizeSuperAdmin($request); $this->menus->sync();
        $prefix=trim((string)config('titan_mcp.http.route_prefix','mcp/titan'),'/');
        $audit=$this->audit->verifyIntegrity();
        return view('titan-mcp::admin.overview',[
            'endpoint'=>url('/'.$prefix),
            'mcpRouteRegistered'=>collect(Route::getRoutes())->contains(fn($route)=>trim($route->uri(),'/')===$prefix),
            'toolCount'=>count(McpCatalogue::tools()),
            'contractHash'=>McpCatalogue::contractHash(),
            'auditIntegrity'=>$audit,
            'versions'=>$this->runtime->versions((string)app()->version()),
            'legacyRootProviderDetected'=>class_exists(\App\Providers\TitanMcpServiceProvider::class),
        ]);
    }

    public function tools(Request $request): View
    {
        $this->authorizeSuperAdmin($request); $this->menus->sync();
        return view('titan-mcp::admin.tools',['tools'=>McpCatalogue::tools(),'contractHash'=>McpCatalogue::contractHash()]);
    }

    public function runtime(Request $request): View
    {
        $this->authorizeSuperAdmin($request); $this->menus->sync();
        return view('titan-mcp::admin.runtime',[
            'versions'=>$this->runtime->versions((string)app()->version()),
            'queue'=>$this->operations->queueStatus(),
            'migrations'=>$this->operations->migrationsStatus(100),
            'scheduler'=>$this->operations->schedulerList(100),
        ]);
    }

    public function backups(Request $request): View
    {
        $this->authorizeSuperAdmin($request); $this->menus->sync();
        return view('titan-mcp::admin.backups',['backups'=>$this->recovery->backupsList('all',100)]);
    }

    public function audit(Request $request): View
    {
        $this->authorizeSuperAdmin($request); $this->menus->sync();
        return view('titan-mcp::admin.audit',['audit'=>$this->recovery->auditStatus()]);
    }

    public function permissions(Request $request): View
    {
        $this->authorizeSuperAdmin($request); $this->menus->sync();
        return view('titan-mcp::admin.permissions',['permissionSummary'=>$this->operations->permissionsSummary()]);
    }

    public function settings(Request $request): View
    {
        $this->authorizeSuperAdmin($request); $this->menus->sync();
        $prefix=trim((string)config('titan_mcp.http.route_prefix','mcp/titan'),'/');
        return view('titan-mcp::admin.settings',[
            'saved'=>$this->settings->all(), 'endpoint'=>url('/'.$prefix),
            'mcpRouteRegistered'=>collect(Route::getRoutes())->contains(fn($route)=>trim($route->uri(),'/')===$prefix),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);
        $data=$request->validate([
            'cors_origins'=>['nullable','string','max:4000'], 'rate_limit_ip_per_minute'=>['required','integer','min:1','max:10000'],
            'rate_limit_actor_per_minute'=>['required','integer','min:1','max:10000'], 'max_write_bytes'=>['required','integer','min:1024','max:104857600'],
            'retention_days'=>['required','integer','min:0','max:3650'], 'retention_max_deletes_per_run'=>['required','integer','min:1','max:10000'],
            'timeout_seconds'=>['required','integer','min:1','max:3600'], 'readonly_timeout_seconds'=>['required','integer','min:1','max:3600'],
            'max_output_chars'=>['required','integer','min:1000','max:1000000'], 'mutation_lock_timeout_seconds'=>['required','numeric','min:0.05','max:300'],
            'mutation_ticket_ttl_seconds'=>['required','integer','min:60','max:900'], 'mutation_ticket_max_ttl_seconds'=>['required','integer','min:60','max:3600'],
        ]);
        $origins=array_values(array_unique(array_filter(array_map(static fn($v)=>rtrim(trim($v),'/'),preg_split('/[\r\n,]+/',(string)($data['cors_origins']??''))))));
        foreach($origins as $origin){$parts=parse_url($origin);$scheme=is_array($parts)?strtolower((string)($parts['scheme']??'')):'';$host=is_array($parts)?strtolower((string)($parts['host']??'')):'';$web=in_array($scheme,['http','https'],true)&&filter_var($origin,FILTER_VALIDATE_URL)!==false;$chrome=$scheme==='chrome-extension'&&preg_match('/^[a-p]{32}$/',$host)===1&&!isset($parts['port']);$valid=is_array($parts)&&($web||$chrome)&&!isset($parts['user'],$parts['pass'],$parts['query'],$parts['fragment'])&&(($parts['path']??'')===''||($parts['path']??'')==='/');abort_unless($valid,422,'CORS origins must be canonical HTTP/HTTPS origins or explicitly allowlisted chrome-extension://<32-character-id> origins without paths, credentials, queries, or fragments.');}
        abort_if((int)$data['mutation_ticket_ttl_seconds'] > (int)$data['mutation_ticket_max_ttl_seconds'],422,'Mutation ticket default TTL may not exceed maximum TTL.');
        $bool=fn(string $key):bool=>$request->boolean($key);
        if($bool('enabled')&&app()->environment('production')) abort_if($origins===[],422,'At least one trusted CORS origin is required while Titan MCP is enabled in production.');
        $this->settings->replace([
            'enabled'=>$bool('enabled'),'auth.require_token_scope'=>$bool('require_token_scope'),'http.cors_origins'=>$origins,
            'http.rate_limit_ip_per_minute'=>(int)$data['rate_limit_ip_per_minute'],'http.rate_limit_actor_per_minute'=>(int)$data['rate_limit_actor_per_minute'],
            'security.storage_encryption_attested'=>$bool('storage_encryption_attested'),'repository.max_write_bytes'=>(int)$data['max_write_bytes'],'database.query_enabled'=>$bool('database_query_enabled'),
            'write.enabled'=>$bool('write_enabled'),'write.database_enabled'=>$bool('database_write_enabled'),'destructive.enabled'=>$bool('destructive_enabled'),
            'backups.retention_days'=>(int)$data['retention_days'],'backups.retention_max_deletes_per_run'=>(int)$data['retention_max_deletes_per_run'],
            'execution.enabled'=>$bool('execution_enabled'),'execution.timeout_seconds'=>(int)$data['timeout_seconds'],
            'execution.readonly_timeout_seconds'=>(int)$data['readonly_timeout_seconds'],'execution.max_output_chars'=>(int)$data['max_output_chars'],
            'execution.recover_failed_mutations'=>$bool('recover_failed_mutations'),'execution.mutation_lock_timeout_seconds'=>(float)$data['mutation_lock_timeout_seconds'],
            'mutation_tickets.default_ttl_seconds'=>(int)$data['mutation_ticket_ttl_seconds'],'mutation_tickets.max_ttl_seconds'=>(int)$data['mutation_ticket_max_ttl_seconds'],
        ]);
        return back()->with('status','Titan MCP settings saved. Reload long-running workers if applicable.');
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        $user=$request->user();
        abort_unless($user!==null,403);

        if(method_exists($user,'isSuperAdmin')){
            try{if((bool)$user->isSuperAdmin())return;}catch(\Throwable){}
        }
        if(method_exists($user,'hasRole')){
            try{if((bool)$user->hasRole('super_admin'))return;}catch(\Throwable){}
        }

        abort(403);
    }}
