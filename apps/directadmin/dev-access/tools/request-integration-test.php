<?php
declare(strict_types=1);

function integration_expect(bool $condition,string $message):void{
 if(!$condition){fwrite(STDERR,'FAIL: '.$message.PHP_EOL);exit(1);}
}
function integration_remove_tree(string $path):void{
 if(is_link($path)||is_file($path)){@unlink($path);return;}
 if(!is_dir($path)) return;
 foreach(scandir($path)?:[] as $entry){
  if($entry==='.'||$entry==='..') continue;
  integration_remove_tree($path.'/'.$entry);
 }
 @rmdir($path);
}
function integration_tree_snapshot(string $root):array{
 $realRoot=realpath($root);
 integration_expect($realRoot!==false,'snapshot root must resolve');
 $snapshot=[];$visit=null;
 $visit=static function(string $path,string $relative)use(&$visit,&$snapshot):void{
  $stat=@lstat($path);
  integration_expect(is_array($stat),'snapshot path must remain readable');
  $mode=$stat['mode']&07777;
  if(is_link($path)){$snapshot[$relative]=['link',$mode,readlink($path)];return;}
  if(is_dir($path)){
   $snapshot[$relative]=['dir',$mode];
   foreach(scandir($path)?:[] as $entry){
    if($entry==='.'||$entry==='..') continue;
    $child=$relative==='.'?$entry:$relative.'/'.$entry;
    $visit($path.'/'.$entry,$child);
   }
   return;
  }
  if(is_file($path)){$snapshot[$relative]=['file',$mode,hash_file('sha256',$path)];return;}
  $snapshot[$relative]=['special',$mode];
 };
 $visit($realRoot,'.');
 ksort($snapshot);
 return $snapshot;
}
function integration_seed_csrf(string $home):string{
 $directory=$home.'/.titan-dev-access';
 integration_expect(mkdir($directory,0700,true),'read-only test CSRF fixture must be created');
 chmod($directory,0700);
 $secret=bin2hex(random_bytes(32));
 integration_expect(file_put_contents($directory.'/csrf.key',$secret,LOCK_EX)!==false,'read-only test CSRF fixture must be written');
 chmod($directory.'/csrf.key',0600);
 return hash_hmac('sha256','titan_dev_access_form_v2',$secret);
}
function integration_start_web_server(string $pluginRoot,string $fixture,string $username,string $emptyHome,string $existingHome,array $baseEnvironment):array{
 $router=$fixture.'/directadmin-web-router.php';
 $routerSource=<<<'PHP'
<?php
$role=$_SERVER['HTTP_X_TDA_TEST_ROLE']??'';
$homeId=$_SERVER['HTTP_X_TDA_TEST_HOME']??'';
$homes=['empty'=>getenv('TDA_TEST_HOME_EMPTY'),'existing'=>getenv('TDA_TEST_HOME_EXISTING')];
if(!in_array($role,['admin','reseller','user'],true)||!isset($homes[$homeId])||!is_string($homes[$homeId])){http_response_code(400);echo 'Invalid test route';return;}
putenv('HOME='.$homes[$homeId]);
$root=getenv('TDA_TEST_PLUGIN_ROOT');
$entry=$root.'/'.$role.'/index.html';
if(!is_file($entry)){http_response_code(404);echo 'Missing test entrypoint';return;}
echo '<!-- test-sapi='.PHP_SAPI.' -->';
ob_start();
require $entry;
echo ob_get_clean();
PHP;
 integration_expect(file_put_contents($router,$routerSource)!==false,'web test router must be written inside its fixture');
 $socket=@stream_socket_server('tcp://127.0.0.1:0',$errno,$error);
 integration_expect(is_resource($socket),'loopback socket must allocate a test port');
 $address=stream_socket_get_name($socket,false);
 fclose($socket);
 integration_expect(is_string($address)&&preg_match('/:(\d+)$/',$address,$matches)===1,'loopback test port must resolve');
 $port=(int)$matches[1];
 $environment=array_replace($baseEnvironment,[
  'HOME'=>$emptyHome,'USERNAME'=>$username,'USER'=>$username,
  'TDA_TEST_PLUGIN_ROOT'=>$pluginRoot,'TDA_TEST_HOME_EMPTY'=>$emptyHome,'TDA_TEST_HOME_EXISTING'=>$existingHome
 ]);
 $descriptors=[0=>['pipe','r'],1=>['file','/dev/null','a'],2=>['file','/dev/null','a']];
 $process=@proc_open([PHP_BINARY,'-S','127.0.0.1:'.$port,$router],$descriptors,$pipes,$fixture,$environment,['bypass_shell'=>true]);
 integration_expect(is_resource($process),'PHP CLI server must start for non-CLI role coverage');
 fclose($pipes[0]);
 for($attempt=0;$attempt<50;$attempt++){
  $probe=@fsockopen('127.0.0.1',$port,$connectErrno,$connectError,0.1);
  if(is_resource($probe)){fclose($probe);return ['process'=>$process,'port'=>$port];}
  usleep(100000);
 }
 @proc_terminate($process);
 @proc_close($process);
 integration_expect(false,'PHP CLI server must accept loopback requests within five seconds');
 return [];
}
function integration_stop_web_server(?array &$server):void{
 if(is_array($server)&&isset($server['process'])&&is_resource($server['process'])){
  @proc_terminate($server['process']);
  @proc_close($server['process']);
 }
 $server=null;
}
function integration_web_request(string $baseUrl,string $role,string $homeId,string $method,string $body=''):string{
 $headers=['X-TDA-Test-Role: '.$role,'X-TDA-Test-Home: '.$homeId];
 if($method==='POST'){$headers[]='Content-Type: application/x-www-form-urlencoded';}
 $context=stream_context_create(['http'=>[
  'method'=>$method,'header'=>implode("\r\n",$headers),'content'=>$body,'ignore_errors'=>true,'timeout'=>3
 ]]);
 $response=@file_get_contents($baseUrl,false,$context);
 integration_expect(is_string($response),'non-CLI role endpoint must return a response');
 return $response;
}
function integration_run_role(string $root,string $role,array $environment,?string $stdinBody=null):array{
 $entry=$root.'/'.$role.'/index.html';
 integration_expect(is_file($entry)&&is_executable($entry),'packaged role entrypoint must exist and be executable');
 $descriptors=[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']];
 $command=is_executable('/usr/local/bin/php')?[$entry]:[PHP_BINARY,$entry];
 $process=@proc_open($command,$descriptors,$pipes,$root,$environment,['bypass_shell'=>true]);
 integration_expect(is_resource($process),'PHP CLI must start the actual role entrypoint');
 if($stdinBody!==null){
  $offset=0; $length=strlen($stdinBody);
  while($offset<$length){
   $written=fwrite($pipes[0],substr($stdinBody,$offset));
   integration_expect($written!==false&&$written>0,'request body must reach role stdin');
   $offset+=$written;
  }
 }
 fclose($pipes[0]);
 $stdout=(string)stream_get_contents($pipes[1]);
 $stderr=(string)stream_get_contents($pipes[2]);
 fclose($pipes[1]); fclose($pipes[2]);
 $exit=proc_close($process);
 integration_expect($exit===0,'role entrypoint must exit cleanly');
 integration_expect($stderr==='','role entrypoint must not emit PHP errors');
 return [$stdout,$stderr];
}
function integration_token(string $html):string{
 integration_expect(strpos($html,'name="tda_token"')===false,'legacy CSRF field name must not be rendered');
 integration_expect(preg_match('/<input type="hidden" name="csrf" value="([a-f0-9]{64})">/',$html,$matches)===1,'role page must render a canonical CSRF field');
 return $matches[1];
}
function integration_expect_successful_pwd(string $html,string $home):void{
 integration_expect(strpos($html,'Request rejected:')===false,'valid POST transport must not be rejected');
 integration_expect(strpos($html,'Exit code: 0')!==false,'read-only pwd must finish successfully');
 integration_expect(preg_match('~<div class="term">([^<]*)</div>~',$html,$matches)===1,'successful command output must render in the terminal');
 integration_expect(trim(htmlspecialchars_decode($matches[1],ENT_QUOTES))===$home,'pwd output must be limited to the selected account HOME');
}
function integration_expect_transport_rejected(string $html,string $case='invalid transport'):void{
 integration_expect(strpos($html,'Request rejected: malformed or ambiguous form data.')!==false,$case.' must fail closed');
 integration_expect(strpos($html,'Exit code:')===false,$case.' must not execute a command');
}

integration_expect(count($argv)>=2,'pass the extracted final archive directory');
$root=realpath($argv[1]);
integration_expect($root!==false,'final archive must be extracted');
integration_expect(function_exists('posix_geteuid')&&function_exists('posix_getpwuid')&&function_exists('posix_getpwnam'),'POSIX account functions are required for DirectAdmin CLI verification');
$account=posix_getpwuid(posix_geteuid());
integration_expect(is_array($account)&&isset($account['name'],$account['dir']),'effective UNIX user must resolve');
$accountHome=realpath($account['dir']);
integration_expect($accountHome!==false,'effective UNIX HOME must resolve');
$fixture=$accountHome.'/.titan-dev-request-'.bin2hex(random_bytes(6));
$homeA=$fixture.'/account-a';
$homeB=$fixture.'/account-b';
integration_expect(mkdir($homeA,0700,true),'isolated account-A HOME must be created');
integration_expect(mkdir($homeB,0700,true),'isolated account-B HOME must be created');
$webServer=null;
register_shutdown_function(static function()use($fixture,&$webServer):void{
 integration_stop_web_server($webServer);
 integration_remove_tree($fixture);
});

$routes=[
 'admin'=>'/CMD_PLUGINS_ADMIN/titan_dev_access',
 'reseller'=>'/CMD_PLUGINS_RESELLER/titan_dev_access',
 'user'=>'/CMD_PLUGINS/titan_dev_access'
];
$common=[
 'PATH'=>getenv('PATH')?:'/usr/local/bin:/usr/bin:/bin',
 'USERNAME'=>$account['name'],
 'USER'=>$account['name'],
 'HOME'=>$homeA,
 'CONTENT_TYPE'=>'application/x-www-form-urlencoded'
];
foreach(['LD_LIBRARY_PATH','PHP_INI_SCAN_DIR','TMPDIR','LD_PRELOAD','NSS_WRAPPER_PASSWD','NSS_WRAPPER_GROUP'] as $name){$value=getenv($name);if($value!==false)$common[$name]=$value;}

$adminGet=$common+['REQUEST_METHOD'=>'GET','SCRIPT_NAME'=>$routes['admin'],'QUERY_STRING'=>''];
[$adminHtml]=integration_run_role($root,'admin',$adminGet);
$token=integration_token($adminHtml);
integration_expect(strpos($adminHtml,'operator actions enabled')!==false,'admin route must expose operator mode');
integration_expect(substr_count($adminHtml,'action="?pipe_post=yes"')===2,'rendered admin run/add-key forms must request DirectAdmin stdin POST transport');

foreach(['reseller','user'] as $role){
 $environment=$common+['REQUEST_METHOD'=>'GET','SCRIPT_NAME'=>$routes[$role],'QUERY_STRING'=>''];
 [$html]=integration_run_role($root,$role,$environment);
 integration_expect(strpos($html,'name="csrf"')===false,$role.' read-only page must not render mutation CSRF field');
 integration_expect(strpos($html,'read-only')!==false,$role.' page must advertise read-only policy');
 integration_expect(strpos($html,'name="run"')===false,$role.' page must not render terminal action');
 integration_expect(strpos($html,'name="add_key"')===false,$role.' page must not render SSH mutation action');
}

$fields=['csrf'=>$token,'cwd'=>$homeA,'command'=>'pwd','run'=>'1'];
$environment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$routes['admin'],'QUERY_STRING'=>'',
 'CONTENT_LENGTH'=>(string)strlen(http_build_query($fields))
];
foreach($fields as $name=>$value)$environment[$name]=$value;
[$result]=integration_run_role($root,'admin',$environment);
integration_expect_transport_rejected($result,'exploded environment-only POST');

