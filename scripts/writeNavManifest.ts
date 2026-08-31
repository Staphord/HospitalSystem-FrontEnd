/**
 * Regenerate the committed nav-manifest.json.
 *
 *   npm run nav:manifest
 *
 * Run this whenever HOSPITAL_NAV or MASTER_NAV changes, and commit the result -
 * report-service's assistant tests read it to check that every screen the AI
 * names is one the asking role can actually see.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { serializeNavManifest } from '../src/lib/navManifest'

const here = dirname(fileURLToPath(import.meta.url))
const target = resolve(here, '..', 'nav-manifest.json')

writeFileSync(target, serializeNavManifest())
console.log(`wrote ${target}`)
