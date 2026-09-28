export type DirectAdminPluginPackage={plugin_id:string;version:string;files:readonly string[];role_entrypoints:Readonly<Record<"admin"|"reseller"|"user",string>>;hooks:readonly string[]};
export type PluginValidation={valid:boolean;errors:readonly string[];plugin_id:string;version:string};
const req=(v:unknown,n:string)=>{const x=String(v??"").trim();if(!x)throw new Error(`${n}-required`);return x;};
export function validateDirectAdminPluginPackage(input:DirectAdminPluginPackage):PluginValidation{
 const errors:string[]=[];let plugin_id="",version="";try{plugin_id=req(input.plugin_id,"plugin_id");version=req(input.version,"version");}catch(e){errors.push((e as Error).message);}
 const files=new Set(input.files??[]);for(const required of ["plugin.conf","README.md","AGENTS.md","scripts/install.sh","scripts/uninstall.sh"])if(!files.has(required))errors.push(`missing-file:${required}`);
 for(const role of ["admin","reseller","user"] as const){const path=input.role_entrypoints?.[role];if(!path||!files.has(path))errors.push(`missing-role-entrypoint:${role}`);}
 for(const hook of input.hooks??[]){if(hook.startsWith("/")||hook.includes(".."))errors.push(`unsafe-hook-path:${hook}`);}
 if([...files].some(path=>path.startsWith("/")||path.split("/").includes("..")))errors.push("unsafe-file-path");
 return Object.freeze({valid:errors.length===0,errors:Object.freeze([...new Set(errors)]),plugin_id,version});
}
export function assertPluginCanBeInstalled(result:PluginValidation){if(!result.valid)throw new Error(`plugin-validation-failed:${result.errors.join(",")}`);return true;}
