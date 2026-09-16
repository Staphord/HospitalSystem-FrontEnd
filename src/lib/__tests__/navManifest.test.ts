import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { serializeNavManifest } from '@/lib/navManifest'

describe('nav-manifest.json', () => {
  it('is up to date with HOSPITAL_NAV', () => {
    const committed = readFileSync(resolve(process.cwd(), 'nav-manifest.json'), 'utf8')

    expect(
      committed,
      'nav-manifest.json is stale - run `npm run nav:manifest` and commit it, ' +
        'or report-service will keep validating the assistant against the old menu',
    ).toEqual(serializeNavManifest())
  })
})