$compensatedFields=$fields;
$compensatedFields['cwd']=$homeA.str_repeat('*',38);
$browserFields=$compensatedFields+['csrf[]'=>$token];
$browserBody=str_replace('%2A','*',http_build_query($browserFields,'','&',PHP_QUERY_RFC1738));
$visibleEnvironmentLength=strlen(http_build_query($compensatedFields,'','&',PHP_QUERY_RFC1738));
integration_expect(strlen($browserBody)===$visibleEnvironmentLength,'browser-serialized 38-asterisk compensation fixture must reproduce the lossy environment length ambiguity');
$environment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$routes['admin'],'QUERY_STRING'=>'',
 'CONTENT_LENGTH'=>(string)strlen($browserBody),
 'csrf'=>$compensatedFields['csrf'],'cwd'=>$compensatedFields['cwd'],
 'command'=>$compensatedFields['command'],'run'=>$compensatedFields['run']
];
[$result]=integration_run_role($root,'admin',$environment);
integration_expect_transport_rejected($result,'valid scalar CSRF plus dropped array field with compensated browser encoding');


foreach(['reseller','user'] as $role){
 $actions=[
  'run'=>['csrf'=>$token,'cwd'=>$homeA,'command'=>'pwd','run'=>'1'],
  'add_key'=>['csrf'=>$token,'public_key'=>'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFixTUREKeyForRolePolicyRegression00000000000000000000000000000000 test','add_key'=>'1'],
  'remove_key'=>['csrf'=>$token,'remove_key'=>'0']
 ];
 foreach($actions as $action=>$fields){
  $environment=$common+[
   'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$routes[$role],'QUERY_STRING'=>'',
   'CONTENT_LENGTH'=>(string)strlen(http_build_query($fields))
  ];
  foreach($fields as $name=>$value)$environment[$name]=$value;
  [$html]=integration_run_role($root,$role,$environment);
  integration_expect(strpos($html,'this DirectAdmin role is read-only')!==false,$role.' CLI '.$action.' POST must fail closed by role policy');
  integration_expect(strpos($html,'Exit code:')===false,$role.' CLI '.$action.' POST must not execute a command');
 }
}

