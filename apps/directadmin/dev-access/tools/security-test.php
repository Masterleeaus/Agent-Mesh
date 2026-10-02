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
