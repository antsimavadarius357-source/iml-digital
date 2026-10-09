export const ROLE_CODES = ['ADMIN', 'DIRECTION', 'AGENT', 'COACH', 'FORMATEUR', 'BENEFICIAIRE'] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

/**
 * Source de vérité des permissions (appliquées côté serveur par requirePermission).
 * Étendue module par module en phase 4.
 */
export const PERMISSIONS = [
  'dashboard:read',
  'dashboard:global',
  'users:manage',
  'audit:read',
  'beneficiaries:read',
  'beneficiaries:write',
  'applications:review',
  'pathways:manage',
  'appointments:manage',
  'documents:read',
  'training:manage',
  'contacts:read',
  'reports:read',
  'settings:manage',
  'portal:access',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<RoleCode, readonly Permission[]> = {
  ADMIN: ['dashboard:read', 'users:manage', 'audit:read', 'settings:manage'],
  DIRECTION: [
    'dashboard:read', 'dashboard:global', 'beneficiaries:read', 'applications:review', 'pathways:manage',
    'appointments:manage', 'documents:read', 'training:manage', 'contacts:read', 'reports:read', 'audit:read',
  ],
  AGENT: [
    'dashboard:read', 'beneficiaries:read', 'beneficiaries:write', 'applications:review', 'pathways:manage',
    'appointments:manage', 'documents:read', 'contacts:read',
  ],
  COACH: ['dashboard:read', 'beneficiaries:read', 'appointments:manage', 'documents:read', 'contacts:read'],
  FORMATEUR: ['dashboard:read', 'training:manage', 'documents:read'],
  BENEFICIAIRE: ['dashboard:read', 'portal:access'],
};

export function permissionsFor(role: string): readonly Permission[] {
  return ROLE_PERMISSIONS[role as RoleCode] ?? [];
}
