<?php
function h($v){return htmlspecialchars((string)$v,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function env_user(){return getenv('USERNAME') ?: (getenv('USER') ?: get_current_user());}
function home_dir(){ $u=env_user(); $p=function_exists('posix_getpwnam')?@posix_getpwnam($u):false; return ($p&&isset($p['dir']))?$p['dir']:(getenv('HOME')?:'/tmp'); }
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
 $v=$_POST['tda_token']??null;
 return is_string($v) && $v!=='' && hash_equals(csrf(),trim($v));
}
function post_string($name,$default=''){
 $v=$_POST[$name]??$default;
 return is_string($v)?$v:$default;
}
function key_dir(){return home_dir().'/.ssh';}
function key_file(){return key_dir().'/authorized_keys';}
function valid_pubkey($k){return preg_match('/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521))\s+[A-Za-z0-9+\/=]+(?:\s+.*)?$/',trim((string)$k))===1;}
function ensure_ssh(){ $d=key_dir(); if(!is_dir($d) && !mkdir($d,0700,true) && !is_dir($d)) throw new RuntimeException('Unable to create .ssh directory.'); chmod($d,0700); if(!file_exists(key_file())) touch(key_file()); chmod(key_file(),0600); }
function add_key($k){ ensure_ssh(); $k=trim((string)$k); if(!valid_pubkey($k)) return 'Invalid public key format.'; $lines=file(key_file(),FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[]; if(in_array($k,$lines,true)) return 'Key already installed.'; file_put_contents(key_file(),$k."\n",FILE_APPEND|LOCK_EX); chmod(key_file(),0600); return 'Public key installed.'; }
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
  $sub=strtolower($parts[1]??'');
  $allowed=['status','diff','log','show','branch','rev-parse','remote','ls-files','grep','describe'];
  if(!in_array($sub,$allowed,true)) return ['WRITE','Git mutation is blocked here; use the governed repository workflow.',false];
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
 $argv=['/usr/bin/env','timeout','30s','/bin/bash','--noprofile','--norc','-c','exec "$@"','tda-command'];
 $parts=preg_split('/\s+/',trim($cmd));
 foreach($parts as $part)$argv[]=$part;
 $spec=[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']];
 $proc=@proc_open($argv,$spec,$pipes,$cwd,['PATH'=>getenv('PATH')?:'/usr/local/bin:/usr/bin:/bin','HOME'=>home_dir()]);
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
 return [$out,$rc,$class];
}
function diagnostics(){
 $bins=['git','ssh','ssh-keygen','php','composer','node','npm','pnpm','curl']; $r=[];
 foreach($bins as $b){$p=trim((string)shell_exec('command -v '.escapeshellarg($b).' 2>/dev/null'));$r[$b]=$p?:null;}
 return $r;
}
function probe_output($command){
 $out=shell_exec($command.' 2>/dev/null');
 return trim((string)$out);
}
function codex_readiness($cwd,$keys,$diag){
 $cwd=safe_cwd($cwd);
 $gitRepo=probe_output('git -C '.escapeshellarg($cwd).' rev-parse --is-inside-work-tree')==='true';
 $branch=$gitRepo?probe_output('git -C '.escapeshellarg($cwd).' rev-parse --abbrev-ref HEAD'):'';
 $head=$gitRepo?probe_output('git -C '.escapeshellarg($cwd).' rev-parse --short HEAD'):'';
 $dirty=$gitRepo?probe_output('git -C '.escapeshellarg($cwd).' status --porcelain'):'';
 $sshDir=key_dir(); $auth=key_file();
 return [
  'cwd'=>$cwd,
  'cwd_readable'=>is_readable($cwd),
  'cwd_writable'=>is_writable($cwd),
  'git_repository'=>$gitRepo,
  'git_branch'=>$branch?:null,
  'git_head'=>$head?:null,
  'git_dirty'=>$gitRepo?($dirty!==''):null,
  'ssh_public_keys'=>count($keys),
  'ssh_dir_mode'=>is_dir($sshDir)?substr(sprintf('%o',fileperms($sshDir)),-4):null,
  'authorized_keys_mode'=>is_file($auth)?substr(sprintf('%o',fileperms($auth)),-4):null,
  'disk_free_bytes'=>@disk_free_space($cwd)?:null,
  'git_available'=>!empty($diag['git']),
  'php_available'=>!empty($diag['php']),
  'node_available'=>!empty($diag['node']),
  'npm_available'=>!empty($diag['npm']),
  'pnpm_available'=>!empty($diag['pnpm']),
  'composer_available'=>!empty($diag['composer'])
 ];
}
function redact_text($value){
 $s=(string)$value;
 $patterns=[
  '/(?i)(authorization\s*:\s*bearer\s+)[^\s]+/',
  '/(?i)\b(api[_-]?key|token|secret|password|passwd|cookie|session[_-]?id)\s*[=:]\s*[^\s,;]+/',
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
 $msg='';$output='';$rc=null;$commandClass=null;$cwd=safe_cwd(post_string('cwd',''));
 if(($_SERVER['REQUEST_METHOD']??'GET')==='POST'){
  if(!check_csrf()){$msg='Request rejected: invalid CSRF token. Open Diagnostics below and use Copy Full Diagnostics.';}
  elseif(isset($_POST['add_key'])){$msg=add_key(post_string('public_key',''));}
  elseif(isset($_POST['remove_key'])){$idx=filter_var($_POST['remove_key'],FILTER_VALIDATE_INT,['options'=>['min_range'=>0]]);$msg=remove_key($idx===false?-1:$idx);}
  elseif(isset($_POST['run'])){[$output,$rc,$commandClass]=run_cmd(post_string('command',''),$cwd);}
 }
 $uid=function_exists('posix_geteuid')?posix_geteuid():-1; $user=env_user();$home=home_dir();$diag=diagnostics();$keys=fingerprints();$readiness=codex_readiness($cwd,$keys,$diag);$token=csrf();$fullDiag=diagnostics_report($diag,$keys,$readiness);
 echo '<style>
:root{color-scheme:light dark;--tda-panel:var(--card-background,#fff);--tda-text:var(--text-color,#1f2937);--tda-muted:var(--neutral,#6b7280);--tda-border:var(--border-color,#d9dde5);--tda-primary:var(--primary,#2563eb);--tda-safe:var(--safe,#16803c);--tda-danger:var(--danger,#c62828);--tda-input:var(--input-background,var(--tda-panel));}
@media (prefers-color-scheme:dark){:root{--tda-panel:#18212f;--tda-text:#eef2f7;--tda-muted:#9ca3af;--tda-border:#334155;--tda-input:#0f172a}}
html,body{background:transparent;color:var(--tda-text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0}.tda-wrap{max-width:1180px;margin:0 auto;padding:18px}.tda-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.tda-title{margin:0;font-size:26px;font-weight:700}.tda-sub{color:var(--tda-muted);margin:6px 0 0}.card{background:var(--tda-panel);border:1px solid var(--tda-border);border-radius:12px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,.08);margin:0 0 14px}.card h3{margin:0 0 12px;font-size:17px}.diag{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.oktxt{color:var(--tda-safe)}.badtxt{color:var(--tda-danger)}.term{background:#0b1020;color:#e5edf7;border:1px solid #263247;padding:12px;white-space:pre-wrap;min-height:180px;border-radius:8px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}label{display:block;font-size:13px;font-weight:600;margin-top:8px}input,textarea{width:100%;box-sizing:border-box;padding:9px 10px;margin:5px 0 8px;border:1px solid var(--tda-border);border-radius:7px;background:var(--tda-input);color:var(--tda-text)}button{padding:8px 12px;margin:4px 4px 4px 0;border:0;border-radius:7px;background:var(--tda-primary);color:#fff;font-weight:600;cursor:pointer}button[name=remove_key]{background:var(--tda-danger)}.notice{padding:10px 12px;border:1px solid var(--tda-border);border-left:4px solid var(--tda-safe);background:var(--tda-panel);border-radius:7px;margin-bottom:12px}.muted{color:var(--tda-muted)}code{word-break:break-all}.keyrow{border-top:1px solid var(--tda-border);padding:10px 0}.footer-note{font-size:13px;color:var(--tda-muted)}.diagbox{min-height:320px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:pre}.copyrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.copy-status{font-size:13px;color:var(--tda-safe)}@media(max-width:640px){.tda-wrap{padding:10px}.tda-title{font-size:22px}}
</style><div class="tda-wrap">';
 echo '<div class="tda-head"><div><h2 class="tda-title">Developer Portal</h2><p class="tda-sub">Scoped diagnostics, safe verification commands and SSH public-key access for the current DirectAdmin UNIX account.</p></div></div>';
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
 echo '<div class="card"><h3>Scoped terminal</h3><p class="muted">Read, verify and build/test commands only. Shell chaining, redirection, package installation, Git mutation, destructive and privileged commands fail closed.</p><form method="post"><input type="hidden" name="tda_token" value="'.h($token).'"><label>Working directory</label><input name="cwd" value="'.h($cwd).'"><label>Command</label><textarea name="command" rows="3" placeholder="git status"></textarea><button name="run" value="1">Run</button></form>';
 if($rc!==null) echo '<p>Class: '.h($commandClass).' · Exit code: '.h($rc).'</p><div class="term">'.h($output).'</div>'; echo '</div>';
 echo '<div class="card"><h3>Codex / Agent SSH Keys</h3><p>Paste only a public SSH key. Private keys are never requested or stored. Installed keys are displayed by fingerprint only.</p><form method="post"><input type="hidden" name="tda_token" value="'.h($token).'"><textarea name="public_key" rows="3" placeholder="ssh-ed25519 AAAA... codex"></textarea><button name="add_key" value="1">Add public key</button></form>';
 if(!$keys) echo '<p>No public keys installed.</p>'; foreach($keys as [$i,$fp]){echo '<div class="keyrow"><b>'.h($fp).'</b><form method="post"><input type="hidden" name="tda_token" value="'.h($token).'"><button name="remove_key" value="'.h($i).'">Revoke</button></form></div>'; } echo '</div>';
 echo '<div class="card"><h3>Plugin Diagnostics</h3><p class="muted">Read-only support report. Tokens, secrets, passwords, cookies and private-key blocks are redacted.</p><div class="copyrow"><button type="button" onclick="tdaCopyDiagnostics()">Copy Full Diagnostics</button><span id="tda-copy-status" class="copy-status"></span></div><textarea id="tda-full-diagnostics" class="diagbox" readonly>'.h($fullDiag).'</textarea></div>';
 echo '<script>function tdaCopyDiagnostics(){var el=document.getElementById("tda-full-diagnostics"),status=document.getElementById("tda-copy-status"),text=el.value;if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){status.textContent="Copied";}).catch(function(){el.focus();el.select();document.execCommand("copy");status.textContent="Copied";});}else{el.focus();el.select();try{document.execCommand("copy");status.textContent="Copied";}catch(e){status.textContent="Select all and copy manually";}}}</script>';
 echo '<div class="card"><h3>Safety boundary</h3><p class="footer-note">Developer Portal does not grant Titan business authority, root or sudo. Working directories are restricted to HOME and real descendants. Unknown or mutating commands fail closed and must use canonical governed execution elsewhere.</p></div></div>';
}
?>