$route=$routes['admin'];
$valid=['csrf'=>$token,'cwd'=>$homeA,'command'=>'pwd','run'=>'1'];
$body=http_build_query($valid);
$stdinEnvironment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'pipe_post=yes',
 'POST'=>'stdin=true','CONTENT_LENGTH'=>(string)strlen($body)
];
[$html]=integration_run_role($root,'admin',$stdinEnvironment,$body);
integration_expect_successful_pwd($html,$homeA);

$rawPostEnvironment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'',
 'POST'=>$body,'CONTENT_LENGTH'=>(string)strlen($body)
];
[$html]=integration_run_role($root,'admin',$rawPostEnvironment);
integration_expect_successful_pwd($html,$homeA);

$missingCsrfBody=http_build_query(['cwd'=>$homeA,'command'=>'pwd','run'=>'1']);
$missingCsrfEnvironment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'pipe_post=yes',
 'POST'=>'stdin=true','CONTENT_LENGTH'=>(string)strlen($missingCsrfBody)
];
[$result]=integration_run_role($root,'admin',$missingCsrfEnvironment,$missingCsrfBody);
integration_expect(strpos($result,'Request rejected: invalid CSRF token.')!==false,'missing CSRF token must fail validation');
integration_expect(strpos($result,'Exit code:')===false,'missing CSRF token must not execute a command');

