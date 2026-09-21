import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEquipmentRegister } from '../../titan-inventory/runtime/equipment-register.mjs';
import { createConsumableStockLedger } from '../../titan-inventory/runtime/consumable-stock.mjs';
import { createJobInventoryEvidence } from '../../titan-inventory/runtime/job-inventory-evidence.mjs';
import { createReorderRecommendationEngine } from '../../titan-inventory/runtime/reorder-recommendations.mjs';
import { createProductSafetyRegistry } from '../../titan-inventory/runtime/product-safety-registry.mjs';
import { createInventoryAuditWorkflows } from '../../titan-inventory/runtime/stocktake-asset-exceptions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const prov = (key) => ({ source: 'pass10-certification', recorded_at: '2026-09-09T02:55:00.000Z', idempotency_key: key });

function build(){
  const ledger=createConsumableStockLedger();
  const equipment=createEquipmentRegister();
  return {
    ledger,equipment,
    evidence:createJobInventoryEvidence({ledger}),
    reorder:createReorderRecommendationEngine({ledger}),
    safety:createProductSafetyRegistry(),
    audit:createInventoryAuditWorkflows({stockLedger:ledger,equipmentRegister:equipment})
  };
}

test('certifies company_id as the only inventory company boundary', () => {
  for (const name of ['Asset.schema.json','Consumable.schema.json','StockLocation.schema.json']) {
    const schema=JSON.parse(fs.readFileSync(path.join(root,'titan-inventory/contracts',name),'utf8'));
    assert.ok(schema.required.includes('company_id'));
    for (const legacy of ['tenant_id','tenant_company_id','business_id','account_id','workspace_id']) {
      assert.equal(schema.properties?.[legacy], undefined);
      assert.equal(schema.allOf?.some(x=>x.not?.required?.includes(legacy)), true);
    }
  }
});

test('certifies end-to-end stock, job evidence and reorder marketplace handoff without purchase authority', () => {
  const {ledger,evidence,reorder}=build();
  ledger.stockIn({company_id:'c1',consumable_id:'chem-1',stock_location_id:'van-1',quantity:10,provenance:prov('in')});
  evidence.recordJobConsumption({company_id:'c1',job_id:'job-1',consumable_id:'chem-1',stock_location_id:'van-1',quantity:7,provenance:prov('job-use')});
  reorder.setPolicy({company_id:'c1',consumable_id:'chem-1',stock_location_id:'van-1',reorder_threshold:3,target_stock:12,catalog_product_id:'cleaning-chemicals-neutral-cleaner',marketplace_product_id:'market-chem-1',provenance:prov('policy')});
  const [rec]=reorder.recommend('c1');
  assert.equal(rec.status,'REORDER_RECOMMENDED');
  assert.equal(rec.on_hand,3);
  assert.equal(rec.suggested_quantity,9);
  assert.equal(rec.product_ref.catalog_product_id,'cleaning-chemicals-neutral-cleaner');
  assert.equal(rec.product_ref.marketplace_product_id,'market-chem-1');
  assert.equal(rec.authority.purchase_authority_granted,false);
  assert.equal(rec.authority.automatic_order_authority_granted,false);
});

test('certifies cleaning catalogue safety/SDS hooks are grounded in catalogue data', () => {
  const {safety}=build();
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'titan-modules/cleaning-supply-catalog.json'),'utf8'));
  const imported=safety.importCleaningSupplyCatalog('c1',catalog);
  assert.equal(imported.length,catalog.products.length);
  assert.equal(safety.list('c1').length,catalog.products.length);
  for(const record of safety.list('c1')){
    assert.equal(record.authority.purchase_authority_granted,false);
    assert.equal(record.authority.execution_authority_granted,false);
    if(record.safety.sds_ref) assert.equal(record.safety.sds_state,'SDS_REFERENCE_AVAILABLE');
  }
});

