import { render, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { DocumentTitleProvider } from '../DocumentTitleProvider'
import { useAuthStore } from '@/store/authStore'

describe('DocumentTitleProvider (Title & Favicon)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      roles: [],
      tenantId: null,
      isImpersonating: false,
      isReadOnly: false,
    })
    document.title = ''
    document.head.innerHTML = '<link rel="icon" href="/favicon.png" />'
  })

  const getFaviconHref = () => {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
    return link ? link.getAttribute('href') : null
  }

  it('sets title and default favicon when unauthenticated / loading', () => {
    render(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('Hospital Management System')
    expect(getFaviconHref()).toBe('/favicon.png')
  })

  it('sets hospital title and custom favicon for authenticated hospital user with logo', () => {
    useAuthStore.setState({
      user: {
        keycloak_sub: 'sub-1',
        username: 'user1',
        email: 'user1@example.com',
        hospital_name: 'Gilgal Medical Center',
        logo_url: 'https://example.com/gilgal-logo.png',
      },
      roles: ['hospital_admin'],
      isImpersonating: false,
    })

    render(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('Gilgal Medical Center | Hospital Management System')
    expect(getFaviconHref()).toBe('https://example.com/gilgal-logo.png')
  })

  it('falls back to default favicon if hospital user has no logo', () => {
    useAuthStore.setState({
      user: {
        keycloak_sub: 'sub-1',
        username: 'user1',
        email: 'user1@example.com',
        hospital_name: 'Gilgal Medical Center',
        logo_url: null,
      },
      roles: ['hospital_admin'],
      isImpersonating: false,
    })

    render(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('Gilgal Medical Center | Hospital Management System')
    expect(getFaviconHref()).toBe('/favicon.png')
  })

  it('sets platform title and default favicon for super admin who is not impersonating', () => {
    useAuthStore.setState({
      user: {
        keycloak_sub: 'sub-2',
        username: 'superadmin',
        email: 'admin@example.com',
        hospital_name: null,
        logo_url: 'https://example.com/ignored.png',
      },
      roles: ['super_admin'],
      isImpersonating: false,
    })

    render(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('Hospital Management Platform')
    expect(getFaviconHref()).toBe('/favicon.png')
  })

  it('sets hospital title and custom favicon for super admin impersonating a hospital', () => {
    useAuthStore.setState({
      user: {
        keycloak_sub: 'sub-2',
        username: 'superadmin',
        email: 'admin@example.com',
        hospital_name: 'St. Jude Hospital',
        logo_url: 'https://example.com/stjude-logo.png',
      },
      roles: ['super_admin', 'hospital_admin'],
      isImpersonating: true,
    })

    render(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('St. Jude Hospital | Hospital Management System')
    expect(getFaviconHref()).toBe('https://example.com/stjude-logo.png')
  })

  it('resets title and favicon after logout', () => {
    useAuthStore.setState({
      user: {
        keycloak_sub: 'sub-1',
        username: 'user1',
        email: 'user1@example.com',
        hospital_name: 'Gilgal Medical Center',
        logo_url: 'https://example.com/gilgal-logo.png',
      },
      roles: ['hospital_admin'],
      isImpersonating: false,
    })

    const { rerender } = render(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('Gilgal Medical Center | Hospital Management System')
    expect(getFaviconHref()).toBe('https://example.com/gilgal-logo.png')

    // Simulate logout
    act(() => {
      useAuthStore.setState({
        user: null,
        roles: [],
        isImpersonating: false,
      })
    })

    rerender(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('Hospital Management System')
    expect(getFaviconHref()).toBe('/favicon.png')
  })

  it('trims whitespace and falls back if hospital_name or logo_url is empty/spaces', () => {
    useAuthStore.setState({
      user: {
        keycloak_sub: 'sub-1',
        username: 'user1',
        email: 'user1@example.com',
        hospital_name: '   ',
        logo_url: '   ',
      },
      roles: ['hospital_admin'],
      isImpersonating: false,
    })

    render(
      <DocumentTitleProvider>
        <div>Test App</div>
      </DocumentTitleProvider>,
    )
    expect(document.title).toBe('Hospital Management System')
    expect(getFaviconHref()).toBe('/favicon.png')
  })
})
