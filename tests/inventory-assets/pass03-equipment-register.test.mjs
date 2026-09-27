import test from 'node:test';
import assert from 'node:assert/strict';
import { EquipmentRegister } from '../../titan-inventory/runtime/equipment-register.mjs';

const p = (key) => ({ source: 'test', recorded_at: '2026-09-09T01:00:00.000Z', idempotency_key: key });
const asset = (overrides={}) => ({ asset_id:'vac-1', company_id:'co-a', asset_type:'equipment', name:'Vacuum 1', lifecycle_state:'available', condition_state:'good', provenance:p('reg-1'), ...overrides });

test('register is company scoped and authority neutral', () => {
  const r = new EquipmentRegister();
  const x = r.register(asset()).result;
  assert.equal(x.company_id, 'co-a');
  assert.deepEqual(x.authority, { execution_granted:false, business_authority_granted:false });
  assert.equal(r.get('co-b','vac-1'), null);
});

test('registration idempotency does not duplicate asset', () => {
  const r = new EquipmentRegister();
  assert.equal(r.register(asset()).replayed, false);
  assert.equal(r.register(asset({name:'Changed on replay'})).replayed, true);
  assert.equal(r.list('co-a').length, 1);
  assert.equal(r.get('co-a','vac-1').name, 'Vacuum 1');
});

test('assign supports worker, vehicle and site and replaces previous assignment', () => {
  const r = new EquipmentRegister(); r.register(asset());
  let x = r.assign({company_id:'co-a',asset_id:'vac-1',assignment_type:'worker',assignment_id:'w-1',provenance:p('a1')}).result;
  assert.equal(x.assigned_worker_id,'w-1'); assert.equal(x.lifecycle_state,'assigned');
  x = r.assign({company_id:'co-a',asset_id:'vac-1',assignment_type:'vehicle',assignment_id:'v-1',provenance:p('a2')}).result;
  assert.equal(x.assigned_worker_id,null); assert.equal(x.assigned_vehicle_id,'v-1');
  x = r.assign({company_id:'co-a',asset_id:'vac-1',assignment_type:'site',assignment_id:'s-1',provenance:p('a3')}).result;
  assert.equal(x.assigned_vehicle_id,null); assert.equal(x.assigned_site_id,'s-1');
});

test('unassign returns assigned asset to available', () => {
  const r = new EquipmentRegister(); r.register(asset());
  r.assign({company_id:'co-a',asset_id:'vac-1',assignment_type:'worker',assignment_id:'w-1',provenance:p('a1')});
  const x = r.unassign({company_id:'co-a',asset_id:'vac-1',provenance:p('u1')}).result;
  assert.equal(x.lifecycle_state,'available'); assert.equal(x.assigned_worker_id,null);
});

test('condition tracking drives damaged and unserviceable status safely', () => {
  const r = new EquipmentRegister(); r.register(asset());
  let x = r.updateCondition({company_id:'co-a',asset_id:'vac-1',condition_state:'damaged',provenance:p('c1')}).result;
  assert.equal(x.lifecycle_state,'damaged');
  x = r.updateCondition({company_id:'co-a',asset_id:'vac-1',condition_state:'unserviceable',provenance:p('c2')}).result;
  assert.equal(x.lifecycle_state,'under_maintenance');
});

test('retired/lost/maintenance state clears physical assignment', () => {
  const r = new EquipmentRegister(); r.register(asset());
  r.assign({company_id:'co-a',asset_id:'vac-1',assignment_type:'site',assignment_id:'s-1',provenance:p('a1')});
  const x = r.updateStatus({company_id:'co-a',asset_id:'vac-1',lifecycle_state:'retired',provenance:p('s1')}).result;
  assert.equal(x.assigned_site_id,null); assert.equal(x.lifecycle_state,'retired');
});

test('cross-company mutations fail closed', () => {
  const r = new EquipmentRegister(); r.register(asset());
  assert.throws(() => r.assign({company_id:'co-b',asset_id:'vac-1',assignment_type:'worker',assignment_id:'w-1',provenance:p('x1')}), /not found/);
  assert.equal(r.get('co-a','vac-1').assigned_worker_id,null);
});

test('legacy tenant boundary keys are rejected on registration', () => {
  const r = new EquipmentRegister();
  assert.throws(() => r.register(asset({tenant_id:'legacy'})), /legacy boundary/);
});

test('reads return clones and cannot mutate register authority/state', () => {
  const r = new EquipmentRegister(); r.register(asset());
  const x = r.get('co-a','vac-1'); x.authority.execution_granted = true; x.name='tampered';
  const y = r.get('co-a','vac-1');
  assert.equal(y.authority.execution_granted,false); assert.equal(y.name,'Vacuum 1');
});
