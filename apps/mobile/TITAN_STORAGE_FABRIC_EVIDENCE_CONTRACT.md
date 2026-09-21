# Titan Storage Fabric Evidence Contract — Pass 56

## Capture

Evidence remains encrypted in the existing Evidence Vault on capture.

## Storage-aware preflight

Before the normal upload flow begins, Titan can require a canonical Storage Fabric topology containing at least one healthy authorised evidence ingress.

If no evidence destination is authorised/healthy, the evidence remains staged on device.

Titan does not silently upload it elsewhere.

## Direct Storage Fabric evidence export

The Storage Fabric evidence exporter:

1. decrypts the evidence only into memory;
2. routes it through the `evidence` role;
3. uses the authorised endpoint selected by the canonical topology;
4. returns an integrity/authority-neutral storage receipt.

The original encrypted vault copy is retained until the existing governed evidence lifecycle confirms it is safe to remove.

## Authority

A successful object transfer does not by itself prove business evidence registration or mutate job state.

Server/Core confirmation remains separate.

## Hub boundary

Customer Hub remains subject to its existing customer-owned/customer-visible data projection rules. Storage topology cannot be used to bypass those rules.
