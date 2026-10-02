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
$gitContext=directadmin_git_repository_context($gitRepo);
expect_true(is_array($gitContext)&&$gitContext['root']===$gitRepo,'ordinary HOME-contained Git root and gitdir must be accepted');
[$gitStatus,$gitStatusExit,$gitStatusClass]=run_cmd('git status --short',$gitRepo);
expect_true($gitStatusExit===0&&$gitStatusClass==='READ','allowlisted status must run successfully inside the validated repository');

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
