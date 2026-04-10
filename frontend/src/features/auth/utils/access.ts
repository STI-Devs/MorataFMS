import type { AppRole, PermissionMap } from '../../../types/access';
import { appRoutes } from '../../../lib/appRoutes';

type AccessUser = {
  role: AppRole;
  departments?: string[];
  role_label?: string;
  permissions?: PermissionMap;
} | null | undefined;

export function hasBrokerageAccess(user: AccessUser): boolean {
  if (!user) return false;

  if (user.permissions?.access_brokerage_module !== undefined) {
    return user.permissions.access_brokerage_module;
  }

  if (user.departments) {
    return user.departments.includes('brokerage');
  }

  return user.role === 'admin';
}

export function hasLegalAccess(user: AccessUser): boolean {
  if (!user) return false;

  if (user.permissions?.access_legal_module !== undefined) {
    return user.permissions.access_legal_module;
  }

  if (user.departments) {
    return user.departments.includes('legal');
  }

  return user.role === 'admin';
}

export function hasProcessorAccess(user: AccessUser): boolean {
  if (!user) return false;
  return user.role === 'processor';
}

export function hasAccountantAccess(user: AccessUser): boolean {
  if (!user) return false;
  return user.role === 'accounting';
}

export function getHomePath(user: AccessUser): string {
  if (!user) return appRoutes.login;
  if (user.role === 'admin') return appRoutes.dashboard;
  if (user.role === 'processor') return appRoutes.processorDashboard;
  if (user.role === 'accounting') return appRoutes.accountantDashboard;
  if (hasLegalAccess(user) && !hasBrokerageAccess(user)) return appRoutes.lawFirm;

  return appRoutes.tracking;
}

export function getRoleLabel(user: AccessUser): string {
  if (!user) return 'User';

  return user.role_label ?? user.role.charAt(0).toUpperCase() + user.role.slice(1);
}
