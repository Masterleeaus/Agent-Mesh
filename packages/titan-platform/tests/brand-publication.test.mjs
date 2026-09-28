import test from "node:test";
import assert from "node:assert/strict";
import { createBrandPublication, promoteBrandPublication, rollbackBrandPublication } from "../.test-dist/brand-publication.js";
const base={publication_id:"pub-1",company_id:"co-1",site_id:"site-1",version:1,source_snapshot_hash:"hash-1",route_manifest:["/","/contact"],created_at:"2026-02-01T00:00:00Z"};
test("keeps draft/preview separate from live",()=>{const d=createBrandPublication(base); assert.equal(d.environment,"preview"); const a=createBrandPublication({...base,status:"approved"}); const live=promoteBrandPublication(a,{company_id:"co-1",approved_snapshot_hash:"hash-1"}); assert.equal(live.status,"published");});
test("rejects unapproved live and snapshot mismatch",()=>{assert.throws(()=>createBrandPublication({...base,environment:"live"}),/not-approved/); const a=createBrandPublication({...base,status:"approved"}); assert.throws(()=>promoteBrandPublication(a,{company_id:"co-1",approved_snapshot_hash:"bad"}),/snapshot-mismatch/);});
test("rolls back only within company/site scope",()=>{const good=createBrandPublication({...base,status:"published",environment:"live"}); const bad=createBrandPublication({...base,publication_id:"pub-2",version:2,status:"published",environment:"live"}); assert.equal(rollbackBrandPublication(bad,good).publication_id,"pub-1"); assert.throws(()=>rollbackBrandPublication(bad,{...good,company_id:"co-2"}),/scope-mismatch/);});

