(function attachTitanZeroSkills(global) {
    'use strict';

    const SKILLS = Object.freeze([
        {
            id: 'titan-zero-core-discovery',
            title: 'Titan Zero Core Discovery',
            category: 'Titan Zero Core',
            mode: 'read_only',
            description: 'Recognize and map the Titan Zero host application while including extension internals as first-class code.',
            rules: ['Fingerprint before editing.', 'Map ownership before choosing files.', 'Include app/Extensions/** and preserve extension ownership boundaries.']
        },
        {
            id: 'titan-zero-schema-analysis',
            title: 'Titan Zero Schema Analysis',
            category: 'Titan Zero Core',
            mode: 'read_only',
            description: 'Parse DDL, summarize tables/columns/index-relevant structure, and identify schema impact without reading data values.',
            rules: ['DDL only.', 'Never emit secrets or row values.', 'Compare schema assumptions before migrations.']
        },
        {
            id: 'titan-zero-tenancy-analysis',
            title: 'Titan Zero Tenancy Analysis',
            category: 'Titan Zero Core',
            mode: 'read_only',
            description: 'Identify company, tenant-company, and user ownership signals before query or migration changes.',
            rules: ['Do not assume one global tenancy column.', 'Resolve ownership from domain evidence.', 'Flag mixed boundaries.']
        },
        {
            id: 'titan-zero-route-impact',
            title: 'Titan Zero Route Impact',
            category: 'Titan Zero Core',
            mode: 'read_only',
            description: 'Map core route declarations, named routes, controllers, and downstream UI impact.',
            rules: ['Check route names before navigation edits.', 'Detect duplicate names.', 'Keep route-cache compatibility in mind.']
        },
        {
            id: 'titan-zero-theme-impact',
            title: 'Titan Zero Theme Impact',
            category: 'Titan Zero Core',
            mode: 'read_only',
            description: 'Identify view-family and asset parity requirements across Titan Zero themes.',
            rules: ['Preserve existing UI patterns.', 'Check every affected view family.', 'Do not assume default theme is the only surface.']
        },
        {
            id: 'titan-zero-safe-core-change',
            title: 'Titan Zero Safe Core Change',
            category: 'Titan Zero Core',
            mode: 'governed',
            description: 'Force impact-before-edit and evidence-before-completion for host-level changes.',
            rules: ['Discover ownership.', 'Map impact.', 'Propose smallest file set.', 'Edit.', 'Run targeted verification.', 'Provide rollback evidence.']
        }
    ]);

    global.CodeeTitanZeroSkills = SKILLS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
