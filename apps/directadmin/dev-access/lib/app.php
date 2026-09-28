<?php
function h($v){return htmlspecialchars((string)$v,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function env_user(){return getenv('USERNAME') ?: get_current_user();}
function home_dir(){ $u=env_user(); $p=@posix_getpwnam($u); return ($p&&isset($p['dir']))?$p['dir']:(getenv('HOME')?:'/tmp'); }
function csrf_secret_file(){ return home_dir().'/.titan-dev-access/csrf.key'; }
function csrf_secret(){
 $path=csrf_secret_file(); $dir=dirname($path);
 if(!is_dir($dir)){ @mkdir($dir,0700,true); }
 @chmod($dir,0700);
 if(!is_file($path)){
  $secret=bin2hex(random_bytes(32));
  $tmp=$path.'.tmp.'.getmypid();
  if(file_put_contents($tmp,$secret,LOCK_EX)===false) throw new RuntimeException('Unable to create CSRF secret.');
  @chmod($tmp,0600);
  if(!@rename($tmp,$path)){ @unlink($tmp); throw new RuntimeException('Unable to install CSRF secret.'); }
 }
 @chmod($path,0600);
 $secret=trim((string)@file_get_contents($path));
 if(strlen($secret)<32) throw new RuntimeException('Invalid CSRF secret.');
 return $secret;
}
function csrf(){
 return hash_hmac('sha256','titan_dev_access_form_v1',csrf_secret());
}
function check_csrf(){
 if(empty($_POST['csrf']) || !is_string($_POST['csrf'])) return false;
 return hash_equals(csrf(), trim($_POST['csrf']));
}
function key_dir(){return home_dir().'/.ssh';}
function key_file(){return key_dir().'/authorized_keys';}
function valid_pubkey($k){return preg_match('/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521))\s+[A-Za-z0-9+\/=]+(?:\s+.*)?$/',trim($k));}
function ensure_ssh(){ $d=key_dir(); if(!is_dir($d)) mkdir($d,0700,true); chmod($d,0700); if(!file_exists(key_file())) touch(key_file()); chmod(key_file(),0600); }
function add_key($k){ ensure_ssh(); $k=trim($k); if(!valid_pubkey($k)) return 'Invalid public key format.'; $lines=file(key_file(),FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[]; if(in_array($k,$lines,true)) return 'Key already installed.'; file_put_contents(key_file(),$k."\n",FILE_APPEND|LOCK_EX); chmod(key_file(),0600); return 'Public key installed.'; }
function remove_key($idx){ ensure_ssh(); $lines=file(key_file(),FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[]; if(!isset($lines[$idx])) return 'Key not found.'; unset($lines[$idx]); file_put_contents(key_file(),$lines?implode("\n",$lines)."\n":'',LOCK_EX); chmod(key_file(),0600); return 'Key revoked.'; }
function fingerprints(){ ensure_ssh(); $out=[]; foreach((file(key_file(),FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES)?:[]) as $i=>$k){$tmp=tempnam(sys_get_temp_dir(),'tda'); file_put_contents($tmp,$k."\n"); $fp=trim((string)shell_exec('ssh-keygen -lf '.escapeshellarg($tmp).' 2>/dev/null')); @unlink($tmp); $out[]=[$i,$k,$fp?:'fingerprint unavailable'];} return $out; }
function safe_cwd($requested){$home=realpath(home_dir())?:home_dir(); $cwd=$requested?realpath($requested):$home; if(!$cwd||strpos($cwd,$home)!==0) return $home; return $cwd;}
function run_cmd($cmd,$cwd){ if(trim($cmd)==='') return ['',0]; $cwd=safe_cwd($cwd); $full='cd '.escapeshellarg($cwd).' && timeout 30s /bin/bash -lc '.escapeshellarg($cmd).' 2>&1'; $out=[];$rc=0; exec($full,$out,$rc); $text=implode("\n",$out); if(strlen($text)>524288)$text=substr($text,0,524288)."\n[output truncated]"; return [$text,$rc]; }
function diagnostics(){ $bins=['git','ssh','ssh-keygen','php','composer','node','npm','pnpm','curl']; $r=[]; foreach($bins as $b){$p=trim((string)shell_exec('command -v '.escapeshellarg($b).' 2>/dev/null'));$r[$b]=$p?:null;} return $r; }
function render(){
 $msg='';$output='';$rc=null;$cwd=safe_cwd($_POST['cwd']??'');
 if($_SERVER['REQUEST_METHOD']==='POST'){
  if(!check_csrf()){$msg='Request rejected: invalid CSRF token.';}
  elseif(isset($_POST['add_key'])){$msg=add_key($_POST['public_key']??'');}
  elseif(isset($_POST['remove_key'])){$msg=remove_key((int)$_POST['remove_key']);}
  elseif(isset($_POST['run'])){[$output,$rc]=run_cmd($_POST['command']??'',$cwd);}
 }
 $uid=function_exists('posix_geteuid')?posix_geteuid():-1; $user=env_user();$home=home_dir();$diag=diagnostics();$keys=fingerprints();$token=csrf();
 echo '<style>
:root{color-scheme:light dark;--tda-bg:var(--background,#f6f7f9);--tda-panel:var(--card-background,#fff);--tda-text:var(--text-color,#1f2937);--tda-muted:var(--neutral,#6b7280);--tda-border:var(--border-color,#d9dde5);--tda-primary:var(--primary,#2563eb);--tda-safe:var(--safe,#16803c);--tda-danger:var(--danger,#c62828);--tda-input:var(--input-background,var(--tda-panel));}
@media (prefers-color-scheme:dark){:root{--tda-bg:#111827;--tda-panel:#18212f;--tda-text:#eef2f7;--tda-muted:#9ca3af;--tda-border:#334155;--tda-input:#0f172a}}
html,body{background:transparent;color:var(--tda-text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0}.tda-wrap{max-width:1180px;margin:0 auto;padding:18px}.tda-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.tda-title{margin:0;font-size:26px;font-weight:700}.tda-sub{color:var(--tda-muted);margin:6px 0 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}.card{background:var(--tda-panel);border:1px solid var(--tda-border);border-radius:12px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,.08);margin:0 0 14px}.card h3{margin:0 0 12px;font-size:17px}.diag{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.pill{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid var(--tda-border);font-size:12px}.oktxt{color:var(--tda-safe)}.badtxt{color:var(--tda-danger)}.term{background:#0b1020;color:#e5edf7;border:1px solid #263247;padding:12px;white-space:pre-wrap;min-height:180px;border-radius:8px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}label{display:block;font-size:13px;font-weight:600;margin-top:8px}input,textarea{width:100%;box-sizing:border-box;padding:9px 10px;margin:5px 0 8px;border:1px solid var(--tda-border);border-radius:7px;background:var(--tda-input);color:var(--tda-text)}button{padding:8px 12px;margin:4px 4px 4px 0;border:0;border-radius:7px;background:var(--tda-primary);color:#fff;font-weight:600;cursor:pointer}button[name=remove_key]{background:var(--tda-danger)}.notice{padding:10px 12px;border:1px solid var(--tda-border);border-left:4px solid var(--tda-safe);background:var(--tda-panel);border-radius:7px;margin-bottom:12px}.muted{color:var(--tda-muted)}code{word-break:break-all}.keyrow{border-top:1px solid var(--tda-border);padding:10px 0}.footer-note{font-size:13px;color:var(--tda-muted)}@media(max-width:640px){.tda-wrap{padding:10px}.tda-title{font-size:22px}}
</style><div class="tda-wrap">';
 echo '<div class="tda-head"><div><h2 class="tda-title">Titan Dev Access</h2><p class="tda-sub">Terminal + SSH public-key access for the current DirectAdmin UNIX account.</p></div></div>';
 if($msg) echo '<div class="notice">'.h($msg).'</div>';
 echo '<div class="card"><h3>Diagnostics</h3><div class="diag"><div><b>User</b><br>'.h($user).'</div><div><b>UID</b><br>'.h($uid).'</div><div><b>HOME</b><br>'.h($home).'</div><div><b>sudo</b><br>'.(trim((string)shell_exec('sudo -n true 2>/dev/null; echo $?'))==='0'?'<span class="oktxt">available</span>':'<span class="muted">not available</span>').'</div></div><hr style="border:0;border-top:1px solid var(--tda-border);margin:14px 0"><div class="diag">';
 foreach($diag as $b=>$p) echo '<div><b>'.h($b).'</b><br>'.($p?'<span class="oktxt">✓ '.h($p).'</span>':'<span class="muted">—</span>').'</div>'; echo '</div></div>';
 echo '<div class="card"><h3>Terminal</h3><form method="post"><input type="hidden" name="csrf" value="'.h($token).'"><label>Working directory</label><input name="cwd" value="'.h($cwd).'"><label>Command</label><textarea name="command" rows="3" placeholder="git status"></textarea><button name="run" value="1">Run</button></form>';
 if($rc!==null) echo '<p>Exit code: '.h($rc).'</p><div class="term">'.h($output).'</div>'; echo '</div>';
 echo '<div class="card"><h3>Codex / Agent SSH Keys</h3><p>Paste only a public SSH key. Private keys are never requested or stored.</p><form method="post"><input type="hidden" name="csrf" value="'.h($token).'"><textarea name="public_key" rows="3" placeholder="ssh-ed25519 AAAA... codex"></textarea><button name="add_key" value="1">Add public key</button></form>';
 if(!$keys) echo '<p>No public keys installed.</p>'; foreach($keys as [$i,$k,$fp]){echo '<div class="keyrow"><b>'.h($fp).'</b><br><code>'.h($k).'</code><form method="post"><input type="hidden" name="csrf" value="'.h($token).'"><button name="remove_key" value="'.h($i).'">Revoke</button></form></div>'; } echo '</div>';
 echo '<div class="card"><h3>Safety boundary</h3><p class="footer-note">This plugin runs as the DirectAdmin/UNIX account that opened it. It does not grant root, change sshd, or create sudo rights. Terminal commands are limited to 30 seconds and 512 KB output.</p></div></div>';
}
?>