$negativeBodies=[
 'array-field'=>'csrf%5B%5D='.rawurlencode($token).'&cwd='.rawurlencode($homeA).'&command=pwd&run=1',
 'duplicate-field'=>'csrf='.rawurlencode($token).'&csrf='.rawurlencode($token).'&cwd='.rawurlencode($homeA).'&command=pwd&run=1',
 'malformed-encoding'=>'csrf=%ZZ&cwd='.rawurlencode($homeA).'&command=pwd&run=1',
 'case-variant-field'=>http_build_query($valid).'&CSRF='.rawurlencode($token),
 'ambiguous-action'=>http_build_query(['csrf'=>$token,'cwd'=>$homeA,'command'=>'pwd','run'=>'1','add_key'=>'1'])
];
foreach($negativeBodies as $name=>$badBody){
 $environment=$common+[
  'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'pipe_post=yes',
  'POST'=>'stdin=true','CONTENT_LENGTH'=>(string)strlen($badBody)
 ];
 [$result]=integration_run_role($root,'admin',$environment,$badBody);
 integration_expect_transport_rejected($result,$name);
}

$oversizedBody='csrf='.str_repeat('a',16385);
$environment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'pipe_post=yes',
 'POST'=>'stdin=true','CONTENT_LENGTH'=>(string)strlen($oversizedBody)
];
[$result]=integration_run_role($root,'admin',$environment,$oversizedBody);
integration_expect_transport_rejected($result,'oversized stdin body');

