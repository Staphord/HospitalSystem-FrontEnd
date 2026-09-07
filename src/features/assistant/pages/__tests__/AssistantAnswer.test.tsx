import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AssistantAnswer } from '@/features/assistant/components/AssistantAnswer'

describe('AssistantAnswer', () => {
  it('renders paragraphs', () => {
    render(<AssistantAnswer answer={'First paragraph.\n\nSecond paragraph.'} />)

    expect(screen.getByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
  })

  it('renders hyphen bullets as a list', () => {
    const { container } = render(<AssistantAnswer answer={'- open Reception\n- select Register'} />)

    const items = container.querySelectorAll('ul li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('open Reception')
  })

  it('renders numbered items as an ordered list', () => {
    const { container } = render(<AssistantAnswer answer={'1. first step\n2. second step'} />)

    expect(container.querySelectorAll('ol li')).toHaveLength(2)
  })

  it('renders bold emphasis as an element, not as literal asterisks', () => {
    const { container } = render(<AssistantAnswer answer={'Go to **Reception** now.'} />)

    expect(container.querySelector('strong')?.textContent).toBe('Reception')
    expect(container.textContent).not.toContain('**')
  })

  it('never renders model output as HTML', () => {
    const hostile = '<img src=x onerror="alert(1)"> <script>alert(2)</script> plain words'

    const { container } = render(<AssistantAnswer answer={hostile} />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    // The markup arrives as inert text, which is the point: it is shown, not run.
    expect(container.textContent).toContain('plain words')
  })

  it('does not turn a link shape into an anchor the user could follow', () => {
    const { container } = render(
      <AssistantAnswer answer={'See [the policy](https://evil.example.com/steal) for detail.'} />,
    )

    expect(container.querySelector('a')).toBeNull()
  })

  it('renders nothing for an empty answer without throwing', () => {
    const { container } = render(<AssistantAnswer answer="" />)

    expect(container.querySelectorAll('p, ul, ol')).toHaveLength(0)
  })
})
