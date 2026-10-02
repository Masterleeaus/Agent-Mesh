<?php
function h($v){return htmlspecialchars((string)$v,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function env_user(){return getenv('USERNAME') ?: (getenv('USER') ?: get_current_user());}
function directadmin_identity_uid_allowed($uid){return is_int($uid)&&$uid>0;}
function directadmin_identity_context(){
 if(!function_exists('posix_geteuid')||!function_exists('posix_getpwuid')||!function_exists('posix_getpwnam')) return null;
 $uid=posix_geteuid(); $account=@posix_getpwuid($uid);
 if(!directadmin_identity_uid_allowed($uid)||!$account||!isset($account['name'],$account['dir'])) return null;
 $username=(string)(getenv('USERNAME') ?: getenv('USER') ?: '');
 if($username===''||preg_match('/^[A-Za-z0-9_.-]{1,128}$/D',$username)!==1) return null;
 $named=@posix_getpwnam($username);
 if(!$named||!isset($named['uid'])||(int)$named['uid']!==$uid) return null;
 $accountHome=realpath($account['dir']);
 if(!$accountHome||!is_dir($accountHome)) return null;
 $requestedHome=getenv('HOME');
 $home=($requestedHome!==false&&$requestedHome!=='')?realpath($requestedHome):$accountHome;
 if(!$home||!is_dir($home)||!path_within($home,$accountHome)) return null;
 $stat=@stat($home);
 if(!$stat||!isset($stat['uid'])||(int)$stat['uid']!==$uid) return null;
 return ['uid'=>$uid,'username'=>$username,'home'=>$home];
}
function home_dir(){
 if(PHP_SAPI==='cli'){
  $context=directadmin_identity_context();
  if($context!==null) return $context['home'];
  if(function_exists('posix_geteuid')&&function_exists('posix_getpwuid')){
   $account=@posix_getpwuid(posix_geteuid());
   if($account&&isset($account['dir'])) return $account['dir'];
  }
  return '/nonexistent';
 }
 $u=env_user(); $p=function_exists('posix_getpwnam')?@posix_getpwnam($u):false;
 return ($p&&isset($p['dir']))?$p['dir']:(getenv('HOME')?:'/tmp');
}
function csrf_secret_file(){ return home_dir().'/.titan-dev-access/csrf.key'; }
function csrf_secret(){
 $path=csrf_secret_file(); $dir=dirname($path);
 if(!is_dir($dir) && !@mkdir($dir,0700,true) && !is_dir($dir)) throw new RuntimeException('Unable to create CSRF directory.');
 @chmod($dir,0700);
 if(!is_file($path)){
  $secret=bin2hex(random_bytes(32)); $tmp=$path.'.tmp.'.getmypid();
  if(file_put_contents($tmp,$secret,LOCK_EX)===false) throw new RuntimeException('Unable to create CSRF secret.');
  @chmod($tmp,0600);
  if(!@rename($tmp,$path)){ @unlink($tmp); throw new RuntimeException('Unable to install CSRF secret.'); }
 }
 @chmod($path,0600);
 $secret=trim((string)@file_get_contents($path));
 if(strlen($secret)<32) throw new RuntimeException('Invalid CSRF secret.');
 return $secret;
}
function csrf(){ return hash_hmac('sha256','titan_dev_access_form_v2',csrf_secret()); }
function check_csrf(){
 $v=$_POST['csrf']??null;
 return is_string($v) && preg_match('/^[a-f0-9]{64}$/D',$v)===1 && hash_equals(csrf(),$v);
}
function post_string($name,$default=''){
 $v=$_POST[$name]??$default;
 return is_string($v)?$v:$default;
}
function directadmin_role_can_mutate($role){return $role==='admin'&&PHP_SAPI==='cli'&&directadmin_identity_context()!==null;}
function directadmin_post_field_names(){return ['csrf','cwd','command','run','public_key','add_key','remove_key'];}
function directadmin_validate_post_fields($fields){
 if(!is_array($fields)||count($fields)>count(directadmin_post_field_names())) throw new RuntimeException('Invalid form fields.');
 $allowed=array_flip(directadmin_post_field_names()); $size=0;
 foreach($fields as $name=>$value){
  if(!is_string($name)||!isset($allowed[$name])||!is_string($value)) throw new RuntimeException('Invalid form field.');
  if(strpos($value,"\0")!==false||preg_match('//u',$value)!==1) throw new RuntimeException('Invalid form value.');
  $size+=strlen($name)+strlen($value);
  if($size>16384||strlen($value)>16384) throw new RuntimeException('Form data exceeds the limit.');
 }
 $actions=0;
 foreach(['run','add_key','remove_key'] as $action){
  if(!array_key_exists($action,$fields)) continue;
  $actions++;
  if($action==='remove_key'){
   if(preg_match('/^[0-9]{1,9}$/D',$fields[$action])!==1) throw new RuntimeException('Invalid form action.');
  }elseif($fields[$action]!=='1'){
   throw new RuntimeException('Invalid form action.');
  }
 }
 if($actions>1) throw new RuntimeException('Ambiguous form action.');
 return $fields;
}
function directadmin_parse_form_body($body){
 if(!is_string($body)||strlen($body)>16386) throw new RuntimeException('Form data exceeds the limit.');
 if($body!==''){
  if(substr($body,-2)==="\r\n") $body=substr($body,0,-2);
  elseif(substr($body,-1)==="\n") $body=substr($body,0,-1);
  if($body==='') throw new RuntimeException('Malformed form terminator.');
 }
 if(strlen($body)>16384) throw new RuntimeException('Form data exceeds the limit.');
 if(strpbrk($body,"\r\n")!==false) throw new RuntimeException('Malformed form terminator.');
 if($body==='') return [];
 $pairs=explode('&',$body);
 if(count($pairs)>count(directadmin_post_field_names())) throw new RuntimeException('Too many form fields.');
 $fields=[];
 foreach($pairs as $pair){
  if($pair===''||preg_match('/%(?![a-f0-9]{2})/i',$pair)) throw new RuntimeException('Malformed form encoding.');
  $equals=strpos($pair,'=');
  if($equals===false||$equals===0) throw new RuntimeException('Malformed form field.');
  $name=urldecode(substr($pair,0,$equals));
  $value=urldecode(substr($pair,$equals+1));
  if(array_key_exists($name,$fields)) throw new RuntimeException('Duplicate form field.');
  if($name===''||strpos($name,'[')!==false||strpos($name,']')!==false) throw new RuntimeException('Array form fields are not allowed.');
  $fields[$name]=$value;
 }
 return directadmin_validate_post_fields($fields);
}
function directadmin_form_content_length(){
 $raw=getenv('CONTENT_LENGTH');
 if($raw===false||$raw==='') return null;
 if(preg_match('/^[0-9]{1,5}$/D',(string)$raw)!==1) throw new RuntimeException('Invalid content length.');
 $length=(int)$raw;
 if($length>16384) throw new RuntimeException('Form data exceeds the limit.');
 return $length;
}
function directadmin_validate_form_content_type(){
 $type=getenv('CONTENT_TYPE');
 if($type!==false&&$type!==''&&preg_match('/^application\/x-www-form-urlencoded(?:\s*;|$)/i',trim((string)$type))!==1){
  throw new RuntimeException('Unsupported form content type.');
 }
}
function directadmin_request_error_code($exception){
 $message=$exception instanceof Throwable?$exception->getMessage():'';
 $codes=[
  'Invalid content length.'=>'content_length_invalid',
  'Form data exceeds the limit.'=>'body_oversized',
  'Unsupported form content type.'=>'content_type_invalid',
  'Query data exceeds the limit.'=>'query_oversized',
  'Malformed query encoding.'=>'query_malformed',
  'Form fields cannot be supplied in the query string.'=>'query_form_fields',
  'Unable to read request body.'=>'stdin_unavailable',
  'Request body length mismatch.'=>'body_length_mismatch',
  'Malformed form terminator.'=>'malformed_terminator',
  'Too many form fields.'=>'too_many_fields',
  'Malformed form encoding.'=>'form_malformed',
  'Malformed form field.'=>'form_malformed',
  'Duplicate form field.'=>'duplicate_field',
  'Array form fields are not allowed.'=>'array_field',
  'Invalid form fields.'=>'field_count_invalid',
  'Invalid form field.'=>'field_invalid',
  'Invalid form value.'=>'field_value_invalid',
  'Ambiguous form action.'=>'action_ambiguous',
  'Invalid form action.'=>'action_invalid',
  'Invalid DirectAdmin POST marker.'=>'post_marker_invalid',
  'Raw DirectAdmin POST body is unavailable.'=>'raw_post_missing'
 ];
 return is_string($message)&&isset($codes[$message])?$codes[$message]:'request_rejected';
}
function directadmin_request_declared_length_hint(){
 $raw=getenv('CONTENT_LENGTH');
 if(!is_string($raw)||preg_match('/^[0-9]{1,5}$/D',$raw)!==1) return null;
 $length=(int)$raw;
 return $length<=16384?$length:null;
}
function directadmin_request_diagnostic($exception){
 $transport=$_SERVER['TDA_REQUEST_TRANSPORT']??'unknown';
 if(!in_array($transport,['stdin','environment','query','marker','unavailable','unknown'],true)) $transport='unknown';
 $observed=$_SERVER['TDA_REQUEST_BODY_BYTES_READ']??null;
 if(!is_int($observed)||$observed<0||$observed>16387) $observed=null;
 $terminalClass=$_SERVER['TDA_REQUEST_TERMINAL_CLASS']??'unknown';
 if(!in_array($terminalClass,['empty','nul','lf','crlf','cr','control','high-bit','printable','unknown'],true)) $terminalClass='unknown';
 return [
  'code'=>directadmin_request_error_code($exception),
  'transport'=>$transport,
  'declared_bytes'=>directadmin_request_declared_length_hint(),
  'body_bytes_read'=>$observed,
  'terminal_class'=>$terminalClass
 ];
}
function directadmin_request_diagnostic_summary(){
 $diagnostic=$_SERVER['TDA_REQUEST_DIAGNOSTIC']??null;
 if(!is_array($diagnostic)) return 'code=request_rejected transport=unknown declared_bytes=unknown body_bytes_read=unknown terminal_class=unknown';
 $codes=['content_length_invalid','body_oversized','content_type_invalid','query_oversized','query_malformed','query_form_fields','stdin_unavailable','body_length_mismatch','malformed_terminator','too_many_fields','form_malformed','duplicate_field','array_field','field_count_invalid','field_invalid','field_value_invalid','action_ambiguous','action_invalid','post_marker_invalid','raw_post_missing','request_rejected'];
 $code=$diagnostic['code']??'request_rejected';
 if(!in_array($code,$codes,true)) $code='request_rejected';
 $transport=$diagnostic['transport']??'unknown';
 if(!in_array($transport,['stdin','environment','query','marker','unavailable','unknown'],true)) $transport='unknown';
 $declared=$diagnostic['declared_bytes']??null;
 if(!is_int($declared)||$declared<0||$declared>16384) $declared='unknown';
 $observed=$diagnostic['body_bytes_read']??null;
 if(!is_int($observed)||$observed<0||$observed>16387) $observed='unknown';
 $terminalClass=$diagnostic['terminal_class']??'unknown';
 if(!in_array($terminalClass,['empty','nul','lf','crlf','cr','control','high-bit','printable','unknown'],true)) $terminalClass='unknown';
 return 'code='.$code.' transport='.$transport.' declared_bytes='.$declared.' body_bytes_read='.$observed.' terminal_class='.$terminalClass;
}
function directadmin_request_body_length_matches($body,$expectedLength){
 if(!is_string($body)||($expectedLength!==null&&(!is_int($expectedLength)||$expectedLength<0))) return false;
 if($expectedLength===null||strlen($body)===$expectedLength) return true;
 if(strlen($body)===$expectedLength+1&&substr($body,-1)==="\n") return true;
 if(strlen($body)===$expectedLength+2&&substr($body,-2)==="\r\n") return true;
 return false;
}
function directadmin_normalize_stdin_transport_terminator($body,$expectedLength){
 if(!is_string($body)||$body===''||substr($body,-1)!=="\0") return $body;
 if($expectedLength!==null&&(!is_int($expectedLength)||$expectedLength<0)) return $body;
 $length=strlen($body);
 $prefix=substr($body,0,-1);
 if($prefix===''||strpos($prefix,"\0")!==false) return $body;
 if($expectedLength!==null&&$length!==$expectedLength+1) return $body;
 return $prefix;
}
function directadmin_request_terminal_byte_class($body){
 if(!is_string($body)||$body==='') return 'empty';
 $length=strlen($body);
 if($length>=2&&substr($body,-2)==="\r\n") return 'crlf';
 $last=ord($body[$length-1]);
 if($last===0) return 'nul';
 if($last===10) return 'lf';
 if($last===13) return 'cr';
 if($last<32||$last===127) return 'control';
 if($last>=128) return 'high-bit';
 return 'printable';
}
function directadmin_fields_from_stdin($expectedLength){
 directadmin_validate_form_content_type();
 $stream=@fopen('php://stdin','rb');
 if(!$stream) throw new RuntimeException('Unable to read request body.');
 $body=stream_get_contents($stream,16387);
 fclose($stream);
 if(!is_string($body)) throw new RuntimeException('Unable to read request body.');
 $_SERVER['TDA_REQUEST_BODY_BYTES_READ']=strlen($body);
 $_SERVER['TDA_REQUEST_TERMINAL_CLASS']=directadmin_request_terminal_byte_class($body);
 if(strlen($body)>16386) throw new RuntimeException('Form data exceeds the limit.');
 // Normalize one raw NUL only at the pipe_post stdin boundary and only when it is outside the declared form bytes.
 // The strict form parser still rejects interior, repeated, encoded, and invalid UTF-8 values.
 $body=directadmin_normalize_stdin_transport_terminator($body,$expectedLength);
 if(!directadmin_request_body_length_matches($body,$expectedLength)) throw new RuntimeException('Request body length mismatch.');
 return directadmin_parse_form_body($body);
}
function directadmin_fields_from_request(){
 $marker=getenv('POST');
 $_SERVER['TDA_REQUEST_TRANSPORT']=$marker==='stdin=true'?'stdin':(($marker!==false&&$marker!=='')?'environment':'unknown');
 $_SERVER['TDA_REQUEST_BODY_BYTES_READ']=null;
 $length=directadmin_form_content_length();
 directadmin_validate_form_content_type();
 $query=(string)(getenv('QUERY_STRING')?:'');
 if(strlen($query)>16384){
  $_SERVER['TDA_REQUEST_TRANSPORT']='query';
  throw new RuntimeException('Query data exceeds the limit.');
 }
 if($query!==''){
  $_SERVER['TDA_REQUEST_TRANSPORT']='query';
  foreach(explode('&',$query) as $pair){
   $rawName=explode('=',$pair,2)[0];
   if(preg_match('/%(?![a-f0-9]{2})/i',$rawName)) throw new RuntimeException('Malformed query encoding.');
   $queryName=strtolower(urldecode($rawName));
   foreach(directadmin_post_field_names() as $field){
    if($queryName===$field||strncmp($queryName,$field.'[',strlen($field)+1)===0) throw new RuntimeException('Form fields cannot be supplied in the query string.');
   }
  }
 }
 if($marker==='stdin=true'){
  $_SERVER['TDA_REQUEST_TRANSPORT']='stdin';
  return directadmin_fields_from_stdin($length);
 }
 if($marker!==false&&$marker!==''){
  if(strncmp($marker,'stdin=',6)===0){
   $_SERVER['TDA_REQUEST_TRANSPORT']='marker';
   throw new RuntimeException('Invalid DirectAdmin POST marker.');
  }
  $_SERVER['TDA_REQUEST_TRANSPORT']='environment';
  $_SERVER['TDA_REQUEST_BODY_BYTES_READ']=strlen($marker);
  $_SERVER['TDA_REQUEST_TERMINAL_CLASS']=directadmin_request_terminal_byte_class($marker);
  if(strlen($marker)>16386) throw new RuntimeException('Form data exceeds the limit.');
  if(!directadmin_request_body_length_matches($marker,$length)) throw new RuntimeException('Request body length mismatch.');
  return directadmin_parse_form_body($marker);
 }
 $_SERVER['TDA_REQUEST_TRANSPORT']='unavailable';
 throw new RuntimeException('Raw DirectAdmin POST body is unavailable.');
}
function bootstrap_directadmin_request($role='admin'){
 if(!in_array($role,['admin','reseller','user'],true)) $role='user';
 $_SERVER['TDA_ROLE']=$role;
 if(PHP_SAPI!=='cli') return;
 $method=strtoupper(trim((string)(getenv('REQUEST_METHOD')?:'GET')));
 $_POST=[]; $_SERVER['REQUEST_METHOD']=$method;
 unset($_SERVER['TDA_REQUEST_REJECTED'],$_SERVER['TDA_REQUEST_DIAGNOSTIC'],$_SERVER['TDA_REQUEST_TRANSPORT'],$_SERVER['TDA_REQUEST_BODY_BYTES_READ'],$_SERVER['TDA_REQUEST_TERMINAL_CLASS']);
 if(!in_array($method,['GET','POST'],true)){
  $_SERVER['REQUEST_METHOD']='POST'; $_SERVER['TDA_REQUEST_REJECTED']='input'; return;
 }
 if(directadmin_identity_context()===null){
  $_SERVER['TDA_REQUEST_REJECTED']='context'; return;
 }
 if($method!=='POST') return;
 if(!directadmin_role_can_mutate($role)){
  $_SERVER['TDA_REQUEST_REJECTED']='role'; return;
 }
 try{$_POST=directadmin_fields_from_request();}
 catch(Throwable $e){$_POST=[];$_SERVER['TDA_REQUEST_DIAGNOSTIC']=directadmin_request_diagnostic($e);$_SERVER['TDA_REQUEST_REJECTED']='input';}
}
function key_dir(){return home_dir().'/.ssh';}
function key_file(){return key_dir().'/authorized_keys';}
function directadmin_ssh_blob_read_string($blob,&$offset){
 if(!is_string($blob)||!is_int($offset)) return null;
 $total=strlen($blob);
 if($offset<0||$offset>$total||$total-$offset<4) return null;
 $header=unpack('Nlength',substr($blob,$offset,4));
 if(!is_array($header)||!isset($header['length'])) return null;
 $offset+=4;
 $length=$header['length'];
 if(!is_int($length)||$length<0||$length>$total-$offset) return null;
 $value=substr($blob,$offset,$length);
 $offset+=$length;
 return $value;
}
function directadmin_ssh_blob_valid_positive_mpint($value){
 if(!is_string($value)||$value==='') return false;
 $length=strlen($value);
 $first=ord($value[0]);
 if(($first&0x80)!==0) return false;
 if($first===0&&($length===1||(ord($value[1])&0x80)===0)) return false;
 return true;
}
function valid_pubkey($k){
 if(!is_string($k)||strpos($k,"\0")!==false) return false;
 $line=trim($k);
 if($line===''||strpos($line,"\r")!==false||strpos($line,"\n")!==false) return false;
 if(preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/',$line)===1) return false;
 if(preg_match('/\A(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(?:256|384|521))[ \t]+([A-Za-z0-9+\/]+={0,2})(?:[ \t]+[^\r\n]*)?\z/D',$line,$matches)!==1) return false;
 $blob=base64_decode($matches[2],true);
 if(!is_string($blob)||base64_encode($blob)!==$matches[2]) return false;
 $offset=0;
 $blobType=directadmin_ssh_blob_read_string($blob,$offset);
 if($blobType!==$matches[1]) return false;
 if($matches[1]==='ssh-ed25519'){
  $public=directadmin_ssh_blob_read_string($blob,$offset);
  if(!is_string($public)||strlen($public)!==32) return false;
 }elseif($matches[1]==='ssh-rsa'){
  $exponent=directadmin_ssh_blob_read_string($blob,$offset);
  $modulus=directadmin_ssh_blob_read_string($blob,$offset);
  if(!directadmin_ssh_blob_valid_positive_mpint($exponent)||!directadmin_ssh_blob_valid_positive_mpint($modulus)) return false;
 }else{
  $curve=directadmin_ssh_blob_read_string($blob,$offset);
  $point=directadmin_ssh_blob_read_string($blob,$offset);
  $expectedCurve=substr($matches[1],strlen('ecdsa-sha2-'));
  $pointLengths=['nistp256'=>65,'nistp384'=>97,'nistp521'=>133];
  if($curve!==$expectedCurve||!is_string($point)||strlen($point)!==$pointLengths[$expectedCurve]||$point[0]!=="\x04") return false;
 }
 return $offset===strlen($blob);
}
function ensure_ssh(){ $d=key_dir(); if(!is_dir($d) && !mkdir($d,0700,true) && !is_dir($d)) throw new RuntimeException('Unable to create .ssh directory.'); chmod($d,0700); if(!file_exists(key_file())) touch(key_file()); chmod(key_file(),0600); }
function add_key($k){
 $k=is_string($k)?trim($k):'';
 if(!valid_pubkey($k)) return 'Invalid public key format.';
 ensure_ssh();
 $lines=file(key_file(),FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[];
 if(in_array($k,$lines,true)) return 'Key already installed.';
 file_put_contents(key_file(),$k."\n",FILE_APPEND|LOCK_EX);
 chmod(key_file(),0600);
 return 'Public key installed.';
}
function remove_key($idx){ ensure_ssh(); if(!is_int($idx)||$idx<0) return 'Key not found.'; $lines=file(key_file(),FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[]; if(!isset($lines[$idx])) return 'Key not found.'; unset($lines[$idx]); file_put_contents(key_file(),$lines?implode("\n",$lines)."\n":'',LOCK_EX); chmod(key_file(),0600); return 'Key revoked.'; }
function fingerprints(){ ensure_ssh(); $out=[]; foreach((file(key_file(),FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[]) as $i=>$k){ $tmp=tempnam(sys_get_temp_dir(),'tda'); if($tmp===false){$out[]=[$i,'fingerprint unavailable'];continue;} file_put_contents($tmp,$k."\n"); $fp=trim((string)shell_exec('ssh-keygen -lf '.escapeshellarg($tmp).' 2>/dev/null')); @unlink($tmp); $out[]=[$i,$fp?:'fingerprint unavailable']; } return $out; }
function path_within($path,$root){
 $path=rtrim(str_replace('\\','/',(string)$path),'/'); $root=rtrim(str_replace('\\','/',(string)$root),'/');
 return $path===$root || ($root!=='' && strncmp($path,$root.'/',strlen($root)+1)===0);
}
function safe_cwd($requested){
 $home=realpath(home_dir())?:home_dir();
 $requested=is_string($requested)?trim($requested):'';
 $cwd=$requested!==''?realpath($requested):$home;
 if(!$cwd || !is_dir($cwd) || !path_within($cwd,$home)) return $home;
 return $cwd;
}
function directadmin_git_metadata_path_safe($path,$home,$expectDirectory){
 $stat=@lstat($path);
 if($stat===false) return true;
 $resolved=realpath($path);
 if($resolved===false||!path_within($resolved,$home)) return false;
 return $expectDirectory?is_dir($resolved):is_file($resolved);
}
/**
 * Git follows nested paths under refs and objects. Fail closed on every
 * metadata symlink and bound the scan so a large repository cannot stall a request.
 */
function directadmin_git_metadata_tree_safe($directory,$home,$entryLimit=65536){
 if(!is_int($entryLimit)||$entryLimit<1||$entryLimit>65536) return false;
 $resolvedRoot=realpath($directory);
 $rootStat=@lstat($directory);
 if($resolvedRoot===false||!path_within($resolvedRoot,$home)||$rootStat===false||(($rootStat['mode']&0170000)!==0040000)) return false;
 $pending=[$resolvedRoot];
 $visited=0;
 while($pending){
  $current=array_pop($pending);
  $handle=@opendir($current);
  if($handle===false) return false;
  try{
   while(($entry=@readdir($handle))!==false){
    if($entry==='.'||$entry==='..') continue;
    if(++$visited>$entryLimit) return false;
    $child=$current.'/'.$entry;
    $stat=@lstat($child);
    if($stat===false) return false;
    $type=$stat['mode']&0170000;
    if($type===0120000) return false;
    if($type===0040000){
     $resolved=realpath($child);
     if($resolved===false||!path_within($resolved,$home)) return false;
     $pending[]=$resolved;
     continue;
    }
    if($type!==0100000) return false;
   }
  }finally{
   @closedir($handle);
  }
 }
 return true;
}
function directadmin_git_resolve_path($path,$base,$home,$expectDirectory){
 if(!is_string($path)||$path===''||strpos($path,"\0")!==false) return null;
 $candidate=$path[0]==='/'?$path:rtrim($base,'/').'/'.$path;
 $resolved=realpath($candidate);
 if($resolved===false||!path_within($resolved,$home)) return null;
 if($expectDirectory?!is_dir($resolved):!is_file($resolved)) return null;
 return $resolved;
}
function directadmin_git_read_pointer($file,$label,$base,$home,$expectDirectory){
 if(!directadmin_git_metadata_path_safe($file,$home,false)) return null;
 $resolvedFile=realpath($file);
 if($resolvedFile===false||!is_file($resolvedFile)||!path_within($resolvedFile,$home)) return null;
 $raw=@file_get_contents($resolvedFile,false,null,0,4097);
 if(!is_string($raw)||strlen($raw)>4096||strpos($raw,"\0")!==false) return null;
 if(in_array($label,['commondir','worktree-gitdir'],true)){
  // Git stores linked worktree commondir and reverse gitdir pointers as bare paths.
  $pattern='/\\A([^\\r\\n]+)(?:\\r?\\n)?\\z/D';
 }else{
  $pattern='/\\A'.preg_quote($label,'/').': ([^\\r\\n]+)(?:\\r?\\n)?\\z/D';
 }
 if(preg_match($pattern,$raw,$matches)!==1) return null;
 return directadmin_git_resolve_path($matches[1],$base,$home,$expectDirectory);
}
function directadmin_git_alternates_safe($objects,$home){
 if(@lstat($objects)===false) return true;
 if(!directadmin_git_metadata_path_safe($objects,$home,true)) return false;
 $objectsReal=realpath($objects);
 if($objectsReal===false) return false;
 $info=$objectsReal.'/info';
 if(!directadmin_git_metadata_path_safe($info,$home,true)){
  if(@lstat($info)===false) return true;
  return false;
 }
 $alternates=$info.'/alternates';
 if(!directadmin_git_metadata_path_safe($alternates,$home,false)){
  if(@lstat($alternates)===false) return true;
  return false;
 }
 if(@lstat($alternates)===false) return true;
 $resolvedAlternates=realpath($alternates);
 if($resolvedAlternates===false) return false;
 $raw=@file_get_contents($resolvedAlternates,false,null,0,16385);
 if(!is_string($raw)||strlen($raw)>16384||strpos($raw,"\0")!==false) return false;
 if($raw==='') return true;
 $lines=preg_split('/\r?\n/',$raw);
 if(!$lines) return false;
 if(end($lines)==='') array_pop($lines);
 foreach($lines as $line){
  if($line===''||strpos($line,"\r")!==false) return false;
  if(directadmin_git_resolve_path($line,$objectsReal,$home,true)===null) return false;
 }
 return true;
}
function directadmin_git_repository_context($requested){
 $home=realpath(home_dir());
 if($home===false||!is_dir($home)) return null;
 $directory=safe_cwd($requested);
 if(!path_within($directory,$home)) return null;
 $cursor=$directory;
 while(path_within($cursor,$home)){
  $gitEntry=$cursor.'/.git';
  if(@lstat($gitEntry)!==false){
   if(is_dir($gitEntry)){
    $gitDirectory=realpath($gitEntry);
    if($gitDirectory===false||!path_within($gitDirectory,$home)) return null;
   }else{
    $gitDirectory=directadmin_git_read_pointer($gitEntry,'gitdir',$cursor,$home,true);
    if($gitDirectory===null) return null;
   }
   $commonDirectory=$gitDirectory;
   $commonPointer=$gitDirectory.'/commondir';
   if(@lstat($commonPointer)!==false){
    $commonDirectory=directadmin_git_read_pointer($commonPointer,'commondir',$gitDirectory,$home,true);
    if($commonDirectory===null) return null;
   }
   $worktreePointer=$gitDirectory.'/gitdir';
   if(@lstat($worktreePointer)!==false){
    $backPointer=directadmin_git_read_pointer($worktreePointer,'worktree-gitdir',$gitDirectory,$home,false);
    $expectedEntry=realpath($gitEntry);
    if($backPointer===null||$expectedEntry===false||$backPointer!==$expectedEntry) return null;
   }
   foreach(array_values(array_unique([$gitDirectory,$commonDirectory])) as $metadataDirectory){
    if(!directadmin_git_metadata_tree_safe($metadataDirectory,$home)) return null;
    foreach(['HEAD','config','packed-refs','index','shallow','commondir','gitdir'] as $file){
     if(!directadmin_git_metadata_path_safe($metadataDirectory.'/'.$file,$home,false)) return null;
    }
    foreach(['objects','refs','logs'] as $subdirectory){
     $path=$metadataDirectory.'/'.$subdirectory;
     if(!directadmin_git_metadata_path_safe($path,$home,true)&&@lstat($path)!==false) return null;
    }
    if(!directadmin_git_alternates_safe($metadataDirectory.'/objects',$home)) return null;
   }
   return ['root'=>$cursor,'git_dir'=>$gitDirectory,'common_dir'=>$commonDirectory];
  }
  $parent=dirname($cursor);
  if($parent===$cursor||!path_within($parent,$home)) break;
  $cursor=$parent;
 }
 return null;
}
function directadmin_git_command_args($context,$arguments){
 $subcommand=$arguments[0]??null;
 if(in_array($subcommand,['diff','show'],true)){
  foreach(['--no-textconv','--no-ext-diff'] as $flag){
   if(!in_array($flag,$arguments,true)) $arguments[]=$flag;
  }
 }
 return array_merge([
  'git',
  '--git-dir',$context['git_dir'],
  '--work-tree',$context['root'],
  '-c','core.bare=false',
  '-c','core.worktree='.$context['root'],
  '-c','core.hooksPath=/dev/null',
  '-c','core.fsmonitor=false',
  '-c','credential.helper=',
  '-c','diff.external=',
  '--no-pager'
 ],$arguments);
}
function directadmin_git_environment(){
 return [
  'PATH'=>getenv('PATH')?:'/usr/local/bin:/usr/bin:/bin',
  'HOME'=>home_dir(),
  'GIT_CONFIG_NOSYSTEM'=>'1',
  'GIT_CONFIG_GLOBAL'=>'/dev/null',
  'GIT_OPTIONAL_LOCKS'=>'0',
  'GIT_NO_LAZY_FETCH'=>'1',
  'GIT_TERMINAL_PROMPT'=>'0',
  'GIT_PAGER'=>'cat',
  'PAGER'=>'cat'
 ];
}
function directadmin_git_probe($context,$arguments){
 $argv=array_merge(['/usr/bin/env','timeout','5s'],directadmin_git_command_args($context,$arguments));
 $spec=[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']];
 $proc=@proc_open($argv,$spec,$pipes,$context['root'],directadmin_git_environment());
 if(!is_resource($proc)) return ['status'=>'unknown','output'=>null,'reason'=>'spawn_failed'];
 fclose($pipes[0]);
 $out=stream_get_contents($pipes[1],8193);
 $err=stream_get_contents($pipes[2],8193);
 fclose($pipes[1]); fclose($pipes[2]);
 $rc=proc_close($proc);
 if(!is_string($out)||!is_string($err)) return ['status'=>'unknown','output'=>null,'reason'=>'output_read_failed'];
 if(strlen($out)>8192||strlen($err)>8192) return ['status'=>'unknown','output'=>null,'reason'=>'output_oversized'];
 if(in_array($rc,[124,137,143],true)) return ['status'=>'unknown','output'=>null,'reason'=>'timeout'];
 if($rc!==0) return ['status'=>'unknown','output'=>null,'reason'=>'command_failed'];
 return ['status'=>'success','output'=>trim($out),'reason'=>null];
}
function directadmin_git_probe_output($probe){
 if(!is_array($probe)||($probe['status']??null)!=='success'||!array_key_exists('output',$probe)||!is_string($probe['output'])) return null;
 return $probe['output'];
}
function directadmin_git_parse_divergence($raw){
 if(!is_string($raw)||strlen($raw)>32||!preg_match('/^(0|[1-9][0-9]{0,9})\t(0|[1-9][0-9]{0,9})$/D',$raw,$matches)) return null;
 return ['ahead'=>(int)$matches[1],'behind'=>(int)$matches[2]];
}
function directadmin_git_readiness_projection($contextAvailable,$repositoryProbe,$branchProbe,$headProbe,$statusProbe,$upstreamProbe){
 $repositoryOutput=directadmin_git_probe_output($repositoryProbe);
 if(!$contextAvailable){
  $repositoryState='unavailable';
  $repository=false;
 }elseif($repositoryOutput==='true'){
  $repositoryState='available';
  $repository=true;
 }elseif($repositoryOutput==='false'){
  $repositoryState='not_repository';
  $repository=false;
 }else{
  $repositoryState='unknown';
  $repository=null;
 }
 $branchOutput=$repository===true?directadmin_git_probe_output($branchProbe):null;
 $headOutput=$repository===true?directadmin_git_probe_output($headProbe):null;
 $statusOutput=$repository===true?directadmin_git_probe_output($statusProbe):null;
 $upstreamOutput=$repository===true?directadmin_git_probe_output($upstreamProbe):null;
 $branchState=$branchOutput===null
  ?($repositoryState==='available'?'unknown':$repositoryState)
  :($branchOutput===''?'detached':'named');
 $branch=$branchState==='named'?redact_text($branchOutput):null;
 $headState=$headOutput===null||$headOutput===''?($repositoryState==='available'?'unknown':$repositoryState):'available';
 $head=$headState==='available'?redact_text($headOutput):null;
 $worktreeState=$statusOutput===null
  ?($repositoryState==='available'?'unknown':$repositoryState)
  :($statusOutput===''?'clean':'dirty');
 $dirty=$worktreeState==='clean'?false:($worktreeState==='dirty'?true:null);
 $divergence=$upstreamOutput===null?null:directadmin_git_parse_divergence($upstreamOutput);
 $upstreamState=$divergence===null
  ?($repositoryState==='available'?'unknown':$repositoryState)
  :'available';
 $claimIssue=null;
 if($branchState==='named'&&preg_match('/^agent\\/issue-([1-9][0-9]{0,17})$/D',$branch,$claimMatch)) $claimIssue=$claimMatch[1];
 $claimValid=$branchState==='detached'?false:($branchState==='named'?($claimIssue!==null):null);
 return [
  'git_repository'=>$repository,
  'git_repository_state'=>$repositoryState,
  'git_branch'=>$branch,
  'git_branch_state'=>$branchState,
  'git_head'=>$head,
  'git_head_state'=>$headState,
  'git_dirty'=>$dirty,
  'git_worktree_state'=>$worktreeState,
  'git_claim_branch_format_valid'=>$claimValid,
  'git_claim_issue_number'=>$claimIssue,
  'git_upstream_configured'=>$divergence===null?null:true,
  'git_upstream_state'=>$upstreamState,
  'git_ahead'=>$divergence['ahead']??null,
  'git_behind'=>$divergence['behind']??null
 ];
}
function command_policy($cmd){
 $cmd=trim((string)$cmd);
 if($cmd==='') return ['EMPTY','Empty command.',false];
 if(strlen($cmd)>4096) return ['UNKNOWN','Command exceeds the 4096 byte limit.',false];
 if(preg_match('/[\\r\\n\\x00;&|><\\x60]/',$cmd)) return ['UNKNOWN','Shell chaining, redirection and metacharacters are not allowed.',false];
 if(strpos($cmd,'$(')!==false || strpos($cmd,'${')!==false) return ['UNKNOWN','Shell expansion is not allowed.',false];
 $parts=preg_split('/\\s+/',$cmd);
 $bin=strtolower($parts[0]??'');
 $readonly=['pwd','whoami','id','uname','date','df','du','ls','stat','cat','head','tail','grep','git','php','node','npm','pnpm','composer'];
 if(!in_array($bin,$readonly,true)) return ['UNKNOWN','Command is not in the Developer Portal allowlist.',false];
 foreach(array_slice($parts,1) as $arg){
  if(strpos($arg,'../')!==false || $arg==='..' || (strlen($arg)>0 && $arg[0]==='/')) return ['UNKNOWN','Absolute paths and parent traversal are not allowed in terminal arguments.',false];
 }
 if($bin==='git'){
  $arguments=array_slice($parts,1);
  $allowed=[
   ['status'],
   ['status','--short'],
   ['diff','--stat'],
   ['diff','--name-only'],
   ['log','--oneline','-5'],
   ['branch','--show-current'],
   ['rev-parse','--short','HEAD'],
   ['ls-files'],
   ['describe','--always','--dirty']
  ];
  if(in_array($arguments,$allowed,true)) return ['READ','Allowlisted read-only Git inspection.',true];
  $sub=strtolower($arguments[0]??'');
  $mutating=['add','checkout','clean','commit','config','fetch','merge','mv','pull','push','rebase','remote','reset','restore','rm','switch','tag','update-ref','worktree'];
  if(in_array($sub,$mutating,true)) return ['WRITE','Git mutation or remote inspection is blocked here; use the governed repository workflow.',false];
  return ['UNKNOWN','Git command is outside the exact read-only subcommand and argument allowlist.',false];
 }
 if(in_array($bin,['npm','pnpm'],true)){
  $sub=strtolower($parts[1]??'');
  if($sub==='test') return ['BUILD/TEST','Package test command.',true];
  if($sub==='run'){
   $script=strtolower($parts[2]??'');
   if(!preg_match('/^(test|build|lint|typecheck|check|verify)(:|$)/',$script)) return ['WRITE','Only test/build/lint/typecheck/check/verify scripts are allowed.',false];
   return ['BUILD/TEST','Approved package verification script.',true];
  }
  if(in_array($sub,['why','list','ls','outdated','audit'],true)) return ['VERIFY','Read-only package diagnostic.',true];
  return ['WRITE','Package mutation/install/exec commands are blocked here.',false];
 }
 if($bin==='composer'){
  $sub=strtolower($parts[1]??'');
  if(in_array($sub,['show','why','validate','audit'],true)) return ['VERIFY','Read-only Composer diagnostic.',true];
  if(in_array($sub,['test','check','lint'],true)) return ['BUILD/TEST','Approved Composer verification script.',true];
  return ['WRITE','Composer mutation/install commands are blocked here.',false];
 }
 if($bin==='php'){
  $sub=strtolower($parts[1]??'');
  if(in_array($sub,['-v','--version','-m','--modules','-i','--info'],true)) return ['VERIFY','PHP runtime diagnostic.',true];
  if($sub==='-l' && isset($parts[2])) return ['VERIFY','PHP syntax verification.',true];
  return ['UNKNOWN','Arbitrary PHP execution is blocked; only runtime info and syntax lint are allowed.',false];
 }
 if($bin==='node'){
  $sub=strtolower($parts[1]??'');
  if(in_array($sub,['-v','--version'],true)) return ['VERIFY','Node runtime diagnostic.',true];
  if($sub==='--test') return ['BUILD/TEST','Node test runner.',true];
  return ['UNKNOWN','Arbitrary Node execution is blocked; use approved package scripts or node --test.',false];
 }
 return ['READ','Allowed read-only command.',true];
}
function run_cmd($cmd,$cwd){
 [$class,$reason,$allowed]=command_policy($cmd);
 if(!$allowed) return ["Blocked by Developer Portal policy [".$class."]: ".$reason,126,$class];
 $cwd=safe_cwd($cwd);
 $parts=preg_split('/\s+/',trim((string)$cmd));
 if(!$parts||!isset($parts[0])) return ['Unable to start command.',127,$class];
 $programParts=$parts;
 $environment=['PATH'=>getenv('PATH')?:'/usr/local/bin:/usr/bin:/bin','HOME'=>home_dir()];
 if(strtolower($parts[0])==='git'){
  $context=directadmin_git_repository_context($cwd);
  if($context===null) return ['Blocked by Developer Portal policy [READ]: Git worktree and metadata must resolve inside the account HOME.',126,'READ'];
  $programParts=directadmin_git_command_args($context,array_slice($parts,1));
  $cwd=$context['root'];
  $environment=directadmin_git_environment();
 }
 $argv=['/usr/bin/env','timeout','30s','/bin/bash','--noprofile','--norc','-c','exec "$@"','tda-command'];
 foreach($programParts as $part)$argv[]=$part;
 $spec=[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']];
 $proc=@proc_open($argv,$spec,$pipes,$cwd,$environment);
 if(!is_resource($proc)) return ['Unable to start command.',127,$class];
 fclose($pipes[0]); stream_set_blocking($pipes[1],false); stream_set_blocking($pipes[2],false);
 $limit=524288; $out=''; $start=microtime(true); $truncated=false;
 while(true){
  $chunk=(string)stream_get_contents($pipes[1]).(string)stream_get_contents($pipes[2]);
  if($chunk!==''){
   $room=$limit-strlen($out);
   if($room>0)$out.=substr($chunk,0,$room);
   if(strlen($chunk)>$room){$truncated=true;@proc_terminate($proc,9);break;}
  }
  $status=proc_get_status($proc);
  if(!$status['running']) break;
  if(microtime(true)-$start>31){@proc_terminate($proc,9);$out.="\n[terminated: timeout]";break;}
  usleep(20000);
 }
 $out.=(string)stream_get_contents($pipes[1]).(string)stream_get_contents($pipes[2]);
 fclose($pipes[1]); fclose($pipes[2]);
 if(strlen($out)>$limit){$out=substr($out,0,$limit);$truncated=true;}
 $rc=proc_close($proc);
 if($truncated)$out.="\n[output truncated at 512 KiB and process terminated]";
 return [redact_text($out),$rc,$class];
}
function diagnostics(){
 $bins=['git','ssh','ssh-keygen','php','composer','node','npm','pnpm','curl']; $r=[];
 foreach($bins as $b){$p=trim((string)shell_exec('command -v '.escapeshellarg($b).' 2>/dev/null'));$r[$b]=$p?:null;}
 return $r;
}
function codex_readiness($cwd,$keys,$diag,$includeSshState=false){
 $cwd=safe_cwd($cwd);
 $gitContext=directadmin_git_repository_context($cwd);
 $repositoryProbe=$gitContext!==null?directadmin_git_probe($gitContext,['rev-parse','--is-inside-work-tree']):null;
 $repositoryOutput=directadmin_git_probe_output($repositoryProbe);
 $gitRepo=$gitContext===null?false:($repositoryOutput==='true'?true:($repositoryOutput==='false'?false:null));
 $branchProbe=$gitRepo===true?directadmin_git_probe($gitContext,['branch','--show-current']):null;
 $headProbe=$gitRepo===true?directadmin_git_probe($gitContext,['rev-parse','--short','HEAD']):null;
 $statusProbe=$gitRepo===true?directadmin_git_probe($gitContext,['status','--porcelain']):null;
 // Compare only existing local refs; this never fetches or contacts the remote.
 $upstreamProbe=$gitRepo===true?directadmin_git_probe($gitContext,['rev-list','--left-right','--count','HEAD...@{u}']):null;
 $gitReadiness=directadmin_git_readiness_projection($gitContext!==null,$repositoryProbe,$branchProbe,$headProbe,$statusProbe,$upstreamProbe);
 $sshDir=key_dir(); $auth=key_file();
 return [
  'cwd'=>$cwd,
  'cwd_readable'=>is_readable($cwd),
  'cwd_writable'=>is_writable($cwd),
  'git_repository'=>$gitReadiness['git_repository'],
  'git_repository_state'=>$gitReadiness['git_repository_state'],
  'git_branch'=>$gitReadiness['git_branch'],
  'git_branch_state'=>$gitReadiness['git_branch_state'],
  'git_head'=>$gitReadiness['git_head'],
  'git_head_state'=>$gitReadiness['git_head_state'],
  'git_dirty'=>$gitReadiness['git_dirty'],
  'git_worktree_state'=>$gitReadiness['git_worktree_state'],
  'git_claim_branch_format_valid'=>$gitReadiness['git_claim_branch_format_valid'],
  'git_claim_issue_number'=>$gitReadiness['git_claim_issue_number'],
  'git_upstream_configured'=>$gitReadiness['git_upstream_configured'],
  'git_upstream_state'=>$gitReadiness['git_upstream_state'],
  'git_ahead'=>$gitReadiness['git_ahead'],
  'git_behind'=>$gitReadiness['git_behind'],
  'ssh_public_keys'=>count($keys),
  'ssh_dir_mode'=>$includeSshState&&is_dir($sshDir)?substr(sprintf('%o',fileperms($sshDir)),-4):null,
  'authorized_keys_mode'=>$includeSshState&&is_file($auth)?substr(sprintf('%o',fileperms($auth)),-4):null,
  'disk_free_bytes'=>@disk_free_space($cwd)?:null,
  'git_available'=>!empty($diag['git']),
  'php_available'=>!empty($diag['php']),
  'node_available'=>!empty($diag['node']),
  'npm_available'=>!empty($diag['npm']),
  'pnpm_available'=>!empty($diag['pnpm']),
  'composer_available'=>!empty($diag['composer'])
 ];
}
function normalize_server_node_status($raw){
 if(!is_string($raw)||$raw===''||strlen($raw)>65536) return ['state'=>'UNAVAILABLE','ready'=>false,'checked_at'=>null,'checks'=>[],'reason'=>'invalid-response'];
 $data=json_decode($raw,true);
 if(!is_array($data)||($data['schema']??'')!=='titan.server-node.health.v1') return ['state'=>'UNAVAILABLE','ready'=>false,'checked_at'=>null,'checks'=>[],'reason'=>'invalid-schema'];
 $checks=[];
 foreach(array_slice(is_array($data['checks']??null)?$data['checks']:[],0,16) as $row){
  if(!is_array($row)) continue;
  $id=preg_replace('/[^a-zA-Z0-9_.-]/','',substr((string)($row['id']??''),0,64));
  if($id==='') continue;
  $status=strtolower((string)($row['status']??'unknown'));
  if(!in_array($status,['healthy','unhealthy','unreachable'],true)) $status='unknown';
  $checks[]=['id'=>$id,'status'=>$status,'critical'=>($row['critical']??true)===true,'http_status'=>is_int($row['http_status']??null)?$row['http_status']:null];
 }
 $ready=($data['ready']??false)===true;
 $status=strtolower((string)($data['status']??''));
 $state=$ready&&$status==='healthy'?'CONNECTED':($ready?'DEGRADED':'UNAVAILABLE');
 $checkedAt=(string)($data['checked_at']??'');
 if($checkedAt!==''&&strtotime($checkedAt)===false)$checkedAt='';
 $reason=substr(preg_replace('/[^a-zA-Z0-9_.-]/','',(string)($data['reason']??'')),0,120);
 return ['state'=>$state,'ready'=>$ready,'checked_at'=>$checkedAt?:null,'checks'=>$checks,'reason'=>$reason?:null];
}
function server_node_health(){
 $url='http://127.0.0.1:3099/v1/status';
 $context=stream_context_create(['http'=>['method'=>'GET','timeout'=>2,'ignore_errors'=>true,'header'=>"Accept: application/json\r\nConnection: close\r\n"]]);
 $raw=@file_get_contents($url,false,$context,0,65537);
 if(!is_string($raw)) return ['state'=>'UNAVAILABLE','ready'=>false,'checked_at'=>null,'checks'=>[],'reason'=>'server-node-unreachable'];
 return normalize_server_node_status($raw);
}
function redact_text($value){
 $s=(string)$value;
 $patterns=[
  '/(?i)(authorization\s*:\s*bearer\s+)[^\s]+/',
  '/(?i)\b(api[_-]?key|token|secret|password|passwd|cookie|session[_-]?id)\s*[=:]\s*[^\s,;]+/',
  '/\b([a-z][a-z0-9+.-]*:\/\/)[^\s\/@]+@/i',
  '/-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----/s'
 ];
 foreach($patterns as $p)$s=preg_replace($p,'$1[REDACTED]',$s);
 return $s;
}
function diagnostics_report($diag,$keys,$readiness=[]){
 $lines=[
  'Titan Developer Portal diagnostics v2',
  'generated_at='.gmdate('c'),
  'user='.env_user(),
  'uid='.(function_exists('posix_geteuid')?posix_geteuid():'unknown'),
  'home='.home_dir(),
  'cwd_policy=HOME_AND_DESCENDANTS_ONLY',
  'terminal_policy=READ_VERIFY_BUILD_TEST_ALLOWLIST',
  'terminal_timeout_seconds=30',
  'terminal_output_limit_bytes=524288',
  'ssh_key_count='.count($keys)
 ];
 foreach($keys as $key)$lines[]='ssh_fingerprint='.redact_text($key[1]);
 foreach($diag as $bin=>$path)$lines[]='binary_'.$bin.'='.($path?:'missing');
 foreach($readiness as $name=>$value){
  if(is_bool($value))$value=$value?'true':'false';
  if($value===null)$value='unknown';
  $lines[]='readiness_'.$name.'='.redact_text((string)$value);
 }
 return redact_text(implode("\n",$lines));
}
function render(){
 $rejected=$_SERVER['TDA_REQUEST_REJECTED']??'';
 if($rejected==='context'){
  echo '<div class="notice">Request rejected: DirectAdmin execution identity is ambiguous. Reopen this page through DirectAdmin.</div>';
  return;
 }
 if($rejected==='input'){
  echo '<div class="notice">Request rejected: malformed or ambiguous form data. <small>Diagnostic: '.h(directadmin_request_diagnostic_summary()).'</small></div>';
  return;
 }
 if($rejected==='role'){
  echo '<div class="notice">Request rejected: this DirectAdmin role is read-only in Developer Portal.</div>';
  return;
 }
 $role=$_SERVER['TDA_ROLE']??'user';
 $canMutate=directadmin_role_can_mutate($role);
 $msg='';$output='';$rc=null;$commandClass=null;$cwd=safe_cwd(post_string('cwd',''));
 if(($_SERVER['REQUEST_METHOD']??'GET')==='POST'){
  if(!$canMutate){$msg='Request rejected: this DirectAdmin role is read-only in Developer Portal.';}
  elseif(!check_csrf()){$msg='Request rejected: invalid CSRF token. Open Diagnostics below and use Copy Full Diagnostics.';}
  elseif(isset($_POST['add_key'])){$msg=add_key(post_string('public_key',''));}
  elseif(isset($_POST['remove_key'])){$idx=filter_var($_POST['remove_key'],FILTER_VALIDATE_INT,['options'=>['min_range'=>0]]);$msg=remove_key($idx===false?-1:$idx);}
  elseif(isset($_POST['run'])){[$output,$rc,$commandClass]=run_cmd(post_string('command',''),$cwd);}
 }
 $uid=function_exists('posix_geteuid')?posix_geteuid():-1; $user=env_user();$home=home_dir();$diag=diagnostics();
 $keys=$canMutate?fingerprints():[];
 $readiness=codex_readiness($cwd,$keys,$diag,$canMutate);$serverNode=server_node_health();$token=$canMutate?csrf():'';$fullDiag=diagnostics_report($diag,$keys,$readiness);
 echo '<style>
:root{color-scheme:light dark;--tda-panel:var(--card-background,#fff);--tda-text:var(--text-color,#1f2937);--tda-muted:var(--neutral,#6b7280);--tda-border:var(--border-color,#d9dde5);--tda-primary:var(--primary,#2563eb);--tda-safe:var(--safe,#16803c);--tda-danger:var(--danger,#c62828);--tda-input:var(--input-background,var(--tda-panel));}
@media (prefers-color-scheme:dark){:root{--tda-panel:#18212f;--tda-text:#eef2f7;--tda-muted:#9ca3af;--tda-border:#334155;--tda-input:#0f172a}}
html,body{background:transparent;color:var(--tda-text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0}.tda-wrap{max-width:1180px;margin:0 auto;padding:18px}.tda-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.tda-title{margin:0;font-size:26px;font-weight:700}.tda-sub{color:var(--tda-muted);margin:6px 0 0}.card{background:var(--tda-panel);border:1px solid var(--tda-border);border-radius:12px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,.08);margin:0 0 14px}.card h3{margin:0 0 12px;font-size:17px}.diag{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.oktxt{color:var(--tda-safe)}.badtxt{color:var(--tda-danger)}.term{background:#0b1020;color:#e5edf7;border:1px solid #263247;padding:12px;white-space:pre-wrap;min-height:180px;border-radius:8px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}label{display:block;font-size:13px;font-weight:600;margin-top:8px}input,textarea{width:100%;box-sizing:border-box;padding:9px 10px;margin:5px 0 8px;border:1px solid var(--tda-border);border-radius:7px;background:var(--tda-input);color:var(--tda-text)}button{padding:8px 12px;margin:4px 4px 4px 0;border:0;border-radius:7px;background:var(--tda-primary);color:#fff;font-weight:600;cursor:pointer}button[name=remove_key]{background:var(--tda-danger)}.notice{padding:10px 12px;border:1px solid var(--tda-border);border-left:4px solid var(--tda-safe);background:var(--tda-panel);border-radius:7px;margin-bottom:12px}.muted{color:var(--tda-muted)}code{word-break:break-all}.keyrow{border-top:1px solid var(--tda-border);padding:10px 0}.footer-note{font-size:13px;color:var(--tda-muted)}.diagbox{min-height:320px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:pre}.copyrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.copy-status{font-size:13px;color:var(--tda-safe)}@media(max-width:640px){.tda-wrap{padding:10px}.tda-title{font-size:22px}}
</style><div class="tda-wrap">';
 echo '<div class="tda-head"><div><h2 class="tda-title">Developer Portal</h2><p class="tda-sub">Scoped diagnostics for the current DirectAdmin UNIX account. Role: '.h($role).($canMutate?' · operator actions enabled':' · read-only').'</p></div></div>';
 if($msg) echo '<div class="notice">'.h($msg).'</div>';
 echo '<div class="card"><h3>Diagnostics</h3><div class="diag"><div><b>User</b><br>'.h($user).'</div><div><b>UID</b><br>'.h($uid).'</div><div><b>HOME</b><br>'.h($home).'</div></div><hr style="border:0;border-top:1px solid var(--tda-border);margin:14px 0"><div class="diag">';
 foreach($diag as $b=>$p) echo '<div><b>'.h($b).'</b><br>'.($p?'<span class="oktxt">✓ '.h($p).'</span>':'<span class="muted">—</span>').'</div>'; echo '</div></div>';
 echo '<div class="card"><h3>Codex / Agent Readiness</h3><div class="diag">';
 foreach($readiness as $name=>$value){
  if(is_bool($value)){$display=$value?'yes':'no';$class=$value?'oktxt':'muted';}
  elseif($value===null||$value===''){$display='unknown';$class='muted';}
  else{$display=(string)$value;$class='';}
  echo '<div><b>'.h(str_replace('_',' ',$name)).'</b><br><span class="'.h($class).'">'.h($display).'</span></div>';
 }
 echo '</div></div>';
 echo '<div class="card"><h3>Server Node Health</h3><p class="muted">Read-only projection from the canonical loopback Server Node health bridge. No host action can be executed here.</p><div class="diag">';
 echo '<div><b>State</b><br><span class="'.($serverNode['state']==='CONNECTED'?'oktxt':($serverNode['state']==='DEGRADED'?'':'badtxt')).'">'.h($serverNode['state']).'</span></div>';
 echo '<div><b>Ready</b><br>'.h($serverNode['ready']?'yes':'no').'</div>';
 echo '<div><b>Checked</b><br>'.h($serverNode['checked_at']??'unknown').'</div>';
 echo '<div><b>Reason</b><br>'.h($serverNode['reason']??'—').'</div>';
 echo '</div>';
 if(!$serverNode['checks']) echo '<p class="muted">No dependency checks available.</p>';
 foreach($serverNode['checks'] as $check){
  echo '<div class="keyrow"><b>'.h($check['id']).'</b> · '.h($check['status']).' · '.($check['critical']?'critical':'optional');
  if($check['http_status']!==null) echo ' · HTTP '.h($check['http_status']);
  echo '</div>';
 }
 echo '</div>';
 if($canMutate) {
 echo '<div class="card"><h3>Scoped terminal</h3><p class="muted">Read, verify and build/test commands only. Shell chaining, redirection, package installation, Git mutation, destructive and privileged commands fail closed.</p><form method="post" action="?pipe_post=yes"><input type="hidden" name="csrf" value="'.h($token).'"><label>Working directory</label><input name="cwd" value="'.h($cwd).'"><label>Command</label><textarea name="command" rows="3" placeholder="git status"></textarea><button name="run" value="1">Run</button></form>';
 if($rc!==null) echo '<p>Class: '.h($commandClass).' · Exit code: '.h($rc).'</p><div class="term">'.h($output).'</div>'; echo '</div>';
 echo '<div class="card"><h3>Codex / Agent SSH Keys</h3><p>Paste only a public SSH key. Private keys are never requested or stored. Installed keys are displayed by fingerprint only.</p><form method="post" action="?pipe_post=yes"><input type="hidden" name="csrf" value="'.h($token).'"><textarea name="public_key" rows="3" placeholder="ssh-ed25519 AAAA... codex"></textarea><button name="add_key" value="1">Add public key</button></form>';
 if(!$keys) echo '<p>No public keys installed.</p>'; foreach($keys as [$i,$fp]){echo '<div class="keyrow"><b>'.h($fp).'</b><form method="post" action="?pipe_post=yes"><input type="hidden" name="csrf" value="'.h($token).'"><button name="remove_key" value="'.h($i).'">Revoke</button></form></div>'; } echo '</div>';
 } else {
  echo '<div class="card"><h3>Operator actions</h3><p class="muted">Terminal and SSH key mutation are available only on the DirectAdmin admin route. This role is intentionally read-only.</p></div>';
 }
 echo '<div class="card"><h3>Plugin Diagnostics</h3><p class="muted">Read-only support report. Tokens, secrets, passwords, cookies and private-key blocks are redacted.</p><div class="copyrow"><button type="button" onclick="tdaCopyDiagnostics()">Copy Full Diagnostics</button><span id="tda-copy-status" class="copy-status"></span></div><textarea id="tda-full-diagnostics" class="diagbox" readonly>'.h($fullDiag).'</textarea></div>';
 echo '<script>function tdaCopyDiagnostics(){var el=document.getElementById("tda-full-diagnostics"),status=document.getElementById("tda-copy-status"),text=el.value;if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){status.textContent="Copied";}).catch(function(){el.focus();el.select();document.execCommand("copy");status.textContent="Copied";});}else{el.focus();el.select();try{document.execCommand("copy");status.textContent="Copied";}catch(e){status.textContent="Select all and copy manually";}}}</script>';
 echo '<div class="card"><h3>Safety boundary</h3><p class="footer-note">Developer Portal does not grant Titan business authority, root or sudo. Working directories are restricted to HOME and real descendants. Unknown or mutating commands fail closed and must use canonical governed execution elsewhere.</p></div></div>';
}
?>

