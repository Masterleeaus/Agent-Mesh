import { assertCompanyId, rejectLegacyTenantBoundary } from './contracts.js';

export const WORKFORCE_SLA_BUSINESS_CALENDAR_SCHEMA='titan.workforce.sla-business-calendar.v1' as const;
export type BusinessDay='mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
const DAY_INDEX:Record<BusinessDay,number>={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
export interface WorkforceSlaBusinessCalendarInput{
 company_id:string;calendar_id:string;business_hours_only:boolean;business_hours_start?:string;business_hours_end?:string;business_days?:BusinessDay[];timezone?:string;source_refs?:string[];[key:string]:unknown;
}
function hhmm(v:unknown,label:string):{text:string;minutes:number}{const s=String(v??'').trim();const m=/^(\d{2}):(\d{2})$/.exec(s);if(!m)throw new Error(`${label} must use HH:MM`);const h=Number(m[1]),min=Number(m[2]);if(h>23||min>59)throw new Error(`${label} is invalid`);return{text:s,minutes:h*60+min};}
function uniq(v:unknown):string[]{return [...new Set((Array.isArray(v)?v:[]).map(x=>String(x??'').trim()).filter(Boolean))].sort();}
function localParts(date:Date,timeZone:string){const parts=new Intl.DateTimeFormat('en-US',{timeZone,weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);const get=(t:string)=>parts.find(x=>x.type===t)?.value??'';const wd=get('weekday').slice(0,3).toLowerCase() as BusinessDay;return{weekday:wd,year:Number(get('year')),month:Number(get('month')),day:Number(get('day')),hour:Number(get('hour')),minute:Number(get('minute')),second:Number(get('second'))};}
function zonedInstant(y:number,m:number,d:number,h:number,min:number,timeZone:string):Date{let guess=Date.UTC(y,m-1,d,h,min,0);for(let i=0;i<4;i++){const p=localParts(new Date(guess),timeZone);const desired=Date.UTC(y,m-1,d,h,min,0),seen=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);const delta=desired-seen;if(Math.abs(delta)<1000)break;guess+=delta;}return new Date(guess);}
function addCalendarDays(y:number,m:number,d:number,n:number){const x=new Date(Date.UTC(y,m-1,d+n));return{year:x.getUTCFullYear(),month:x.getUTCMonth()+1,day:x.getUTCDate()};}
export function buildWorkforceSlaBusinessCalendar(input:WorkforceSlaBusinessCalendarInput){
 rejectLegacyTenantBoundary(input as Record<string,unknown>);const company_id=assertCompanyId(input.company_id),calendar_id=String(input.calendar_id??'').trim();if(!calendar_id)throw new Error('calendar_id is required');
 const timezone=String(input.timezone??'UTC').trim()||'UTC';try{new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format(new Date());}catch{throw new Error('timezone must be a valid IANA timezone');}
 const start=hhmm(input.business_hours_start??'08:00','business_hours_start'),end=hhmm(input.business_hours_end??'17:00','business_hours_end');if(end.minutes<=start.minutes)throw new Error('business_hours_end must be after business_hours_start');
 const days=(input.business_days??['mon','tue','wed','thu','fri']).map(x=>String(x).toLowerCase() as BusinessDay);if(days.length===0||days.some(x=>!(x in DAY_INDEX)))throw new Error('business_days contains an unsupported day');
 return Object.freeze({schema:WORKFORCE_SLA_BUSINESS_CALENDAR_SCHEMA,company_id,calendar_id,business_hours_only:input.business_hours_only===true,business_hours_start:start.text,business_hours_end:end.text,business_days:Object.freeze([...new Set(days)]),timezone,source_refs:Object.freeze(uniq(input.source_refs)),deadline_calculation_only:true as const,recommendation_only:true as const,automatic_assignment:false as const,execution_permitted:false as const,grants_authority:false as const});
}
export function calculateSlaBusinessDeadline(input:{company_id:string;start_at:string;budget_hours:number;calendar:ReturnType<typeof buildWorkforceSlaBusinessCalendar>}){
 const company_id=assertCompanyId(input.company_id);if(input.calendar.company_id!==company_id)throw new Error('calendar company_id must match deadline company_id');
 const start=new Date(input.start_at);if(Number.isNaN(start.getTime()))throw new Error('start_at must be an ISO date-time');const budget=Number(input.budget_hours);if(!Number.isFinite(budget)||budget<0)throw new Error('budget_hours must be a non-negative finite number');
 if(!input.calendar.business_hours_only)return Object.freeze({company_id,due_at:new Date(start.getTime()+budget*3600000).toISOString(),business_hours_applied:false,calendar_id:input.calendar.calendar_id,grants_authority:false as const,execution_permitted:false as const});
 const startHm=hhmm(input.calendar.business_hours_start,'business_hours_start'),endHm=hhmm(input.calendar.business_hours_end,'business_hours_end'),allowed=new Set(input.calendar.business_days);let remaining=Math.round(budget*3600000),current=new Date(start);
 for(let guard=0;guard<3700;guard++){
  const p=localParts(current,input.calendar.timezone);const dayAllowed=allowed.has(p.weekday);const mins=p.hour*60+p.minute;
  if(!dayAllowed||mins>=endHm.minutes){let next=addCalendarDays(p.year,p.month,p.day,1);for(let i=0;i<8;i++){const probe=zonedInstant(next.year,next.month,next.day,Math.floor(startHm.minutes/60),startHm.minutes%60,input.calendar.timezone);if(allowed.has(localParts(probe,input.calendar.timezone).weekday)){current=probe;break;}next=addCalendarDays(next.year,next.month,next.day,1);}continue;}
  if(mins<startHm.minutes){current=zonedInstant(p.year,p.month,p.day,Math.floor(startHm.minutes/60),startHm.minutes%60,input.calendar.timezone);continue;}
  if(remaining===0)return Object.freeze({company_id,due_at:current.toISOString(),business_hours_applied:true,calendar_id:input.calendar.calendar_id,grants_authority:false as const,execution_permitted:false as const});
  const end=zonedInstant(p.year,p.month,p.day,Math.floor(endHm.minutes/60),endHm.minutes%60,input.calendar.timezone),available=Math.max(0,end.getTime()-current.getTime());
  if(remaining<=available){current=new Date(current.getTime()+remaining);remaining=0;continue;}remaining-=available;current=new Date(end.getTime()+1000);
 }
 throw new Error('unable to calculate SLA deadline within calendar guard');
}
