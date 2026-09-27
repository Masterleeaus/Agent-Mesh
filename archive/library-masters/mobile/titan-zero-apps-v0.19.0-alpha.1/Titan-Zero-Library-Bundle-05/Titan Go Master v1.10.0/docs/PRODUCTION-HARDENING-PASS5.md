# Titan Apps: Go — Production Hardening Pass 5

Version: 1.4.0

This pass hardens the worker projection trust boundary. Forbidden raw/authority-bearing keys are matched after normalization, so casing, hyphens and underscores cannot bypass the guard. Projection trees are bounded by depth/node limits and must contain JSON-safe scalar/array values rather than arbitrary PHP objects/resources.

Titan Field remains authoritative for field data and governed execution; these checks only protect Go's presentation boundary.
