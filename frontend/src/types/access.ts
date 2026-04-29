export type AppRole = 'admin' | 'encoder' | 'paralegal' | 'processor' | 'accounting';

export interface PermissionMap {
  access_brokerage_module: boolean;
  access_legal_module: boolean;
  manage_users: boolean;
  manage_clients: boolean;
  view_reports: boolean;
  view_audit_logs: boolean;
  manage_transaction_oversight: boolean;
  upload_archives: boolean;
  manage_notarial_books: boolean;
  manage_notarial_templates: boolean;
}
