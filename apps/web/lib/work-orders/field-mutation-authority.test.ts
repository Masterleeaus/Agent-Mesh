import { describe,expect,it } from "vitest";
import { assertFieldMutationAuthority } from "./field-mutation-authority";
describe("field mutation authority",()=>{
 it("prevents techs from authoritative permit and inspection mutations",()=>{
  expect(()=>assertFieldMutationAuthority({role:"tech",actor_id:"u1",kind:"permit_state",next_state:"active"})).toThrow();
  expect(()=>assertFieldMutationAuthority({role:"tech",actor_id:"u1",kind:"inspection_result",next_state:"passed"})).toThrow();
 });
 it("requires independent verifier identity",()=>{
  expect(()=>assertFieldMutationAuthority({role:"admin",actor_id:"u1",kind:"defect_state",next_state:"verified",verified_by_ref:"u2"})).toThrow(/authorized verifier/);
  expect(()=>assertFieldMutationAuthority({role:"admin",actor_id:"u1",kind:"defect_state",next_state:"verified",verified_by_ref:"u1"})).not.toThrow();
 });
 it("keeps critical deferral owner-only and reasoned",()=>{
  expect(()=>assertFieldMutationAuthority({role:"admin",actor_id:"u1",kind:"defect_state",next_state:"deferred",severity:"critical",defer_reason:"awaiting engineer"})).toThrow(/owner/);
  expect(()=>assertFieldMutationAuthority({role:"owner",actor_id:"u1",kind:"defect_state",next_state:"deferred",severity:"critical"})).toThrow(/reason/);
  expect(()=>assertFieldMutationAuthority({role:"owner",actor_id:"u1",kind:"defect_state",next_state:"deferred",severity:"critical",defer_reason:"authorized engineering hold"})).not.toThrow();
 });
});
