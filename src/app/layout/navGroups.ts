import {
  HOSPITAL_NAV,
  MASTER_NAV,
  ROLES,
  hasAnyEffectiveRole,
  hasEffectiveRole,
  type NavItem,
} from '@/lib/roles'

export interface NavGroup {
  title: string
  items: NavItem[]
}

/**
 * Title of the fallback group. Anything a role is permitted to see but that no
 * explicit group claims lands here, so a new HOSPITAL_NAV entry can never be
 * invisible in the UI. navContract.test.ts asserts this group is always empty:
 * production self-heals, CI still tells you to file the item properly.
 */
export const UNGROUPED_TITLE = 'More'

/** Modules a subscription can switch off. A path under one is hidden when it is. */
const MODULE_PATHS: Record<string, string> = {
  pharmacy: '/pharmacy',
  laboratory: '/laboratory',
  radiology: '/radiology',
}

export interface GroupNavParams {
  /** Effective, normalized role slugs for the signed-in user. */
  roles: string[]
  /** Modules included in the tenant's current plan. */
  enabledModules: string[]
}

function pick(items: NavItem[], paths: string[]): NavItem[] {
  return paths
    .map((path) => items.find((item) => item.path === path))
    .filter((item): item is NavItem => Boolean(item))
}

function pickUnder(items: NavItem[], prefixes: string[]): NavItem[] {
  return items.filter((item) => prefixes.some((prefix) => item.path.startsWith(prefix)))
}

/**
 * Filter HOSPITAL_NAV / MASTER_NAV down to what this user may see.
 *
 * Role membership is the only access decision here; the router enforces it again
 * with RoleRoute. Module gating is a subscription concern, not an access one.
 */
export function visibleNavItems({ roles, enabledModules }: GroupNavParams): NavItem[] {
  const navItems = hasEffectiveRole(roles, null, ROLES.superAdmin) ? MASTER_NAV : HOSPITAL_NAV

  return navItems.filter((item) => {
    if (!hasAnyEffectiveRole(roles, null, item.roles)) return false

    for (const [module, prefix] of Object.entries(MODULE_PATHS)) {
      if (item.path.startsWith(prefix) && !enabledModules.includes(module)) return false
    }

    return true
  })
}

/**
 * Arrange the permitted nav items into sidebar sections.
 *
 * Pure and exported so the nav contract can be tested without rendering the
 * sidebar. Every permitted item is returned exactly once: explicit groups claim
 * what they name, and whatever is left over falls into UNGROUPED_TITLE rather
 * than being dropped.
 */
export function groupNavItems(params: GroupNavParams): NavGroup[] {
  const items = visibleNavItems(params)
  const { roles } = params
  const hasRole = (role: string) => hasEffectiveRole(roles, null, role)

  let groups: NavGroup[]

  if (hasRole(ROLES.superAdmin)) {
    groups = [
      { title: 'Overview', items: pick(items, ['/master/dashboard']) },
      {
        title: 'Tenant Management',
        items: pick(items, [
          '/master/tenants',
          '/master/subscriptions',
          '/master/invoices',
          '/master/payments',
        ]),
      },
      {
        title: 'Platform Operations',
        items: pick(items, [
          '/master/admins',
          '/master/health',
          '/master/announcements',
          '/master/audit-logs',
        ]),
      },
    ]
  } else if (hasRole(ROLES.hospitalAdmin)) {
    groups = [
      { title: 'Overview', items: pick(items, ['/admin/dashboard']) },
      { title: 'Staff Management', items: pick(items, ['/admin/staff', '/admin/sessions']) },
      {
        title: 'Hospital Configuration',
        items: pick(items, [
          '/admin/departments',
          '/admin/fees',
          '/admin/insurance',
          '/admin/settings',
          '/admin/roles',
          '/admin/permissions',
        ]),
      },
      {
        title: 'Reports & Analytics',
        items: pick(items, [
          '/admin/reports',
          '/admin/reports/patients',
          '/admin/reports/revenue',
          '/admin/reports/operations',
        ]),
      },
      // The hospital admin is permitted into every department's screens by both
      // HOSPITAL_NAV and the router's RoleRoute lists, and the assistant's content
      // pack names these screens to them. They belong in the menu.
      { title: 'Reception', items: pickUnder(items, ['/reception']) },
      { title: 'Triage', items: pickUnder(items, ['/triage']) },
      { title: 'Consultation', items: pickUnder(items, ['/consultation']) },
      { title: 'Ward', items: pickUnder(items, ['/ward']) },
      {
        title: 'Ancillary Services',
        items: pickUnder(items, ['/laboratory', '/radiology', '/pharmacy']),
      },
      { title: 'Billing', items: pickUnder(items, ['/billing']) },
      {
        title: 'System',
        items: pick(items, [
          '/admin/audit-logs',
          '/admin/backup',
          '/admin/subscription',
          '/notifications',
        ]),
      },
    ]
  } else if (hasRole(ROLES.receptionist)) {
    groups = [
      { title: 'Overview', items: pick(items, ['/dashboard']) },
      { title: 'Patients', items: pick(items, ['/reception/register', '/reception/search']) },
      { title: 'Queue', items: pick(items, ['/reception/queue']) },
      { title: 'Billing', items: pickUnder(items, ['/billing']) },
      { title: 'Alerts', items: pick(items, ['/notifications']) },
    ]
  } else if (hasRole(ROLES.triageNurse)) {
    groups = [
      { title: 'Overview', items: pick(items, ['/dashboard']) },
      { title: 'Triage', items: pick(items, ['/triage/queue']) },
      { title: 'Patients', items: pick(items, ['/triage/history']) },
      { title: 'Ward', items: pickUnder(items, ['/ward']) },
      { title: 'Alerts', items: pick(items, ['/notifications']) },
    ]
  } else if (hasRole(ROLES.labTechnician)) {
    groups = [
      { title: 'Overview', items: pick(items, ['/dashboard']) },
      { title: 'Laboratory', items: pick(items, ['/laboratory/requests', '/laboratory/results']) },
      { title: 'Specimens', items: pick(items, ['/laboratory/specimens']) },
      { title: 'Alerts', items: pick(items, ['/notifications']) },
    ]
  } else if (hasRole(ROLES.cashier)) {
    groups = [
      { title: 'Overview', items: pick(items, ['/dashboard', '/billing/dashboard']) },
      { title: 'Billing & Payments', items: pick(items, ['/billing/bills', '/billing/summary']) },
      { title: 'Alerts', items: pick(items, ['/notifications']) },
    ]
  } else if (hasRole(ROLES.pharmacist)) {
    groups = [
      { title: 'Overview', items: pick(items, ['/dashboard']) },
      { title: 'Pharmacy', items: pick(items, ['/pharmacy/queue']) },
      { title: 'Inventory', items: pick(items, ['/pharmacy/stock']) },
      { title: 'Alerts', items: pick(items, ['/notifications']) },
    ]
  } else {
    groups = [
      { title: 'Overview', items: pick(items, ['/dashboard', '/notifications']) },
      {
        title: 'Clinical Workflow',
        items: pickUnder(items, ['/reception', '/triage', '/consultation', '/ward']),
      },
      {
        title: 'Ancillary Services',
        items: pickUnder(items, ['/laboratory', '/radiology', '/pharmacy']),
      },
      { title: 'Admin & Billing', items: pickUnder(items, ['/admin/', '/billing']) },
    ]
  }

  const claimed = new Set(groups.flatMap((group) => group.items.map((item) => item.path)))
  groups.push({
    title: UNGROUPED_TITLE,
    items: items.filter((item) => !claimed.has(item.path)),
  })

  return groups
}
