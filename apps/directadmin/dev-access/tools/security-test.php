<?php
declare(strict_types=1);

function expect_true($condition,string $message):void{
 if(!$condition){fwrite(STDERR,"FAIL: ".$message.PHP_EOL);exit(1);}
}
function remove_test_tree(string $path):void{
 if(is_link($path)||is_file($path)){@unlink($path);return;}
 if(!is_dir($path)) return;
 foreach(scandir($path)?:[] as $entry){
  if($entry==='.'||$entry==='..') continue;
  remove_test_tree($path.'/'.$entry);
 }
 @rmdir($path);
}
function expect_rejected(callable $action,string $message):void{
 try{$action();}catch(Throwable $e){return;}
 expect_true(false,$message);
}
function run_security_git_fixture(array $arguments,string $home):bool{
 $descriptors=[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']];
 $environment=[
  'PATH'=>getenv('PATH')?:'/usr/local/bin:/usr/bin:/bin',
  'HOME'=>$home,
  'GIT_CONFIG_NOSYSTEM'=>'1',
  'GIT_CONFIG_GLOBAL'=>'/dev/null',
  'GIT_TERMINAL_PROMPT'=>'0'
 ];
 $process=@proc_open(array_merge(['git'],$arguments),$descriptors,$pipes,$home,$environment,['bypass_shell'=>true]);
 if(!is_resource($process)) return false;
 fclose($pipes[0]);
 $stdout=(string)stream_get_contents($pipes[1]);
 $stderr=(string)stream_get_contents($pipes[2]);
 fclose($pipes[1]);fclose($pipes[2]);
 return proc_close($process)===0&&$stdout===''&&$stderr==='';
}

expect_true(function_exists('posix_geteuid')&&function_exists('posix_getpwuid')&&function_exists('posix_getpwnam'),'POSIX account context is required for DirectAdmin CLI verification');
$account=posix_getpwuid(posix_geteuid());
expect_true(is_array($account)&&isset($account['name'],$account['dir']),'effective UNIX account must resolve');
$accountHome=realpath($account['dir']);
expect_true($accountHome!==false,'effective UNIX home must resolve');
$root=$accountHome.'/.titan-dev-security-'.bin2hex(random_bytes(6));
$home=$root.'/home/admin';
$sibling=$root.'/home/admin-other';
mkdir($home,0700,true);
mkdir($sibling,0700,true);
register_shutdown_function(static function()use($root):void{remove_test_tree($root);});
putenv('USERNAME='.$account['name']);
putenv('USER='.$account['name']);
putenv('HOME='.$home);

require dirname(__DIR__).'/lib/app.php';

function security_ssh_wire_string(string $value):string{
 return pack('N',strlen($value)).$value;
}
function security_synthetic_public_key(string $algorithm):string{
 if($algorithm==='ssh-ed25519'){
  $public=hex2bin('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
  $blob=security_ssh_wire_string('ssh-ed25519').security_ssh_wire_string($public);
 }elseif($algorithm==='ssh-rsa'){
  $exponent="\x01\x00\x01";
  $modulus="\x7f".str_repeat("\xfb",254);
  $blob=security_ssh_wire_string('ssh-rsa').security_ssh_wire_string($exponent).security_ssh_wire_string($modulus);
 }else{
  throw new RuntimeException('Unsupported security-test fixture algorithm.');
 }
 return $algorithm.' '.base64_encode($blob).' synthetic+fixture&marker=literal%25';
}

expect_true(directadmin_identity_context()!==null,'same-account HOME descendant must be accepted');
expect_true(directadmin_identity_uid_allowed(posix_geteuid()),'non-root effective UID must pass the DirectAdmin identity policy');
expect_true(!directadmin_identity_uid_allowed(0),'root execution must fail closed before SSH key management or command diagnostics');
expect_true(!directadmin_identity_uid_allowed(-1),'invalid effective UID must fail closed');
putenv('USERNAME='.$account['name']);
putenv('USER=root');
putenv('HOME='.$home);
expect_true(directadmin_identity_context()!==null,'documented USERNAME must remain authoritative when inherited USER differs');
putenv('USER='.$account['name']);
$syntheticEd25519=security_synthetic_public_key('ssh-ed25519');
$syntheticRsa=security_synthetic_public_key('ssh-rsa');
$edParts=explode(' ',$syntheticEd25519,3);
$rsaParts=explode(' ',$syntheticRsa,3);
expect_true(strpos($edParts[1],'+')!==false,'synthetic Ed25519 fixture must exercise an encoded plus sign');
expect_true(strpos($rsaParts[1],'+')!==false&&strpos($rsaParts[1],'/')!==false&&substr($rsaParts[1],-2)==='==','synthetic RSA fixture must exercise plus, slash and padding');
expect_true(valid_pubkey($syntheticEd25519),'valid synthetic Ed25519 public blob must pass');
expect_true(valid_pubkey($syntheticEd25519."\r\n"),'one conventional trailing CRLF must be normalized');
expect_true(valid_pubkey($syntheticRsa),'valid synthetic RSA public blob must pass');
$spaceCorruptedEd25519='ssh-ed25519 '.str_replace('+',' ',$edParts[1]).' synthetic+fixture&marker=literal%25';
expect_true(!valid_pubkey($spaceCorruptedEd25519),'form-decoded plus inside the public blob must not accept a shortened base64 prefix');
$splitEd25519='ssh-ed25519'."\n".$edParts[1].' synthetic+fixture';
expect_true(!valid_pubkey($splitEd25519),'line breaks between the key algorithm and blob must be rejected');
$multilineOptions=$syntheticEd25519."\n".'command="synthetic-option-fixture" '.$syntheticEd25519;
expect_true(!valid_pubkey($multilineOptions),'a second options-bearing authorized_keys record must be rejected');
$wrongEmbeddedType='ssh-ed25519 '.$rsaParts[1].' synthetic+fixture';
expect_true(!valid_pubkey($wrongEmbeddedType),'declared algorithm must match the SSH blob algorithm');
expect_true(add_key($splitEd25519)==='Invalid public key format.','malformed key must be rejected before key-directory setup');
expect_true(!is_dir($home.'/.ssh'),'invalid public key must not create or alter the SSH directory');
$terminalFields='csrf='.str_repeat('a',64).'&add_key=1';
$terminalLength=strlen($terminalFields);
expect_true(directadmin_request_body_length_matches($terminalFields,$terminalLength),'exact CONTENT_LENGTH must match the unmodified form body');
expect_true(directadmin_request_body_length_matches($terminalFields."\n",$terminalLength),'one terminal LF may be present beyond CONTENT_LENGTH');
expect_true(directadmin_request_body_length_matches($terminalFields."\r\n",$terminalLength),'one terminal CRLF may be present beyond CONTENT_LENGTH');
expect_true(!directadmin_request_body_length_matches($terminalFields."\n\n",$terminalLength),'two terminal LF bytes beyond CONTENT_LENGTH must fail');
expect_true(!directadmin_request_body_length_matches($terminalFields.'x',$terminalLength),'arbitrary CONTENT_LENGTH mismatch must fail');
$diagnosticReasons=[
 'Invalid content length.'=>'content_length_invalid',
 'Unsupported form content type.'=>'content_type_invalid',
 'Raw DirectAdmin POST body is unavailable.'=>'raw_post_missing',
 'Invalid DirectAdmin POST marker.'=>'post_marker_invalid',
 'Duplicate form field.'=>'duplicate_field',
 'Form fields cannot be supplied in the query string.'=>'query_form_fields',
 'Ambiguous form action.'=>'action_ambiguous',
 'Request body length mismatch.'=>'body_length_mismatch'
];
foreach($diagnosticReasons as $message=>$code) expect_true(directadmin_request_error_code(new RuntimeException($message))===$code,'request error text must map only to static code '.$code);
expect_true(directadmin_request_error_code(new RuntimeException('synthetic-secret-value=must-not-render'))==='request_rejected','unknown request errors must map to a static fallback code');
$_SERVER['TDA_REQUEST_DIAGNOSTIC']=['code'=>'body_length_mismatch','transport'=>'stdin','declared_bytes'=>123,'body_bytes_read'=>125];
expect_true(directadmin_request_diagnostic_summary()==='code=body_length_mismatch transport=stdin declared_bytes=123 body_bytes_read=125','request diagnostics must expose only bounded reason, transport and numeric lengths');
$_SERVER['TDA_REQUEST_DIAGNOSTIC']=['code'=>'synthetic-secret','transport'=>'/home/private','declared_bytes'=>'secret','body_bytes_read'=>'secret'];
expect_true(directadmin_request_diagnostic_summary()==='code=request_rejected transport=unknown declared_bytes=unknown body_bytes_read=unknown','diagnostic output must reject unallowlisted codes, transports and nonnumeric lengths');
unset($_SERVER['TDA_REQUEST_DIAGNOSTIC']);
expect_true((directadmin_parse_form_body($terminalFields."\n")['add_key']??null)==='1','one DirectAdmin transport LF must be normalized after the complete form');
expect_true((directadmin_parse_form_body($terminalFields."\r\n")['add_key']??null)==='1','one DirectAdmin transport CRLF must be normalized after the complete form');
expect_rejected(static function()use($terminalFields){directadmin_parse_form_body($terminalFields."\n\n");},'multiple form terminators must remain rejected');
expect_rejected(static function(){directadmin_parse_form_body('csrf=valid&csrf=second');},'duplicate form fields must fail closed');
expect_rejected(static function(){directadmin_parse_form_body('csrf%5B%5D=valid');},'array form fields must fail closed');
expect_rejected(static function(){directadmin_parse_form_body('csrf=%ZZ');},'malformed percent encoding must fail closed');
expect_rejected(static function(){directadmin_parse_form_body('csrf='.str_repeat('a',16385));},'oversized form bodies must fail closed');
expect_rejected(static function(){directadmin_parse_form_body('csrf=valid&run=1&add_key=1');},'multiple actions in one request must fail closed');
$other=posix_getpwnam(posix_geteuid()===0?'nobody':'root');
if($other&&isset($other['uid'])&&(int)$other['uid']!==posix_geteuid()){
 putenv('USERNAME='.$other['name']);
 putenv('USER='.$other['name']);
 putenv('HOME='.$other['dir']);
 expect_true(directadmin_identity_context()===null,'cross-account environment identity must be rejected');
 putenv('USERNAME='.$account['name']);
 putenv('USER='.$account['name']);
 putenv('HOME='.$home);
}

expect_true(path_within($home,$home)===true,'home must be accepted');
expect_true(path_within($home.'/repo',$home)===true,'descendant must be accepted');
expect_true(path_within($sibling,$home)===false,'sibling-prefix path must be rejected');
expect_true(safe_cwd($sibling)===$home,'safe_cwd must fall back to HOME for sibling-prefix escape');

$outside=$root.'/outside';
mkdir($outside,0700,true);
$link=$home.'/escape-link';
if(function_exists('symlink') && @symlink($outside,$link)){
 expect_true(safe_cwd($link)===$home,'symlink escape must resolve outside HOME and be rejected');
}

[$class,, $allowed]=command_policy('git status');
expect_true($allowed===true && $class==='READ','git status must be allowed as READ');

[$class,, $allowed]=command_policy('git push origin main');
expect_true($allowed===false && $class==='WRITE','git push must fail closed as WRITE');

[$class,, $allowed]=command_policy('rm -rf .');
expect_true($allowed===false && $class==='UNKNOWN','unknown/destructive command must fail closed');

[$class,, $allowed]=command_policy('git status; whoami');
expect_true($allowed===false && $class==='UNKNOWN','shell chaining must fail closed');

[$class,, $allowed]=command_policy('cat /etc/passwd');
expect_true($allowed===false && $class==='UNKNOWN','absolute-path reads must fail closed');

[$class,, $allowed]=command_policy('npm exec rm -rf .');
expect_true($allowed===false && $class==='WRITE','package exec mutation path must fail closed');

[$class,, $allowed]=command_policy('php -r phpinfo();');
expect_true($allowed===false && $class==='UNKNOWN','arbitrary PHP execution must fail closed');

[$class,, $allowed]=command_policy('echo $(id)');
expect_true($allowed===false && $class==='UNKNOWN','shell expansion must fail closed');

$redacted=redact_text("token=abc123\nAuthorization: Bearer super-secret\npassword=hunter2\nremote=https://synthetic-user:synthetic-token@example.invalid/repo.git");
expect_true(strpos($redacted,'abc123')===false,'token value must be redacted');
expect_true(strpos($redacted,'super-secret')===false,'bearer token must be redacted');
expect_true(strpos($redacted,'hunter2')===false,'password must be redacted');
expect_true(strpos($redacted,'synthetic-user')===false&&strpos($redacted,'synthetic-token')===false,'URL userinfo must be redacted from command output');
expect_true(strpos($redacted,'example.invalid/repo.git')!==false,'URL redaction should preserve non-secret destination context');

$gitRepo=$home.'/git-repo';
expect_true(mkdir($gitRepo,0700,true),'isolated Git repository fixture must be created');
$gitDescriptors=[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']];
$gitInit=@proc_open(['git','-c','init.defaultBranch=main','init','--quiet',$gitRepo],$gitDescriptors,$gitPipes,$home,[
 'PATH'=>getenv('PATH')?:'/usr/local/bin:/usr/bin:/bin',
 'HOME'=>$home,
 'GIT_CONFIG_NOSYSTEM'=>'1',
 'GIT_CONFIG_GLOBAL'=>'/dev/null'
],['bypass_shell'=>true]);
expect_true(is_resource($gitInit),'synthetic local Git repository must initialize');
fclose($gitPipes[0]);
$gitInitOut=(string)stream_get_contents($gitPipes[1]);
$gitInitErr=(string)stream_get_contents($gitPipes[2]);
fclose($gitPipes[1]); fclose($gitPipes[2]);
expect_true(proc_close($gitInit)===0&&$gitInitOut===''&&$gitInitErr==='','synthetic Git fixture must initialize without errors');
expect_true(directadmin_git_metadata_tree_safe($gitRepo.'/.git',$home,1)===false,'metadata traversal must stop at a small configured entry bound');
$gitContext=directadmin_git_repository_context($gitRepo);
expect_true(is_array($gitContext)&&$gitContext['root']===$gitRepo,'ordinary HOME-contained Git root and gitdir must be accepted');
[$gitStatus,$gitStatusExit,$gitStatusClass]=run_cmd('git status --short',$gitRepo);
expect_true($gitStatusExit===0&&$gitStatusClass==='READ','allowlisted status must run successfully inside the validated repository');
$linkedWorktree=$home.'/linked-contained';
expect_true(run_security_git_fixture(['-C',$gitRepo,'-c','user.name=Developer Portal Security Test','-c','user.email=dev-portal-security-test@example.invalid','commit','--allow-empty','--quiet','--message','linked worktree fixture'],$home),'synthetic repository must have a commit for linked-worktree coverage');
expect_true(run_security_git_fixture(['-C',$gitRepo,'worktree','add','--detach','--quiet',$linkedWorktree,'HEAD'],$home),'HOME-contained linked worktree must be created for the positive regression');
expect_true(is_file($linkedWorktree.'/.git'),'linked worktree must use DirectAdmin Git pointer-file layout');
$linkedGitDir=directadmin_git_read_pointer($linkedWorktree.'/.git','gitdir',$linkedWorktree,$home,true);
expect_true($linkedGitDir!==null,'linked worktree gitdir pointer must resolve within HOME');
$linkedCommonDir=directadmin_git_read_pointer($linkedGitDir.'/commondir','commondir',$linkedGitDir,$home,true);
expect_true($linkedCommonDir!==null,'linked worktree common directory pointer must resolve within HOME');
$linkedBackPointer=directadmin_git_read_pointer($linkedGitDir.'/gitdir','gitdir',$linkedGitDir,$home,false);
expect_true($linkedBackPointer!==null&&$linkedBackPointer===realpath($linkedWorktree.'/.git'),'linked worktree reverse pointer must identify its .git file');
expect_true(directadmin_git_metadata_tree_safe($linkedGitDir,$home),'linked worktree private metadata must be safe');
expect_true(directadmin_git_metadata_tree_safe($linkedCommonDir,$home),'linked worktree common metadata must be safe');
$linkedContext=directadmin_git_repository_context($linkedWorktree);
expect_true(is_array($linkedContext)&&$linkedContext['root']===$linkedWorktree,'HOME-contained linked worktree must not be falsely rejected');
expect_true(path_within($linkedContext['git_dir'],$home)&&path_within($linkedContext['common_dir'],$home),'linked worktree and common metadata must both remain inside HOME');
[$linkedLog,$linkedLogExit,$linkedLogClass]=run_cmd('git log --oneline -1',$linkedWorktree);
expect_true($linkedLogExit===0&&$linkedLogClass==='READ'&&$linkedLog!=='','read-only Git inspection must work in a validated contained linked worktree');
expect_true(run_security_git_fixture(['-C',$gitRepo,'worktree','remove','--force','--quiet',$linkedWorktree],$home),'contained linked-worktree fixture must clean up through Git');

$outsideRepo=$root.'/outside-git';
expect_true(mkdir($outsideRepo,0700,true),'external Git fixture must be created');
$outsideInit=@proc_open(['git','-c','init.defaultBranch=main','init','--quiet',$outsideRepo],$gitDescriptors,$outsidePipes,$root,[
 'PATH'=>getenv('PATH')?:'/usr/local/bin:/usr/bin:/bin',
 'HOME'=>$root,
 'GIT_CONFIG_NOSYSTEM'=>'1',
 'GIT_CONFIG_GLOBAL'=>'/dev/null'
],['bypass_shell'=>true]);
expect_true(is_resource($outsideInit),'external synthetic Git repository must initialize');
fclose($outsidePipes[0]);
$outsideInitOut=(string)stream_get_contents($outsidePipes[1]);
$outsideInitErr=(string)stream_get_contents($outsidePipes[2]);
fclose($outsidePipes[1]); fclose($outsidePipes[2]);
expect_true(proc_close($outsideInit)===0&&$outsideInitOut===''&&$outsideInitErr==='','external synthetic Git fixture must initialize without errors');

$nestedPack=$gitRepo.'/.git/objects/pack';
if(!is_dir($nestedPack)) expect_true(mkdir($nestedPack,0700,true),'nested Git pack directory must be created for symlink regression');
$nestedPackEntries=array_values(array_diff(scandir($nestedPack)?:[],['.','..']));
expect_true($nestedPackEntries===[],'synthetic Git pack directory must be empty before symlink regression');
expect_true(rmdir($nestedPack),'empty synthetic Git pack directory must be removed before link setup');
$outsidePack=$outsideRepo.'/.git/objects/pack';
if(!is_dir($outsidePack)) expect_true(mkdir($outsidePack,0700,true),'outside Git pack directory must be created for symlink regression');
expect_true(symlink($outsidePack,$nestedPack),'nested Git object pack symlink must be created');
expect_true(directadmin_git_repository_context($gitRepo)===null,'nested Git object symlink outside HOME must be rejected before Git runs');
expect_true(unlink($nestedPack),'nested Git object symlink must be removed after regression');
expect_true(mkdir($nestedPack,0700),'empty Git object pack directory must be restored after regression');
expect_true(directadmin_git_repository_context($gitRepo)!==null,'contained Git repository must recover after nested symlink removal');

$linkedEscape=$home.'/linked-gitdir-escape';
expect_true(mkdir($linkedEscape,0700,true),'linked Git escape fixture must be created');
expect_true(file_put_contents($linkedEscape.'/.git',"gitdir: ".$outsideRepo.'/.git'."\n")!==false,'synthetic linked-worktree pointer must be written');
expect_true(directadmin_git_repository_context($linkedEscape)===null,'linked-worktree gitdir outside selected HOME must be rejected before Git runs');
$escapedReadiness=codex_readiness($linkedEscape,[],['git'=>'/usr/bin/git']);
expect_true($escapedReadiness['git_repository']===false&&$escapedReadiness['git_branch']===null,'Codex readiness must not follow an external gitdir');

$commondirEscape=$home.'/linked-commondir-escape';
expect_true(mkdir($commondirEscape.'/.git',0700,true),'commondir escape fixture must be created');
expect_true(file_put_contents($commondirEscape.'/.git/commondir',$outsideRepo.'/.git'."\n")!==false,'synthetic commondir pointer must be written');
expect_true(directadmin_git_repository_context($commondirEscape)===null,'commondir outside selected HOME must be rejected');

$alternatesFile=$gitRepo.'/.git/objects/info/alternates';
if(!is_dir(dirname($alternatesFile))) expect_true(mkdir(dirname($alternatesFile),0700,true),'Git object metadata fixture path must be created');
expect_true(file_put_contents($alternatesFile,$outsideRepo.'/.git/objects'."\n")!==false,'synthetic external object alternate must be written');
expect_true(directadmin_git_repository_context($gitRepo)===null,'external Git object alternates must be rejected');
expect_true(unlink($alternatesFile),'synthetic external object alternate must be removed');
expect_true(directadmin_git_repository_context($gitRepo)!==null,'contained Git repository must recover after removing the external alternate');

$readOnlyGitCommands=[
 'git status',
 'git status --short',
 'git diff --stat',
 'git diff --name-only',
 'git log --oneline -5',
 'git branch --show-current',
 'git rev-parse --short HEAD',
 'git ls-files',
 'git describe --always --dirty'
];
foreach($readOnlyGitCommands as $command){
 [$class,, $allowed]=command_policy($command);
 expect_true($allowed===true&&$class==='READ',$command.' must be explicitly allowlisted as read-only Git inspection');
}
$remoteConfigBefore=hash_file('sha256',$gitRepo.'/.git/config');
$blockedGitCommands=[
 'git remote add origin https://synthetic-user:synthetic-token@example.invalid/repo.git',
 'git remote remove origin',
 'git remote rename origin backup',
 'git remote set-url origin https://synthetic-user:synthetic-token@example.invalid/new.git',
 'git remote update',
 'git remote -v',
 'git status --git-dir=/tmp/external/.git',
 'git -C /tmp/external status'
];
foreach($blockedGitCommands as $command){
 [$output,$exitCode]=run_cmd($command,$gitRepo);
 expect_true($exitCode===126,$command.' must fail closed without running');
 expect_true(strpos($output,'synthetic-user')===false&&strpos($output,'synthetic-token')===false,$command.' must not disclose URL userinfo');
}
expect_true(hash_file('sha256',$gitRepo.'/.git/config')===$remoteConfigBefore,'blocked remote add/remove/rename/set-url/update commands must not mutate local Git config');
[$class,, $allowed]=command_policy('git show --stat');
expect_true($allowed===false&&$class==='UNKNOWN','unlisted Git read commands must fail closed');




$healthyStatus=normalize_server_node_status(json_encode([
 'schema'=>'titan.server-node.health.v1',
 'status'=>'healthy',
 'ready'=>true,
 'checked_at'=>'2026-10-02T05:00:00Z',
 'checks'=>[
  ['id'=>'web','critical'=>true,'status'=>'healthy','http_status'=>200],
  ['id'=>'workforce','critical'=>true,'status'=>'healthy','http_status'=>204],
 ],
]));
expect_true($healthyStatus['state']==='CONNECTED','healthy Server Node must project CONNECTED');
expect_true(count($healthyStatus['checks'])===2,'Server Node checks must be preserved within bounds');
expect_true($healthyStatus['checks'][0]['id']==='web','Server Node check ID must be sanitized');

$badStatus=normalize_server_node_status('{"schema":"wrong","ready":true}');
expect_true($badStatus['state']==='UNAVAILABLE','unexpected Server Node schema must fail closed');

$oversizedStatus=normalize_server_node_status(str_repeat('x',65537));
expect_true($oversizedStatus['state']==='UNAVAILABLE','oversized Server Node status must fail closed');




expect_true(directadmin_role_can_mutate('admin')===true,'admin route must retain operator actions');
expect_true(directadmin_role_can_mutate('reseller')===false,'reseller route must be read-only');
expect_true(directadmin_role_can_mutate('user')===false,'user route must be read-only');
expect_true(directadmin_role_can_mutate('unknown')===false,'unknown roles must fail closed');


echo "Developer Portal security regression tests passed".PHP_EOL;
