"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTitanWorkforceLifecycleCompany = assertTitanWorkforceLifecycleCompany;
function assertTitanWorkforceLifecycleCompany(value) { const v = String(value ?? '').trim(); if (!v)
    throw new Error('company-id-required'); return v; }