$environment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'',
 'CONTENT_LENGTH'=>'16385','csrf'=>$token,'cwd'=>$homeA,'command'=>'pwd','run'=>'1'
];
[$result]=integration_run_role($root,'admin',$environment);
integration_expect_transport_rejected($result,'oversized environment payload');


$environment=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'csrf='.rawurlencode($token),
 'CONTENT_LENGTH'=>'0','cwd'=>$homeA,'command'=>'pwd','run'=>'1'
];
[$result]=integration_run_role($root,'admin',$environment);
integration_expect_transport_rejected($result,'query-string CSRF field');

$homeBEnvironment=array_replace($common,[
 'REQUEST_METHOD'=>'GET','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'','HOME'=>$homeB
]);
[$htmlB]=integration_run_role($root,'admin',$homeBEnvironment);
$tokenB=integration_token($htmlB);
integration_expect(!hash_equals($token,$tokenB),'separate HOME contexts must have separate CSRF tokens');
$crossHomeFields=['csrf'=>$token,'cwd'=>$homeB,'command'=>'pwd','run'=>'1'];
$crossHomeBody=http_build_query($crossHomeFields);
$crossHome=array_replace($common,[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'','HOME'=>$homeB,
 'POST'=>$crossHomeBody,'CONTENT_LENGTH'=>(string)strlen($crossHomeBody)
]);
[$result]=integration_run_role($root,'admin',$crossHome);
integration_expect(strpos($result,'Request rejected: invalid CSRF token.')!==false,'CSRF token from another account HOME must be rejected');
integration_expect(strpos($result,'Exit code:')===false,'cross-HOME token must not authorize a command');

$other=posix_getpwnam(posix_geteuid()===0?'nobody':'root');
if($other&&isset($other['uid'])&&(int)$other['uid']!==posix_geteuid()){
 $crossAccount=array_replace($common,[
  'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'',
  'USERNAME'=>$other['name'],'USER'=>$other['name'],'HOME'=>$other['dir'],
  'CONTENT_LENGTH'=>'0','csrf'=>$token,'cwd'=>$homeA,'command'=>'pwd','run'=>'1'
 ]);
 [$result]=integration_run_role($root,'admin',$crossAccount);
 integration_expect(strpos($result,'Request rejected: DirectAdmin execution identity is ambiguous.')!==false,'cross-account process identity must be rejected before page diagnostics');
 integration_expect(strpos($result,'Exit code:')===false,'cross-account identity must not authorize a command');
}

$disallowedFields=['csrf'=>$token,'cwd'=>$homeA,'command'=>'cat /etc/passwd','run'=>'1'];
$disallowedBody=http_build_query($disallowedFields);
$disallowed=$common+[
 'REQUEST_METHOD'=>'POST','SCRIPT_NAME'=>$route,'QUERY_STRING'=>'',
 'POST'=>$disallowedBody,'CONTENT_LENGTH'=>(string)strlen($disallowedBody)
];
[$result]=integration_run_role($root,'admin',$disallowed);
integration_expect(strpos($result,'Blocked by Developer Portal policy')!==false,'disallowed command must remain blocked');
integration_expect(strpos($result,'root:x:')===false,'disallowed command must not read system account data');

