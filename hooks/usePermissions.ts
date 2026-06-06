// hooks/usePermissions.ts
// Usage anywhere:
//   const { can } = usePermissions();
//   {can.canViewPayments && <SidebarItem />}
//   {can.canProcessPayouts && <button>Force Payout</button>}

import { useAppSelector } from "@/hooks/redux";
import { getPermissions, normaliseRole, type Permissions, type AdminRole } from "@/lib/adminPermissions";

interface UsePermissionsReturn {
  role: AdminRole;
  can:  Permissions; 
}

export const usePermissions = (): UsePermissionsReturn => {
  const rawRole = useAppSelector((s) => s.auth.role);
  const role    = normaliseRole(rawRole);
  const can     = getPermissions(rawRole);
  return { role, can };
};