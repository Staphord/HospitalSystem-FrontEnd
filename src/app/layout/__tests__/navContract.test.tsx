import { describe, expect, it } from 'vitest'
import { isValidElement, type ReactElement } from 'react'
import { routes } from '@/app/router/routes'
import { RoleRoute } from '@/app/router/RoleRoute'
import { HOSPITAL_NAV, MASTER_NAV, ROLES, normalizeRole, type NavItem } from '@/lib/roles'
import { UNGROUPED_TITLE, groupNavItems, visibleNavItems } from '@/app/layout/navGroups'

/**
 * The navigation contract.
 *
 * Three layers have to agree about what a role can reach, and they are edited by
 * different people at different times:
 *
 *   1. `routes.tsx`   - the router's `RoleRoute` gates. The real access decision.
 *   2. `HOSPITAL_NAV` - the declared menu, in `lib/roles.ts`.
 *   3. `navGroups.ts` - how the sidebar arranges the menu into sections.
 *
 * There is also a fourth, in another repo: the assistant's content pack, whose
 * entries name screens to staff. It is pinned to the same source of truth by
 * `nav-manifest.json` (see `scripts/generateNavManifest.ts`) and asserted in
 * report-service's `test_assistant_content_locations.py`.
 *
 * When these drift, a user is told to open a page their menu does not show. These
 * tests are what stop that happening again.
 */

const ALL_MODULES = ['reception', 'triage', 'consultation', 'billing', 'ward', 'pharmacy', 'laboratory', 'radiology']

const HOSPITAL_ROLES = Object.values(ROLES).filter((role) => role !== ROLES.superAdmin)

interface RouteNode {
  path?: string
  element?: unknown
  children?: RouteNode[]
}

/**
 * Walk the router tree and record, for each concrete path, the set of roles the
 * `RoleRoute` gates above it permit. `null` means no gate: any signed-in user.
 */
function collectRoutePermissions(
  nodes: RouteNode[],
  inherited: Set<string> | null,
  acc = new Map<string, Set<string> | null>(),
): Map<string, Set<string> | null> {
  for (const node of nodes) {
    let allowed = inherited

    if (isValidElement(node.element) && (node.element as ReactElement).type === RoleRoute) {
      const declared = ((node.element as ReactElement).props as { allowed: string[] }).allowed.map(normalizeRole)
      // Nested gates compose by intersection: both must let you through.
      allowed = inherited === null ? new Set(declared) : new Set(declared.filter((r) => inherited.has(r)))
    }

    if (node.path) acc.set(node.path, allowed)
    if (node.children) collectRoutePermissions(node.children, allowed, acc)
  }

  return acc
}

const routePermissions = collectRoutePermissions(routes as RouteNode[], null)

describe('nav declaration matches the router', () => {
  const allNav: NavItem[] = [...HOSPITAL_NAV, ...MASTER_NAV]

  it.each(allNav.map((item) => [item.path, item] as const))(
    '%s resolves to a real route',
    (path) => {
      expect(routePermissions.has(path)).toBe(true)
    },
  )

  it.each(allNav.map((item) => [item.path, item] as const))(
    '%s is not offered to a role the router rejects',
    (path, item) => {
      const allowed = routePermissions.get(path)
      if (allowed === null || allowed === undefined) return // ungated route

      const rejected = item.roles.map(normalizeRole).filter((role) => !allowed.has(role))
      expect(
        rejected,
        `HOSPITAL_NAV offers ${path} to ${rejected.join(', ')}, but RoleRoute sends them to /unauthorized`,
      ).toEqual([])
    },
  )
})

describe('the sidebar renders every permitted nav item', () => {
  it.each(HOSPITAL_ROLES.map((role) => [role]))(
    '%s: no permitted item is dropped from the menu',
    (role) => {
      const groups = groupNavItems({ roles: [role], enabledModules: ALL_MODULES })
      const ungrouped = groups.find((group) => group.title === UNGROUPED_TITLE)

      expect(
        ungrouped?.items.map((item) => `${item.label} (${item.path})`),
        `these are permitted for ${role} but no sidebar group claims them - add them to a group in navGroups.ts`,
      ).toEqual([])
    },
  )

  it.each(HOSPITAL_ROLES.map((role) => [role]))(
    '%s: every permitted item appears exactly once',
    (role) => {
      const params = { roles: [role], enabledModules: ALL_MODULES }
      const rendered = groupNavItems(params).flatMap((group) => group.items.map((item) => item.path))
      const permitted = visibleNavItems(params).map((item) => item.path)

      expect([...rendered].sort()).toEqual([...permitted].sort())
    },
  )

  it('super admin sees the whole platform menu', () => {
    const groups = groupNavItems({ roles: [ROLES.superAdmin], enabledModules: ALL_MODULES })
    const rendered = groups.flatMap((group) => group.items.map((item) => item.path))

    expect(groups.find((g) => g.title === UNGROUPED_TITLE)?.items).toEqual([])
    expect([...rendered].sort()).toEqual(MASTER_NAV.map((item) => item.path).sort())
  })
})

describe('no page is reachable but unlinked', () => {
  /**
   * Paths that intentionally have no menu entry. Everything else that the router
   * serves must be reachable from the sidebar, so a new page cannot be shipped
   * with no way to get to it. Add a path here only with a reason.
   */
  const INTENTIONALLY_UNLINKED = new Set([
    '/', // redirect to /login
    '/profile', // reached from the topbar avatar
    '/master/profile', // reached from the topbar avatar
    '/unauthorized', // shown by RoleRoute, never navigated to
    '/notifications', // also reached from the topbar bell
    '/billing', // redirect to /billing/dashboard
    '/pharmacy/dispense', // redirect to /pharmacy/queue
    '/master/incidents', // opened from System Health
    '/master/invoices/overdue', // opened from Invoices
    '/master/tenants/new', // opened from Tenants
    '/admin/staff/new', // opened from All Staff
    '/ward/visitors/active', // opened from Visitor Log
    '/impersonation/switching', // transient
  ])

  const AUTH_PATHS =
    /^\/(master\/)?(login|signup|forgot-password|reset-password|account-locked|mfa-|first-login|deactivated)/

  it('every gated, linkable route has a nav entry', () => {
    const navPaths = new Set([...HOSPITAL_NAV, ...MASTER_NAV].map((item) => item.path))

    const orphans = [...routePermissions.keys()].filter((path) => {
      if (path.includes(':') || path === '*') return false // detail pages
      if (AUTH_PATHS.test(path)) return false // pre-login
      if (INTENTIONALLY_UNLINKED.has(path)) return false
      return !navPaths.has(path)
    })

    expect(
      orphans,
      'these routes render a page but nothing links to them - add a HOSPITAL_NAV entry or list them in INTENTIONALLY_UNLINKED',
    ).toEqual([])
  })
})