test('certifies stocktake discrepancy reconciliation is explicit, auditable and idempotent', () => {
  const {ledger,equipment,audit}=build();
  equipment.register({company_id:'c1',asset_id:'asset-unused',asset_type:'equipment',name:'Unused',lifecycle_state:'available',condition_state:'good',provenance:prov('asset-unused')});
  ledger.stockIn({company_id:'c1',consumable_id:'cloth',stock_location_id:'store',quantity:10,provenance:prov('cloth-in')});
  const first=audit.recordStocktake({company_id:'c1',consumable_id:'cloth',stock_location_id:'store',counted_quantity:7,apply_adjustment:true,reason:'count',provenance:prov('stocktake')});
  const replay=audit.recordStocktake({company_id:'c1',consumable_id:'cloth',stock_location_id:'store',counted_quantity:7,apply_adjustment:true,reason:'count',provenance:prov('stocktake')});
  assert.equal(first.replayed,false); assert.equal(replay.replayed,true);
  assert.equal(first.record.discrepancy,-3); assert.equal(first.record.adjustment_applied,true);
  assert.equal(ledger.getBalance('c1','cloth','store'),7);
  assert.equal(first.record.authority.purchase_authority_granted,false);
});

test('certifies damaged/lost equipment lifecycle and replacement authority neutrality', () => {
  const {ledger,equipment,audit}=build();
  equipment.register({company_id:'c1',asset_id:'vac-1',asset_type:'equipment',name:'Vacuum',lifecycle_state:'available',condition_state:'good',provenance:prov('vac-reg')});
  equipment.assign({company_id:'c1',asset_id:'vac-1',assignment_type:'worker',assignment_id:'worker-1',provenance:prov('vac-assign')});
  const damaged=audit.reportAssetException({company_id:'c1',asset_id:'vac-1',exception_type:'damaged',replacement_recommended:true,provenance:prov('vac-damaged')});
  assert.equal(damaged.record.after.condition_state,'damaged');
  assert.equal(damaged.record.authority.replacement_purchase_authority_granted,false);
  const lost=audit.reportAssetException({company_id:'c1',asset_id:'vac-1',exception_type:'lost',replacement_recommended:true,provenance:prov('vac-lost')});
  assert.equal(lost.record.after.lifecycle_state,'lost');
  assert.equal(lost.record.after.assigned_worker_id,null);
  assert.equal(lost.record.authority.purchase_authority_granted,false);
});

test('certifies transfer replay and cross-company isolation', () => {
  const {ledger}=build();
  ledger.stockIn({company_id:'c1',consumable_id:'gloves',stock_location_id:'warehouse',quantity:20,provenance:prov('gloves-in')});
  const first=ledger.transfer({company_id:'c1',consumable_id:'gloves',from_stock_location_id:'warehouse',to_stock_location_id:'van',quantity:5,provenance:prov('transfer')});
  const replay=ledger.transfer({company_id:'c1',consumable_id:'gloves',from_stock_location_id:'warehouse',to_stock_location_id:'van',quantity:5,provenance:prov('transfer')});
  assert.equal(first.replayed,false); assert.equal(replay.replayed,true);
  assert.equal(ledger.getBalance('c1','gloves','warehouse'),15);
  assert.equal(ledger.getBalance('c1','gloves','van'),5);
  assert.equal(ledger.getBalance('c2','gloves','warehouse'),0);
  assert.equal(first.transfer.authority.purchase_authority_granted,false);
});

test('certifies contract index authority statement and complete runtime surface', () => {
  const index=JSON.parse(fs.readFileSync(path.join(root,'titan-inventory/contracts/INDEX.json'),'utf8'));
  assert.equal(index.company_boundary,'company_id');
  assert.equal(index.identity_is_not_authority,true);
  for(const runtime of ['equipment-register.mjs','consumable-stock.mjs','job-inventory-evidence.mjs','reorder-recommendations.mjs','product-safety-registry.mjs','stocktake-asset-exceptions.mjs']){
    assert.equal(fs.existsSync(path.join(root,'titan-inventory/runtime',runtime)),true,runtime);
  }
});
