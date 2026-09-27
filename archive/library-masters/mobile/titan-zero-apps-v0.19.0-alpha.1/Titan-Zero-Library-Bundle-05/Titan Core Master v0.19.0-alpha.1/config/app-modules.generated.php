<?php

return array (
  'app_modules' => 
  array (
    'home' => 
    array (
      'label' => 'Home',
      'icon' => '⌂',
      'roles' => 
      array (
        0 => 'customer',
      ),
      'routes' => 
      array (
        'customer' => '/hub',
      ),
    ),
    'hub' => 
    array (
      'label' => 'Hub',
      'icon' => '◉',
      'roles' => 
      array (
        0 => 'customer',
      ),
      'routes' => 
      array (
        'customer' => '/hub',
      ),
      'donor' => 
      array (
        'hub' => 'assistant/index',
      ),
    ),
    'dashboard' => 
    array (
      'label' => 'Dashboard',
      'icon' => '⌂',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard',
      ),
    ),
    'zero' => 
    array (
      'label' => 'Zero',
      'icon' => '⊙',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard',
      ),
      'donor' => 
      array (
        'bos' => 'chief-command',
      ),
    ),
    'today' => 
    array (
      'label' => 'Today',
      'icon' => '⌂',
      'roles' => 
      array (
        0 => 'worker',
        1 => 'business',
      ),
      'routes' => 
      array (
        'worker' => '/go',
        'business' => '/dashboard',
      ),
    ),
    'ai-chat' => 
    array (
      'label' => 'AI Chat',
      'icon' => '✦',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'view' => 'conversations-list',
    ),
    'go' => 
    array (
      'label' => 'Go',
      'icon' => '◉',
      'roles' => 
      array (
        0 => 'worker',
      ),
      'routes' => 
      array (
        'worker' => '/go',
      ),
      'donor' => 
      array (
        'go' => 'intelligence/index',
      ),
    ),
    'jobs' => 
    array (
      'label' => 'Jobs',
      'icon' => '▣',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/jobs',
        'business' => '/dashboard/user/crm/field-services/work-orders',
        'worker' => '/go/jobs',
      ),
      'donor' => 
      array (
        'hub' => 'jobs/index',
        'go' => 'jobs/index',
      ),
    ),
    'job-detail' => 
    array (
      'label' => 'Job Details',
      'icon' => '▣',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/jobs',
        'business' => '/dashboard/jobs',
        'worker' => '/go/jobs',
      ),
      'donor' => 
      array (
        'hub' => 'jobs/show',
        'go' => 'job/index',
      ),
    ),
    'bookings' => 
    array (
      'label' => 'Bookings',
      'icon' => '◷',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
      ),
      'routes' => 
      array (
        'customer' => '/hub/bookings',
        'business' => '/dashboard/schedule',
      ),
    ),
    'schedule' => 
    array (
      'label' => 'Schedule',
      'icon' => '◷',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/user/crm/field-services/schedule',
      ),
    ),
    'service-requests' => 
    array (
      'label' => 'Service Requests',
      'icon' => '＋',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
      ),
      'routes' => 
      array (
        'customer' => '/hub/service-requests',
        'business' => '/dashboard/service-requests',
      ),
    ),
    'quotes' => 
    array (
      'label' => 'Quotes',
      'icon' => '◇',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
      ),
      'routes' => 
      array (
        'customer' => '/hub/quotes',
        'business' => '/dashboard/quotes',
      ),
    ),
    'invoices' => 
    array (
      'label' => 'Invoices',
      'icon' => '$',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
      ),
      'routes' => 
      array (
        'customer' => '/hub/invoices',
        'business' => '/dashboard/invoices',
      ),
    ),
    'documents' => 
    array (
      'label' => 'Documents',
      'icon' => '▤',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/documents',
        'business' => '/dashboard/documents',
        'worker' => '/go/forms',
      ),
    ),
    'messages' => 
    array (
      'label' => 'Messages',
      'icon' => '◌',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/messages',
        'business' => '/dashboard/user/titan-connect/inbox',
        'worker' => '/go/messages',
      ),
    ),
    'inbox' => 
    array (
      'label' => 'Inbox',
      'icon' => '▣',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/messages',
        'business' => '/dashboard/user/titan-connect/inbox',
        'worker' => '/go/messages',
      ),
    ),
    'notifications' => 
    array (
      'label' => 'Notifications',
      'icon' => '●',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/notifications',
        'business' => '/dashboard/notifications',
        'worker' => '/go/messages',
      ),
    ),
    'profile' => 
    array (
      'label' => 'Profile',
      'icon' => '◎',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/profile',
        'business' => '/dashboard/profile',
        'worker' => '/dashboard/profile',
      ),
    ),
    'account' => 
    array (
      'label' => 'Account',
      'icon' => '◎',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
      ),
      'routes' => 
      array (
        'customer' => '/hub/account',
        'business' => '/dashboard/settings',
      ),
    ),
    'checklist' => 
    array (
      'label' => 'Checklist',
      'icon' => '☑',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/jobs',
        'worker' => '/go/checklist',
      ),
    ),
    'photos' => 
    array (
      'label' => 'Photos',
      'icon' => '▣',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/jobs',
        'worker' => '/go/photos',
      ),
    ),
    'signatures' => 
    array (
      'label' => 'Signatures',
      'icon' => '✎',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/jobs',
        'worker' => '/go/signatures',
      ),
    ),
    'notes' => 
    array (
      'label' => 'Notes',
      'icon' => '✎',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/jobs',
        'worker' => '/go/notes',
      ),
    ),
    'materials' => 
    array (
      'label' => 'Materials',
      'icon' => '◇',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/inventory',
        'worker' => '/go/materials',
      ),
    ),
    'gear' => 
    array (
      'label' => 'Tools & Supplies',
      'icon' => '▦',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/assets',
        'worker' => '/go/gear',
      ),
    ),
    'time' => 
    array (
      'label' => 'Time',
      'icon' => '◷',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/timesheets',
        'worker' => '/go/time',
      ),
    ),
    'forms' => 
    array (
      'label' => 'Forms',
      'icon' => '▤',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/documents',
        'worker' => '/go/forms',
      ),
    ),
    'incidents' => 
    array (
      'label' => 'Incidents',
      'icon' => '⚠',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/incidents',
        'worker' => '/go/incidents',
      ),
    ),
    'sync' => 
    array (
      'label' => 'Sync',
      'icon' => '↻',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard',
        'worker' => '/go/sync',
      ),
      'donor' => 
      array (
        'go' => 'sync/index',
      ),
    ),
    'offline' => 
    array (
      'label' => 'Offline Status',
      'icon' => '◉',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard',
        'worker' => '/go',
      ),
      'donor' => 
      array (
        'go' => 'offline',
      ),
    ),
    'conflicts' => 
    array (
      'label' => 'Conflicts',
      'icon' => '⇄',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard',
        'worker' => '/go/conflicts',
      ),
    ),
    'workflows' => 
    array (
      'label' => 'Workflows',
      'icon' => '↯',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/workflows',
        'business' => '/dashboard/workflows',
        'worker' => '/go/workflows',
      ),
    ),
    'customers' => 
    array (
      'label' => 'Customers',
      'icon' => '◎',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/user/crm/contacts',
      ),
      'donor' => 
      array (
        'mobilekit' => 'listview+profile-stats',
      ),
    ),
    'leads' => 
    array (
      'label' => 'Leads',
      'icon' => '↗',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/user/crm/leads',
      ),
      'donor' => 
      array (
        'mobilekit' => 'listview+badge',
      ),
    ),
    'workforce' => 
    array (
      'label' => 'Workforce',
      'icon' => '♟',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/workforce',
      ),
      'donor' => 
      array (
        'mobilekit' => 'profile-stats+listview',
      ),
    ),
    'dispatch' => 
    array (
      'label' => 'Dispatch',
      'icon' => '⇢',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/user/crm/field-services/dispatch',
        'worker' => '/go/jobs',
      ),
      'donor' => 
      array (
        'mobilekit' => 'timeline+listview',
      ),
    ),
    'map-routes' => 
    array (
      'label' => 'Map & Routes',
      'icon' => '⌖',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/user/crm/field-services/routes',
        'worker' => '/go/jobs',
      ),
      'donor' => 
      array (
        'mobilekit' => 'card+badge',
      ),
    ),
    'payments' => 
    array (
      'label' => 'Payments',
      'icon' => '$',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
      ),
      'routes' => 
      array (
        'customer' => '/hub/invoices',
        'business' => '/dashboard/user/titan-ledger/payment-settlements',
      ),
      'donor' => 
      array (
        'mobilekit' => 'invoice+listview',
      ),
    ),
    'inventory' => 
    array (
      'label' => 'Inventory',
      'icon' => '▦',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/inventory',
        'worker' => '/go/materials',
      ),
      'donor' => 
      array (
        'mobilekit' => 'listview+badge+progress',
      ),
    ),
    'assets' => 
    array (
      'label' => 'Assets',
      'icon' => '◇',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/assets',
        'worker' => '/go/gear',
      ),
      'donor' => 
      array (
        'mobilekit' => 'card+listview',
      ),
    ),
    'reports' => 
    array (
      'label' => 'Reports',
      'icon' => '▥',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/user/titan-ledger/financial-reports',
      ),
      'donor' => 
      array (
        'mobilekit' => 'profile-stats+progress',
      ),
    ),
    'approvals' => 
    array (
      'label' => 'Approvals',
      'icon' => '✓',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/jobs',
        'business' => '/dashboard',
        'worker' => '/go/jobs',
      ),
      'donor' => 
      array (
        'mobilekit' => 'notification+listview',
      ),
    ),
    'properties' => 
    array (
      'label' => 'Properties & Sites',
      'icon' => '⌂',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'routes' => 
      array (
        'customer' => '/hub/profile',
        'business' => '/dashboard/crm',
        'worker' => '/go/jobs',
      ),
      'donor' => 
      array (
        'mobilekit' => 'card+listview',
      ),
    ),
    'expenses' => 
    array (
      'label' => 'Expenses',
      'icon' => '$',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard',
        'worker' => '/go/forms',
      ),
      'donor' => 
      array (
        'mobilekit' => 'invoice+listview',
      ),
    ),
    'guided-actions' => 
    array (
      'label' => 'Guided Actions',
      'icon' => '✦',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/workflows',
        'worker' => '/go/workflows',
      ),
      'donor' => 
      array (
        'mobilekit' => 'accordion+timeline',
      ),
    ),
    'suppliers' => 
    array (
      'label' => 'Suppliers',
      'icon' => '◇',
      'roles' => 
      array (
        0 => 'business',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/inventory',
      ),
      'donor' => 
      array (
        'mobilekit' => 'listview+badge',
      ),
    ),
    'reviews' => 
    array (
      'label' => 'Reviews & Feedback',
      'icon' => '★',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
      ),
      'routes' => 
      array (
        'customer' => '/hub',
        'business' => '/dashboard',
      ),
      'donor' => 
      array (
        'mobilekit' => 'card+badge',
      ),
    ),
    'safety' => 
    array (
      'label' => 'Safety & Compliance',
      'icon' => '⚠',
      'roles' => 
      array (
        0 => 'business',
        1 => 'worker',
      ),
      'routes' => 
      array (
        'business' => '/dashboard/incidents',
        'worker' => '/go/incidents',
      ),
      'donor' => 
      array (
        'mobilekit' => 'progress+notification+listview',
      ),
    ),
    'help' => 
    array (
      'label' => 'Help',
      'icon' => '?',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'view' => 'articles-list',
    ),
    'settings' => 
    array (
      'label' => 'Settings',
      'icon' => '⚙',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'view' => 'settings',
    ),
    'more' => 
    array (
      'label' => 'More',
      'icon' => '☷',
      'roles' => 
      array (
        0 => 'customer',
        1 => 'business',
        2 => 'worker',
      ),
      'view' => 'module',
    ),
  ),
  'app_action_profiles' => 
  array (
    'customer_summary' => 
    array (
      'resource_scope' => 'customer_self',
      'actions' => 
      array (
        0 => 'view',
        1 => 'ask_ai',
      ),
    ),
    'customer_chat' => 
    array (
      'resource_scope' => 'customer_self',
      'actions' => 
      array (
        0 => 'ask_ai',
        1 => 'send_message',
        2 => 'upload_file',
      ),
    ),
    'customer_jobs' => 
    array (
      'resource_scope' => 'customer_owned_jobs',
      'actions' => 
      array (
        0 => 'view',
        1 => 'ask_ai',
        2 => 'request_reschedule',
        3 => 'request_cancel',
        4 => 'approve_variation',
      ),
    ),
    'customer_bookings' => 
    array (
      'resource_scope' => 'customer_owned_bookings',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create_booking',
        2 => 'request_reschedule',
        3 => 'request_cancel',
      ),
    ),
    'customer_service' => 
    array (
      'resource_scope' => 'customer_owned_requests',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create_request',
        2 => 'add_detail',
        3 => 'upload_file',
      ),
    ),
    'customer_quotes' => 
    array (
      'resource_scope' => 'customer_owned_quotes',
      'actions' => 
      array (
        0 => 'view',
        1 => 'accept_quote',
        2 => 'request_change',
        3 => 'download',
      ),
    ),
    'customer_invoices' => 
    array (
      'resource_scope' => 'customer_owned_invoices',
      'actions' => 
      array (
        0 => 'view',
        1 => 'pay',
        2 => 'download',
        3 => 'dispute',
      ),
    ),
    'customer_documents' => 
    array (
      'resource_scope' => 'customer_owned_documents',
      'actions' => 
      array (
        0 => 'view',
        1 => 'download',
        2 => 'upload_customer_document',
      ),
    ),
    'customer_messages' => 
    array (
      'resource_scope' => 'customer_conversations',
      'actions' => 
      array (
        0 => 'view',
        1 => 'send_message',
        2 => 'request_handoff',
      ),
    ),
    'customer_notifications' => 
    array (
      'resource_scope' => 'customer_notifications',
      'actions' => 
      array (
        0 => 'view',
        1 => 'mark_read',
        2 => 'manage_notification_preferences',
      ),
    ),
    'customer_profile' => 
    array (
      'resource_scope' => 'customer_self',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update_own_profile',
      ),
    ),
    'customer_account' => 
    array (
      'resource_scope' => 'customer_self',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update_own_account',
      ),
    ),
    'customer_workflows' => 
    array (
      'resource_scope' => 'customer_owned_workflows',
      'actions' => 
      array (
        0 => 'view',
        1 => 'continue_self_service_workflow',
      ),
    ),
    'customer_payments' => 
    array (
      'resource_scope' => 'customer_owned_payments',
      'actions' => 
      array (
        0 => 'view',
        1 => 'pay',
        2 => 'download_receipt',
      ),
    ),
    'customer_approvals' => 
    array (
      'resource_scope' => 'customer_owned_approvals',
      'actions' => 
      array (
        0 => 'view',
        1 => 'approve_customer_request',
        2 => 'reject_customer_request',
      ),
    ),
    'customer_properties' => 
    array (
      'resource_scope' => 'customer_owned_properties',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update_owned_property',
      ),
    ),
    'customer_reviews' => 
    array (
      'resource_scope' => 'customer_owned_reviews',
      'actions' => 
      array (
        0 => 'view',
        1 => 'submit_review',
        2 => 'update_own_review',
      ),
    ),
    'customer_help' => 
    array (
      'resource_scope' => 'public_customer_knowledge',
      'actions' => 
      array (
        0 => 'view',
        1 => 'search',
      ),
    ),
    'customer_settings' => 
    array (
      'resource_scope' => 'customer_self',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update_own_settings',
      ),
    ),
    'business_summary' => 
    array (
      'resource_scope' => 'company_permitted',
      'actions' => 
      array (
        0 => 'view',
        1 => 'ask_ai',
        2 => 'export_company',
      ),
    ),
    'business_chat' => 
    array (
      'resource_scope' => 'company_permitted',
      'actions' => 
      array (
        0 => 'ask_ai',
        1 => 'send_message',
        2 => 'execute_governed_action',
      ),
    ),
    'business_jobs' => 
    array (
      'resource_scope' => 'company_jobs',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'assign_worker',
        4 => 'reschedule',
        5 => 'close',
        6 => 'escalate',
        7 => 'export_company',
      ),
    ),
    'business_schedule' => 
    array (
      'resource_scope' => 'company_schedule',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'assign_worker',
        4 => 'reschedule',
        5 => 'dispatch_company',
      ),
    ),
    'business_customer_ops' => 
    array (
      'resource_scope' => 'company_customers',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'message',
        4 => 'export_company',
      ),
    ),
    'business_quotes' => 
    array (
      'resource_scope' => 'company_quotes',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'approve',
        4 => 'send',
        5 => 'manage_pricing',
        6 => 'view_margin',
      ),
    ),
    'business_finance' => 
    array (
      'resource_scope' => 'company_finance',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'reconcile',
        4 => 'refund',
        5 => 'export_company',
        6 => 'view_margin',
      ),
    ),
    'business_documents' => 
    array (
      'resource_scope' => 'company_documents',
      'actions' => 
      array (
        0 => 'view',
        1 => 'upload',
        2 => 'download',
        3 => 'share',
        4 => 'export_company',
      ),
    ),
    'business_messages' => 
    array (
      'resource_scope' => 'company_conversations',
      'actions' => 
      array (
        0 => 'view',
        1 => 'send_message',
        2 => 'assign_conversation',
        3 => 'request_handoff',
      ),
    ),
    'business_notifications' => 
    array (
      'resource_scope' => 'company_notifications',
      'actions' => 
      array (
        0 => 'view',
        1 => 'mark_read',
        2 => 'manage_notification_preferences',
      ),
    ),
    'business_self' => 
    array (
      'resource_scope' => 'actor_self',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update',
      ),
    ),
    'business_work_execution' => 
    array (
      'resource_scope' => 'company_jobs',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update',
        2 => 'review',
        3 => 'approve',
        4 => 'capture_evidence',
      ),
    ),
    'business_resources' => 
    array (
      'resource_scope' => 'company_resources',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'manage_inventory',
        4 => 'manage_assets',
        5 => 'manage_suppliers',
        6 => 'export_company',
      ),
    ),
    'business_time_expenses' => 
    array (
      'resource_scope' => 'company_time_expenses',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update',
        2 => 'approve',
        3 => 'export_company',
      ),
    ),
    'business_sync' => 
    array (
      'resource_scope' => 'company_sync',
      'actions' => 
      array (
        0 => 'view',
        1 => 'retry_sync',
        2 => 'resolve_conflict',
      ),
    ),
    'business_workflows' => 
    array (
      'resource_scope' => 'company_workflows',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'approve',
        4 => 'execute_governed_action',
      ),
    ),
    'business_workforce' => 
    array (
      'resource_scope' => 'company_workforce',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'manage_workforce',
        4 => 'assign_worker',
        5 => 'export_company',
      ),
    ),
    'business_dispatch' => 
    array (
      'resource_scope' => 'company_dispatch',
      'actions' => 
      array (
        0 => 'view',
        1 => 'assign_worker',
        2 => 'dispatch_company',
        3 => 'reschedule',
      ),
    ),
    'business_reports' => 
    array (
      'resource_scope' => 'company_reporting',
      'actions' => 
      array (
        0 => 'view',
        1 => 'export_company',
        2 => 'view_margin',
      ),
    ),
    'business_approvals' => 
    array (
      'resource_scope' => 'company_approvals',
      'actions' => 
      array (
        0 => 'view',
        1 => 'approve',
        2 => 'reject',
        3 => 'execute_governed_action',
      ),
    ),
    'business_properties' => 
    array (
      'resource_scope' => 'company_properties',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'assign_worker',
      ),
    ),
    'business_reviews' => 
    array (
      'resource_scope' => 'company_reviews',
      'actions' => 
      array (
        0 => 'view',
        1 => 'respond',
        2 => 'request_review',
      ),
    ),
    'business_safety' => 
    array (
      'resource_scope' => 'company_safety',
      'actions' => 
      array (
        0 => 'view',
        1 => 'create',
        2 => 'update',
        3 => 'approve',
        4 => 'export_company',
      ),
    ),
    'business_help' => 
    array (
      'resource_scope' => 'company_knowledge',
      'actions' => 
      array (
        0 => 'view',
        1 => 'search',
      ),
    ),
    'business_settings' => 
    array (
      'resource_scope' => 'company_settings',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update',
      ),
    ),
    'worker_summary' => 
    array (
      'resource_scope' => 'assigned_work',
      'actions' => 
      array (
        0 => 'view',
        1 => 'ask_ai',
      ),
    ),
    'worker_chat' => 
    array (
      'resource_scope' => 'assigned_work',
      'actions' => 
      array (
        0 => 'ask_ai',
        1 => 'send_message',
        2 => 'upload_file',
      ),
    ),
    'worker_go' => 
    array (
      'resource_scope' => 'assigned_work',
      'actions' => 
      array (
        0 => 'view',
        1 => 'ask_ai',
        2 => 'send_message',
        3 => 'capture_evidence',
        4 => 'navigate',
        5 => 'execute_governed_action',
      ),
    ),
    'worker_inbox' => 
    array (
      'resource_scope' => 'assigned_work_messages',
      'actions' => 
      array (
        0 => 'view',
        1 => 'mark_read',
        2 => 'acknowledge',
        3 => 'reply',
        4 => 'escalate',
      ),
    ),
    'worker_jobs' => 
    array (
      'resource_scope' => 'assigned_jobs',
      'actions' => 
      array (
        0 => 'view',
        1 => 'start_job',
        2 => 'pause_job',
        3 => 'complete_job',
        4 => 'add_note',
        5 => 'capture_evidence',
        6 => 'request_approval',
        7 => 'escalate',
      ),
    ),
    'worker_documents' => 
    array (
      'resource_scope' => 'assigned_documents',
      'actions' => 
      array (
        0 => 'view',
        1 => 'download',
        2 => 'upload_file',
      ),
    ),
    'worker_messages' => 
    array (
      'resource_scope' => 'assigned_conversations',
      'actions' => 
      array (
        0 => 'view',
        1 => 'send_message',
      ),
    ),
    'worker_notifications' => 
    array (
      'resource_scope' => 'actor_notifications',
      'actions' => 
      array (
        0 => 'view',
        1 => 'mark_read',
      ),
    ),
    'worker_profile' => 
    array (
      'resource_scope' => 'actor_self',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update_own_profile',
      ),
    ),
    'worker_checklist' => 
    array (
      'resource_scope' => 'assigned_jobs',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update_assigned_checklist',
      ),
    ),
    'worker_evidence' => 
    array (
      'resource_scope' => 'assigned_jobs',
      'actions' => 
      array (
        0 => 'view',
        1 => 'capture_evidence',
        2 => 'upload_file',
      ),
    ),
    'worker_notes' => 
    array (
      'resource_scope' => 'assigned_jobs',
      'actions' => 
      array (
        0 => 'view',
        1 => 'add_note',
        2 => 'update_own_note',
      ),
    ),
    'worker_materials' => 
    array (
      'resource_scope' => 'assigned_stock',
      'actions' => 
      array (
        0 => 'view',
        1 => 'consume_assigned_stock',
        2 => 'request_stock',
      ),
    ),
    'worker_gear' => 
    array (
      'resource_scope' => 'assigned_assets',
      'actions' => 
      array (
        0 => 'view',
        1 => 'inspect_assigned_asset',
        2 => 'report_asset_issue',
      ),
    ),
    'worker_time' => 
    array (
      'resource_scope' => 'actor_time',
      'actions' => 
      array (
        0 => 'view',
        1 => 'start_time',
        2 => 'stop_time',
        3 => 'submit_time',
      ),
    ),
    'worker_forms' => 
    array (
      'resource_scope' => 'assigned_forms',
      'actions' => 
      array (
        0 => 'view',
        1 => 'submit_assigned_form',
      ),
    ),
    'worker_incidents' => 
    array (
      'resource_scope' => 'assigned_or_own_incidents',
      'actions' => 
      array (
        0 => 'view',
        1 => 'report_incident',
        2 => 'update_own_incident',
        3 => 'escalate',
      ),
    ),
    'worker_sync' => 
    array (
      'resource_scope' => 'actor_device_sync',
      'actions' => 
      array (
        0 => 'view',
        1 => 'retry_sync',
        2 => 'resolve_own_conflict',
      ),
    ),
    'worker_workflows' => 
    array (
      'resource_scope' => 'assigned_workflows',
      'actions' => 
      array (
        0 => 'view',
        1 => 'execute_assigned_workflow',
        2 => 'request_approval',
        3 => 'escalate',
      ),
    ),
    'worker_dispatch' => 
    array (
      'resource_scope' => 'assigned_dispatch',
      'actions' => 
      array (
        0 => 'view',
        1 => 'accept_assignment',
        2 => 'acknowledge_dispatch',
      ),
    ),
    'worker_route' => 
    array (
      'resource_scope' => 'assigned_route',
      'actions' => 
      array (
        0 => 'view',
        1 => 'navigate',
      ),
    ),
    'worker_inventory' => 
    array (
      'resource_scope' => 'assigned_stock',
      'actions' => 
      array (
        0 => 'view',
        1 => 'consume_assigned_stock',
        2 => 'request_stock',
      ),
    ),
    'worker_assets' => 
    array (
      'resource_scope' => 'assigned_assets',
      'actions' => 
      array (
        0 => 'view',
        1 => 'inspect_assigned_asset',
        2 => 'report_asset_issue',
      ),
    ),
    'worker_approvals' => 
    array (
      'resource_scope' => 'assigned_approvals',
      'actions' => 
      array (
        0 => 'view',
        1 => 'request_approval',
        2 => 'respond_to_assigned_approval',
      ),
    ),
    'worker_properties' => 
    array (
      'resource_scope' => 'assigned_sites',
      'actions' => 
      array (
        0 => 'view',
        1 => 'view_assigned_site',
      ),
    ),
    'worker_expenses' => 
    array (
      'resource_scope' => 'actor_expenses',
      'actions' => 
      array (
        0 => 'view',
        1 => 'submit_expense',
        2 => 'update_own_expense',
      ),
    ),
    'worker_guided' => 
    array (
      'resource_scope' => 'assigned_workflows',
      'actions' => 
      array (
        0 => 'view',
        1 => 'execute_assigned_workflow',
        2 => 'request_approval',
        3 => 'escalate',
      ),
    ),
    'worker_safety' => 
    array (
      'resource_scope' => 'assigned_safety',
      'actions' => 
      array (
        0 => 'view',
        1 => 'acknowledge_safety',
        2 => 'report_incident',
        3 => 'stop_work_escalation',
      ),
    ),
    'worker_help' => 
    array (
      'resource_scope' => 'worker_knowledge',
      'actions' => 
      array (
        0 => 'view',
        1 => 'search',
      ),
    ),
    'worker_settings' => 
    array (
      'resource_scope' => 'actor_self',
      'actions' => 
      array (
        0 => 'view',
        1 => 'update_own_settings',
      ),
    ),
  ),
  'app_role_policies' => 
  array (
    'customer' => 
    array (
      'audience' => 'customer_or_lead',
      'data_scope' => 'customer_self',
      'objective' => 'Self-service sales, booking, support, approval and payment without exposing internal business data.',
      'module_profiles' => 
      array (
        'home' => 'customer_summary',
        'hub' => 'customer_chat',
        'ai-chat' => 'customer_chat',
        'jobs' => 'customer_jobs',
        'job-detail' => 'customer_jobs',
        'bookings' => 'customer_bookings',
        'service-requests' => 'customer_service',
        'quotes' => 'customer_quotes',
        'invoices' => 'customer_invoices',
        'documents' => 'customer_documents',
        'messages' => 'customer_messages',
        'inbox' => 'customer_messages',
        'notifications' => 'customer_notifications',
        'profile' => 'customer_profile',
        'account' => 'customer_account',
        'workflows' => 'customer_workflows',
        'payments' => 'customer_payments',
        'approvals' => 'customer_approvals',
        'properties' => 'customer_properties',
        'reviews' => 'customer_reviews',
        'help' => 'customer_help',
        'settings' => 'customer_settings',
        'more' => 'customer_settings',
      ),
    ),
    'business' => 
    array (
      'audience' => 'owner_or_manager',
      'data_scope' => 'company_permitted',
      'objective' => 'Operate the company across installed extensions within the authenticated actor permissions and autonomy ceiling.',
      'module_profiles' => 
      array (
        'dashboard' => 'business_summary',
        'zero' => 'business_chat',
        'today' => 'business_summary',
        'ai-chat' => 'business_chat',
        'jobs' => 'business_jobs',
        'job-detail' => 'business_jobs',
        'bookings' => 'business_schedule',
        'schedule' => 'business_schedule',
        'service-requests' => 'business_customer_ops',
        'quotes' => 'business_quotes',
        'invoices' => 'business_finance',
        'documents' => 'business_documents',
        'messages' => 'business_messages',
        'inbox' => 'business_messages',
        'notifications' => 'business_notifications',
        'profile' => 'business_self',
        'account' => 'business_self',
        'checklist' => 'business_work_execution',
        'photos' => 'business_work_execution',
        'signatures' => 'business_work_execution',
        'notes' => 'business_work_execution',
        'materials' => 'business_resources',
        'gear' => 'business_resources',
        'time' => 'business_time_expenses',
        'forms' => 'business_work_execution',
        'incidents' => 'business_safety',
        'sync' => 'business_sync',
        'offline' => 'business_sync',
        'conflicts' => 'business_sync',
        'workflows' => 'business_workflows',
        'customers' => 'business_customer_ops',
        'leads' => 'business_customer_ops',
        'workforce' => 'business_workforce',
        'dispatch' => 'business_dispatch',
        'map-routes' => 'business_dispatch',
        'payments' => 'business_finance',
        'inventory' => 'business_resources',
        'assets' => 'business_resources',
        'reports' => 'business_reports',
        'approvals' => 'business_approvals',
        'properties' => 'business_properties',
        'expenses' => 'business_time_expenses',
        'guided-actions' => 'business_workflows',
        'suppliers' => 'business_resources',
        'reviews' => 'business_reviews',
        'safety' => 'business_safety',
        'help' => 'business_help',
        'settings' => 'business_settings',
        'more' => 'business_settings',
      ),
    ),
    'worker' => 
    array (
      'audience' => 'company_worker',
      'data_scope' => 'assigned_work',
      'objective' => 'Execute assigned work safely with job/site context, evidence capture and escalation but no company-wide management access.',
      'module_profiles' => 
      array (
        'today' => 'worker_summary',
        'ai-chat' => 'worker_chat',
        'go' => 'worker_go',
        'jobs' => 'worker_jobs',
        'job-detail' => 'worker_jobs',
        'documents' => 'worker_documents',
        'messages' => 'worker_messages',
        'inbox' => 'worker_inbox',
        'notifications' => 'worker_notifications',
        'profile' => 'worker_profile',
        'checklist' => 'worker_checklist',
        'photos' => 'worker_evidence',
        'signatures' => 'worker_evidence',
        'notes' => 'worker_notes',
        'materials' => 'worker_materials',
        'gear' => 'worker_gear',
        'time' => 'worker_time',
        'forms' => 'worker_forms',
        'incidents' => 'worker_incidents',
        'sync' => 'worker_sync',
        'offline' => 'worker_sync',
        'conflicts' => 'worker_sync',
        'workflows' => 'worker_workflows',
        'dispatch' => 'worker_dispatch',
        'map-routes' => 'worker_route',
        'inventory' => 'worker_inventory',
        'assets' => 'worker_assets',
        'approvals' => 'worker_approvals',
        'properties' => 'worker_properties',
        'expenses' => 'worker_expenses',
        'guided-actions' => 'worker_guided',
        'safety' => 'worker_safety',
        'help' => 'worker_help',
        'settings' => 'worker_settings',
        'more' => 'worker_settings',
      ),
    ),
  ),
  'app_module_contract' => 
  array (
    'required' => 
    array (
      0 => 'home',
      1 => 'hub',
      2 => 'dashboard',
      3 => 'zero',
      4 => 'ai-chat',
      5 => 'go',
      6 => 'jobs',
      7 => 'job-detail',
      8 => 'customers',
      9 => 'leads',
      10 => 'workforce',
      11 => 'dispatch',
      12 => 'schedule',
      13 => 'map-routes',
      14 => 'bookings',
      15 => 'quotes',
      16 => 'service-requests',
      17 => 'invoices',
      18 => 'payments',
      19 => 'inventory',
      20 => 'assets',
      21 => 'documents',
      22 => 'reports',
      23 => 'approvals',
      24 => 'properties',
      25 => 'expenses',
      26 => 'suppliers',
      27 => 'reviews',
      28 => 'safety',
      29 => 'checklist',
      30 => 'photos',
      31 => 'signatures',
      32 => 'notes',
      33 => 'materials',
      34 => 'gear',
      35 => 'time',
      36 => 'forms',
      37 => 'incidents',
      38 => 'messages',
      39 => 'notifications',
      40 => 'sync',
      41 => 'conflicts',
      42 => 'workflows',
      43 => 'profile',
      44 => 'account',
      45 => 'help',
      46 => 'settings',
      47 => 'more',
    ),
    'aliases' => 
    array (
      'checklists' => 'checklist',
      'tools' => 'gear',
      'tools-supplies' => 'gear',
    ),
  ),
  'app_module_groups' => 
  array (
    'customer' => 
    array (
      'Service' => 
      array (
        0 => 'home',
        1 => 'hub',
        2 => 'ai-chat',
        3 => 'bookings',
        4 => 'jobs',
        5 => 'job-detail',
        6 => 'service-requests',
        7 => 'quotes',
        8 => 'properties',
      ),
      'Money' => 
      array (
        0 => 'invoices',
        1 => 'payments',
        2 => 'approvals',
      ),
      'Support' => 
      array (
        0 => 'inbox',
        1 => 'documents',
        2 => 'messages',
        3 => 'notifications',
        4 => 'reviews',
        5 => 'workflows',
        6 => 'help',
      ),
      'Account' => 
      array (
        0 => 'profile',
        1 => 'account',
        2 => 'settings',
        3 => 'more',
      ),
    ),
    'business' => 
    array (
      'Operate' => 
      array (
        0 => 'dashboard',
        1 => 'zero',
        2 => 'today',
        3 => 'ai-chat',
        4 => 'jobs',
        5 => 'job-detail',
        6 => 'schedule',
        7 => 'dispatch',
        8 => 'map-routes',
        9 => 'workflows',
        10 => 'guided-actions',
        11 => 'approvals',
      ),
      'Customers' => 
      array (
        0 => 'customers',
        1 => 'leads',
        2 => 'bookings',
        3 => 'service-requests',
        4 => 'quotes',
        5 => 'reviews',
        6 => 'properties',
      ),
      'Team' => 
      array (
        0 => 'workforce',
        1 => 'checklist',
        2 => 'photos',
        3 => 'signatures',
        4 => 'notes',
        5 => 'time',
        6 => 'forms',
        7 => 'incidents',
        8 => 'safety',
      ),
      'Money' => 
      array (
        0 => 'invoices',
        1 => 'payments',
        2 => 'expenses',
        3 => 'reports',
      ),
      'Resources' => 
      array (
        0 => 'inventory',
        1 => 'assets',
        2 => 'materials',
        3 => 'gear',
        4 => 'suppliers',
        5 => 'documents',
      ),
      'Communication' => 
      array (
        0 => 'inbox',
        1 => 'messages',
        2 => 'notifications',
        3 => 'sync',
        4 => 'offline',
        5 => 'conflicts',
      ),
      'Account' => 
      array (
        0 => 'profile',
        1 => 'account',
        2 => 'settings',
        3 => 'more',
        4 => 'help',
      ),
    ),
    'worker' => 
    array (
      'Work' => 
      array (
        0 => 'today',
        1 => 'go',
        2 => 'ai-chat',
        3 => 'jobs',
        4 => 'job-detail',
        5 => 'dispatch',
        6 => 'schedule',
        7 => 'checklist',
        8 => 'workflows',
        9 => 'guided-actions',
        10 => 'approvals',
      ),
      'Field' => 
      array (
        0 => 'photos',
        1 => 'signatures',
        2 => 'notes',
        3 => 'materials',
        4 => 'gear',
        5 => 'time',
        6 => 'forms',
        7 => 'incidents',
        8 => 'safety',
        9 => 'map-routes',
        10 => 'inventory',
        11 => 'assets',
        12 => 'expenses',
        13 => 'properties',
        14 => 'documents',
      ),
      'Communication' => 
      array (
        0 => 'inbox',
        1 => 'messages',
        2 => 'notifications',
        3 => 'sync',
        4 => 'offline',
        5 => 'conflicts',
      ),
      'Account' => 
      array (
        0 => 'profile',
        1 => 'settings',
        2 => 'more',
        3 => 'help',
      ),
    ),
  ),
  'app_module_patterns' => 
  array (
    'financial' => 
    array (
      0 => 'quotes',
      1 => 'invoices',
      2 => 'payments',
      3 => 'expenses',
      4 => 'reports',
    ),
    'people' => 
    array (
      0 => 'customers',
      1 => 'leads',
      2 => 'workforce',
      3 => 'suppliers',
      4 => 'reviews',
      5 => 'profile',
      6 => 'account',
    ),
    'field' => 
    array (
      0 => 'jobs',
      1 => 'job-detail',
      2 => 'today',
      3 => 'schedule',
      4 => 'dispatch',
      5 => 'map-routes',
      6 => 'checklist',
      7 => 'photos',
      8 => 'signatures',
      9 => 'notes',
      10 => 'materials',
      11 => 'gear',
      12 => 'time',
      13 => 'forms',
      14 => 'properties',
    ),
    'exception' => 
    array (
      0 => 'approvals',
      1 => 'incidents',
      2 => 'safety',
      3 => 'conflicts',
      4 => 'guided-actions',
      5 => 'service-requests',
    ),
    'communication' => 
    array (
      0 => 'messages',
      1 => 'inbox',
      2 => 'hub',
      3 => 'go',
      4 => 'notifications',
      5 => 'documents',
      6 => 'workflows',
      7 => 'sync',
      8 => 'offline',
    ),
    'resources' => 
    array (
      0 => 'inventory',
      1 => 'assets',
    ),
    'dashboard' => 
    array (
      0 => 'home',
      1 => 'hub',
      2 => 'dashboard',
      3 => 'zero',
      4 => 'bookings',
    ),
  ),
  'app_navigation_defaults' => 
  array (
    'customer' => 
    array (
      0 => 'home',
      1 => 'bookings',
      2 => 'hub',
      3 => 'inbox',
      4 => 'more',
      5 => 'jobs',
      6 => 'job-detail',
      7 => 'service-requests',
      8 => 'quotes',
      9 => 'invoices',
      10 => 'payments',
      11 => 'approvals',
      12 => 'properties',
      13 => 'documents',
      14 => 'messages',
      15 => 'notifications',
      16 => 'reviews',
      17 => 'profile',
      18 => 'account',
      19 => 'workflows',
      20 => 'help',
      21 => 'settings',
      22 => 'ai-chat',
    ),
    'business' => 
    array (
      0 => 'zero',
      1 => 'jobs',
      2 => 'inbox',
      3 => 'more',
      4 => 'dashboard',
      5 => 'today',
      6 => 'ai-chat',
      7 => 'customers',
      8 => 'leads',
      9 => 'jobs',
      10 => 'job-detail',
      11 => 'schedule',
      12 => 'dispatch',
      13 => 'map-routes',
      14 => 'bookings',
      15 => 'service-requests',
      16 => 'quotes',
      17 => 'invoices',
      18 => 'payments',
      19 => 'approvals',
      20 => 'properties',
      21 => 'documents',
      22 => 'inbox',
      23 => 'messages',
      24 => 'notifications',
      25 => 'workforce',
      26 => 'checklist',
      27 => 'photos',
      28 => 'signatures',
      29 => 'notes',
      30 => 'materials',
      31 => 'inventory',
      32 => 'assets',
      33 => 'gear',
      34 => 'time',
      35 => 'expenses',
      36 => 'forms',
      37 => 'incidents',
      38 => 'safety',
      39 => 'guided-actions',
      40 => 'suppliers',
      41 => 'reviews',
      42 => 'reports',
      43 => 'sync',
      44 => 'offline',
      45 => 'conflicts',
      46 => 'workflows',
      47 => 'profile',
      48 => 'account',
      49 => 'help',
    ),
    'worker' => 
    array (
      0 => 'today',
      1 => 'jobs',
      2 => 'go',
      3 => 'inbox',
      4 => 'job-detail',
      5 => 'dispatch',
      6 => 'map-routes',
      7 => 'checklist',
      8 => 'photos',
      9 => 'signatures',
      10 => 'notes',
      11 => 'materials',
      12 => 'inventory',
      13 => 'assets',
      14 => 'gear',
      15 => 'time',
      16 => 'expenses',
      17 => 'forms',
      18 => 'incidents',
      19 => 'safety',
      20 => 'approvals',
      21 => 'properties',
      22 => 'guided-actions',
      23 => 'messages',
      24 => 'notifications',
      25 => 'sync',
      26 => 'offline',
      27 => 'conflicts',
      28 => 'workflows',
      29 => 'profile',
      30 => 'help',
      31 => 'settings',
      32 => 'more',
    ),
  ),
  'app_footer_defaults' => 
  array (
    'customer' => 
    array (
      0 => 'home',
      1 => 'bookings',
      2 => 'hub',
      3 => 'inbox',
      4 => 'more',
    ),
    'business' => 
    array (
      0 => 'zero',
      1 => 'jobs',
      2 => 'inbox',
      3 => 'more',
    ),
    'worker' => 
    array (
      0 => 'today',
      1 => 'jobs',
      2 => 'go',
      3 => 'inbox',
      4 => 'more',
    ),
  ),
);
