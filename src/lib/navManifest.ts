import { ROLES } from '@/lib/roles'
import { groupNavItems } from '@/app/layout/navGroups'

/**
 * Every module a plan can include. The manifest describes the fullest menu a role
 * can have; a tenant on a reduced plan sees a subset, never a superset.
 */
const ALL_MODULES = [
  'reception',
  'triage',
  'consultation',
  'billing',
  'ward',
  'pharmacy',
  'laboratory',
  'radiology',
]

/**
 * The navigation, in a form another repo can read.
 *
 * report-service's assistant content pack names screens to staff ("Reports, then
 * Patient reports (/admin/reports/patients)"). Nothing in Python can see
 * `HOSPITAL_NAV`, so without a shared artefact the two drift silently and the
 * assistant ends up sending people to a page their menu does not show.
 *
 * `nav-manifest.json` is generated from this and committed:
 *
 *   - `npm run nav:manifest` regenerates it,
 *   - `navManifest.test.ts` fails if the committed copy is stale,
 *   - report-service's `test_assistant_content_locations.py` fails if the content
 *     pack names a screen that is missing from it, or names one to a role whose
 *     sidebar does not show it.
 */
export interface NavManifest {
  /** Bump when the shape changes, so a stale consumer fails loudly. */
  schema: number
  generatedFrom: string
  /** Menu path -> the label shown in the sidebar and the roles that see it. */
  screens: Record<string, { label: string; roles: string[] }>
}

/**
 * Built from what the sidebar actually renders, not from what HOSPITAL_NAV
 * declares. Those two disagreed once - HOSPITAL_NAV granted the hospital admin the
 * clinical screens while the sidebar quietly dropped them - and the assistant went
 * on naming screens that were not in anyone's menu. Deriving the manifest from
 * `groupNavItems` means a dropped item disappears here too, and report-service's
 * content tests fail.
 */
export function buildNavManifest(): NavManifest {
  const screens: NavManifest['screens'] = {}

  for (const role of Object.values(ROLES)) {
    const groups = groupNavItems({ roles: [role], enabledModules: ALL_MODULES })

    for (const item of groups.flatMap((group) => group.items)) {
      const existing = screens[item.path]
      screens[item.path] = {
        label: existing?.label ?? item.label,
        roles: [...new Set([...(existing?.roles ?? []), role])].sort(),
      }
    }
  }

  return {
    schema: 1,
    generatedFrom: 'frontend-hospital/src/app/layout/navGroups.ts (rendered sidebar)',
    screens: Object.fromEntries(Object.entries(screens).sort(([a], [b]) => a.localeCompare(b))),
  }
}

export function serializeNavManifest(): string {
  return `${JSON.stringify(buildNavManifest(), null, 2)}\n`
}
