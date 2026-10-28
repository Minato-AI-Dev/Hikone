export type AnalyticsEvent =
  | 'analytics_consent_changed'
  | 'app_open'
  | 'questionnaire_started'
  | 'questionnaire_completed'
  | 'recommendation_viewed'
  | 'recommendation_selected'
  | 'experience_started'
  | 'navigation_clicked'
  | 'experience_completed'
  | 'experience_not_completed'
  | 'second_experience_selected'
  | 'returning_user_detected'
  | 'continue_previous_selected'
  | 'different_hikone_selected'
  | 'qr_scanner_opened'
  | 'qr_checkin_success'
  | 'hikone_ai_opened'
  | 'hikone_ai_started'
  | 'hikone_ai_completed';

const STORAGE_KEY = 'hikone-field-events-v1';
const CONSENT_KEY = 'hikone-field-consent-v1';
const CHOICE_KEY='hikone-research-choice-v2';
export function hasAnalyticsChoice():boolean {
  try{return localStorage.getItem(CHOICE_KEY)==='answered';}catch{return false;}
}
export function recordAnalyticsChoice(enabled:boolean):void {
  setAnalyticsConsent(enabled);
  try{localStorage.setItem(CHOICE_KEY,'answered');}catch{ /* Choice still works for this visit. */ }
}
const AGGREGATE_EVENTS=new Set<string>([
'app_open','questionnaire_started','questionnaire_completed','recommendation_viewed','recommendation_selected',
'experience_started','navigation_clicked','experience_completed','experience_not_completed','second_experience_selected',
'returning_user_detected','continue_previous_selected','different_hikone_selected','qr_scanner_opened',
'qr_checkin_success','hikone_ai_opened','hikone_ai_started','hikone_ai_completed'
]);
const ALLOWED_KEYS = new Set(['count','id','detourMinutes','currentNodeId','finalNodeId','from','method','source','enabled']);
type LogRow = {timestamp:string;event:AnalyticsEvent;details:Record<string,string|number|boolean>};
export function hasAnalyticsConsent():boolean {
  try { return localStorage.getItem(CONSENT_KEY)==='yes'; } catch { return false; }
}
export function setAnalyticsConsent(enabled:boolean):void {
  try {
    if(enabled) localStorage.setItem(CONSENT_KEY,'yes');
    else {localStorage.removeItem(CONSENT_KEY);localStorage.removeItem(STORAGE_KEY);}
  } catch { /* Private browsing may prevent storage. */ }
}
export function track(event:AnalyticsEvent, data:Record<string,unknown>={}):void {
  if(!hasAnalyticsConsent()) return;
  const details:LogRow['details']={};
  for(const [key,value] of Object.entries(data)) {
    if(ALLOWED_KEYS.has(key)&&['string','number','boolean'].includes(typeof value)) {
      details[key]=value as string|number|boolean;
    }
  }
  try {
    const existing=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]') as LogRow[];
    existing.push({timestamp:new Date().toISOString(),event,details});
    localStorage.setItem(STORAGE_KEY,JSON.stringify(existing.slice(-2000)));
  } catch { /* Fail open: recommendations must still work. */ }
  sendAggregateEvent(event);
}

function sendAggregateEvent(event:AnalyticsEvent):void {
  if(!hasAnalyticsConsent()||!AGGREGATE_EVENTS.has(event))return;
  const endpoint=import.meta.env.VITE_ANALYTICS_COLLECT_ENDPOINT?.trim() || (import.meta.env.DEV?'/api/analytics-collect':'');
  if(!endpoint)return;
  // No raw details, identifying IDs, GPS or free-form content leave the browser.
  void fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event}),keepalive:true}).catch(()=>{});
}

export function downloadAnalytics():void {
  if(!hasAnalyticsConsent()) return;
  let rows:LogRow[]=[];
  try { rows=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return; }
  const escape=(value:unknown)=>'"'+String(value??'').replace(/"/g,'""')+'"';
  const csv=['timestamp,event,details',...rows.map(x=>[x.timestamp,x.event,JSON.stringify(x.details)].map(escape).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='hikone-field-events.csv';link.click();
  URL.revokeObjectURL(url);
}
