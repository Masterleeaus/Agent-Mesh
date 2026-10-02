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

expect_true(directadmin_identity_context()!==null,'same-account HOME descendant must be accepted');
expect_true(directadmin_identity_uid_allowed(posix_geteuid()),'non-root effective UID must pass the DirectAdmin identity policy');
expect_true(!directadmin_identity_uid_allowed(0),'root execution must fail closed before SSH key management or command diagnostics');
expect_true(!directadmin_identity_uid_allowed(-1),'invalid effective UID must fail closed');
putenv('USERNAME='.$account['name']);
putenv('USER=root');
putenv('HOME='.$home);
expect_true(directadmin_identity_context()!==null,'documented USERNAME must remain authoritative when inherited USER differs');
putenv('USER='.$account['name']);
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

$redacted=redact_text("token=abc123\nAuthorization: Bearer super-secret\npassword=hunter2");
expect_true(strpos($redacted,'abc123')===false,'token value must be redacted');
expect_true(strpos($redacted,'super-secret')===false,'bearer token must be redacted');
expect_true(strpos($redacted,'hunter2')===false,'password must be redacted');



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