$homeReadOnly=$fixture.'/read-only-empty-home';
integration_expect(mkdir($homeReadOnly,0700,true),'read-only empty HOME fixture must be created');
$tokenReadOnly=integration_seed_csrf($homeReadOnly);
integration_expect(chmod($homeReadOnly.'/.titan-dev-access',0750),'read-only CSRF directory fixture mode must be set');
integration_expect(chmod($homeReadOnly.'/.titan-dev-access/csrf.key',0640),'read-only CSRF file fixture mode must be set');
$sshFixture=$homeB.'/.ssh/authorized_keys';
integration_expect(file_put_contents($sshFixture,"# read-only regression fixture\n",LOCK_EX)!==false,'existing HOME SSH fixture must be written');
integration_expect(chmod($sshFixture,0640),'existing HOME SSH file fixture mode must be relaxed for mutation detection');
integration_expect(chmod($homeB.'/.ssh',0751),'existing HOME SSH directory fixture mode must be relaxed for mutation detection');
$beforeEmpty=integration_tree_snapshot($homeReadOnly);
$beforeExisting=integration_tree_snapshot($homeB);
$testUsername='tda-test-'.$account['name'].'-'.bin2hex(random_bytes(6));
integration_expect(posix_getpwnam($testUsername)===false,'non-CLI test identity must not resolve to a real account');
$webServer=integration_start_web_server($root,$fixture,$testUsername,$homeReadOnly,$homeB,$common);
$baseUrl='http://127.0.0.1:'.$webServer['port'].'/';
foreach(['admin','reseller','user'] as $role){
 foreach(['empty'=>[$homeReadOnly,$tokenReadOnly,$beforeEmpty],'existing'=>[$homeB,$tokenB,$beforeExisting]] as $homeId=>[$selectedHome,$validToken,$baseline]){
  $get=integration_web_request($baseUrl,$role,$homeId,'GET');
  integration_expect(strpos($get,'<!-- test-sapi=cli-server -->')!==false,'role page must execute under the real non-CLI cli-server SAPI');
  integration_expect(strpos($get,'name="csrf"')===false,$role.' non-CLI GET must not render a mutation CSRF field');
  integration_expect(strpos($get,'read-only')!==false,$role.' non-CLI GET must advertise read-only policy');
  integration_expect(strpos($get,'name="run"')===false&&strpos($get,'name="add_key"')===false,$role.' non-CLI GET must omit mutation controls');
  integration_expect(strpos($get,'ssh_fingerprint=')===false&&strpos($get,'readiness_ssh_dir_mode=unknown')!==false,$role.' non-CLI GET must not disclose key fingerprints or SSH permission metadata');
  integration_expect(integration_tree_snapshot($selectedHome)===$baseline,$role.' non-CLI GET must leave HOME contents and modes unchanged');
  $actions=[
   'run'=>['csrf'=>$validToken,'cwd'=>$selectedHome,'command'=>'pwd','run'=>'1'],
   'add_key'=>['csrf'=>$validToken,'public_key'=>'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFixTUREKeyForRolePolicyRegression00000000000000000000000000000000 test','add_key'=>'1'],
   'remove_key'=>['csrf'=>$validToken,'remove_key'=>'0']
  ];
  foreach($actions as $action=>$fields){
   $post=integration_web_request($baseUrl,$role,$homeId,'POST',http_build_query($fields));
   integration_expect(strpos($post,'<!-- test-sapi=cli-server -->')!==false,'POST must execute under non-CLI SAPI');
   integration_expect(strpos($post,'this DirectAdmin role is read-only')!==false,$role.' non-CLI '.$action.' POST must fail at action dispatch even with valid CSRF');
   integration_expect(strpos($post,'Exit code:')===false,$role.' non-CLI '.$action.' POST must not execute terminal commands');
   integration_expect(integration_tree_snapshot($selectedHome)===$baseline,$role.' non-CLI '.$action.' POST must leave HOME contents and modes unchanged');
  }
 }
}
integration_stop_web_server($webServer);

echo "DirectAdmin role request integration tests passed (actual admin CLI environment/POST/stdin transports; reseller/user CLI and all-role cli-server GET plus valid-CSRF run/key mutation denial; read-only HOME snapshots; malformed, ambiguous, cross-HOME and command-policy cases).".PHP_EOL;
