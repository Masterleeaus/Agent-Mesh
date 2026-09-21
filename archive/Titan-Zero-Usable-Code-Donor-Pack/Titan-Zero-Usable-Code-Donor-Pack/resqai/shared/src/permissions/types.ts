export type PermissionCheck = 'any' | 'all';

export interface RoleCheck {
  roles: string[];
  mode?: PermissionCheck;
}

export interface PermissionDefinition {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}
