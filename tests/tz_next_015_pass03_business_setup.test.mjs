import test from 'node:test';
import assert from 'node:assert/strict';
import { createBusinessDatabase } from '../titan-local/storage/business-database.mjs';
import { createBusinessSetupAuthority } from '../titan-onboarding/runtime/business-setup-authority.mjs';

function memoryAdapter() {
  const stores = new Map();
  const getStore = name => { if (!stores.has(name)) stores.set(name, new Map()); return stores.get(name); };
  return {
    async transaction(names, _mode, work) {
      const tx = {
        async get(store, key) { return structuredClone(getStore(store).get(JSON.stringify(key)) ?? null); },
        async put(store, value) { getStore(store).set(JSON.stringify(value.pk), structuredClone(value)); return structuredClone(value); },
        async getAllByIndex(store, index, query) {
          const rows = [...getStore(store).values()];
          return structuredClone(rows.filter(row => {
            if (index === 'by_company') return row.company_id === query;
            if (index === 'by_company_module') return row.company_id === query[0] && row.module_id === query[1];
            if (index === 'by_company_collection') return row.company_id === query[0] && row.module_id === query[1] && row.collection === query[2];
            return false;
          }));
        }
      };
      return work(tx);
    }
  };
}

function settingsAdapter() {
  const values = new Map();
  return {
    grants_authority: false,
    async read({key, context}) { return structuredClone(values.get(`${context.company_id}|${key}`)); },
    async write({key, value, context}) { values.set(`${context.company_id}|${key}`, structuredClone(value)); }
  };
}

const registry = {
  settings: [
    { key:'privacyDataSettings', scope:'company', owner:'privacy_runtime', editable:true, sensitivity:'standard' },
    { key:'notificationEscalationSettings', scope:'company', owner:'workforce_runtime', editable:true, sensitivity:'standard' },
    { key:'titanZeroTheme', scope:'device', owner:'theme', editable:true, sensitivity:'standard' },
    { key:'secretThing', scope:'company', owner:'x', editable:true, sensitivity:'secret' }
  ]
};

function build(clock = () => 1000) {
  const database = createBusinessDatabase({ adapter: memoryAdapter(), clock });
  const adapter = settingsAdapter();
  return { authority: createBusinessSetupAuthority({ database, settingsAdapter: adapter, settingsRegistry: registry, clock }), database, adapter };
}

const payload = {
  identity:{ legal_name:'Titan Cleaning Pty Ltd', trading_name:'Titan Cleaning', abn:'12345678901', business_type:'cleaning' },
  service_areas:[{label:'3071', postcode:'3071', radius_km:12}, 'Thornbury'],
  operating_hours:{ monday:{open:'08:00',close:'17:00'}, sunday:{closed:true} },
  contact:{ email:'ops@example.com', phone:'0400000000', website:'https://example.com', address:'Melbourne VIC' },
  business_preferences:{timezone:'Australia/Melbourne',locale:'en-AU',currency:'aud',measurement_system:'metric'},
  preferences:{ privacyDataSettings:{prefer_local_processing:true} }
};

test('Pass3 persists business profile through business database and settings through adapter', async () => {
  const {authority}=build();
  const result=await authority.save({company_id:'co-a'},payload);
  assert.equal(result.ok,true); assert.equal(result.revision,1); assert.deepEqual(result.persisted_preference_keys,['privacyDataSettings']);
  const read=await authority.read({company_id:'co-a'});
  assert.equal(read.identity.trading_name,'Titan Cleaning');
  assert.equal(read.service_areas.length,2);
  assert.equal(read.operating_hours.monday.open,'08:00');
  assert.equal(read.contact.email,'ops@example.com');
  assert.equal(read.business_preferences.currency,'AUD');
  assert.equal(read.business_preferences.timezone,'Australia/Melbourne');
  assert.deepEqual(read.preferences.privacyDataSettings,{prefer_local_processing:true});
});

test('Pass3 is strictly company isolated', async () => {
  const {authority}=build();
  await authority.save({company_id:'co-a'},payload);
  const other=await authority.read({company_id:'co-b'});
  assert.equal(other.revision,0); assert.equal(other.identity,null); assert.deepEqual(other.preferences,{});
});

test('Pass3 rejects legacy tenant aliases recursively', async () => {
  const {authority}=build();
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,contact:{tenant_id:'bad'}}),/legacy tenant boundary/);
  await assert.rejects(()=>authority.read({company_id:'co-a',tenant_company_id:'bad'}),/legacy tenant boundary/);
});

test('Pass3 rejects cross-company payloads', async () => {
  const {authority}=build();
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,company_id:'co-b'}),/Cross-company/);
});

test('Pass3 applies optimistic revision protection', async () => {
  const {authority}=build();
  await authority.save({company_id:'co-a'},payload);
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,expected_revision:0}),/revision mismatch/);
  const ok=await authority.save({company_id:'co-a'},{...payload,expected_revision:1}); assert.equal(ok.revision,2);
});

test('Pass3 only writes existing editable company settings', async () => {
  const {authority}=build();
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,preferences:{unknownSetting:true}}),/unknown setting key/);
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,preferences:{titanZeroTheme:'dark'}}),/company-scoped/);
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,preferences:{secretThing:'x'}}),/secret setting/);
});

test('Pass3 validates contact and operating hours', async () => {
  const {authority}=build();
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,contact:{email:'bad'}}),/email is invalid/);
  await assert.rejects(()=>authority.save({company_id:'co-a'},{...payload,operating_hours:{monday:{open:'18:00',close:'08:00'}}}),/close must be after open/);
});

test('Pass3 deduplicates service areas deterministically', async () => {
  const {authority}=build();
  await authority.save({company_id:'co-a'},{...payload,service_areas:['Thornbury','thornbury','3071']});
  const read=await authority.read({company_id:'co-a'});
  assert.deepEqual(read.service_areas.map(x=>x.label),['Thornbury','3071']);
});

test('Pass3 never grants execution authority', async () => {
  const {authority}=build();
  const saved=await authority.save({company_id:'co-a',authority_grants:['all']},payload);
  const read=await authority.read({company_id:'co-a'});
  for(const value of [authority,saved,read]) {
    assert.equal(value.grants_authority,false);
    if('authority_granted' in value) assert.equal(value.authority_granted,false);
    if('execution_permitted' in value) assert.equal(value.execution_permitted,false);
  }
});
