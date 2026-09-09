import { Fragment, type ReactNode } from 'react'

/**
 * Renders an assistant answer.
 *
 * The server already reduces model output to a tightly controlled Markdown
 * subset — paragraphs, hyphen bullets, numbered items, and bold emphasis. This
 * renderer independently produces React text nodes for that subset and nothing
 * else, so nothing arriving from the model can become markup. There is no
 * dangerouslySetInnerHTML here, and there must never be one: raw model HTML is
 * never rendered, and no link the reader could follow out of the application is
 * ever produced.
 */

const BOLD_SEGMENT = /(\*\*[^*]+\*\*)/g

/** Turn `**bold**` runs into elements. Every other character stays literal text. */
function renderInline(text: string): ReactNode {
  const parts = text.split(BOLD_SEGMENT).filter((part) => part !== '')

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}

interface Block {
  kind: 'paragraph' | 'bullets' | 'numbers'
  lines: string[]
}

/** Group consecutive lines into paragraphs and lists. */
function toBlocks(answer: string): Block[] {
  const blocks: Block[] = []
  // A blank line ends the current block, which is what keeps two paragraphs
  // from being run together into one.
  let openBlock: Block | null = null

  for (const rawLine of answer.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      openBlock = null
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line)

    const append = (kind: Block['kind'], text: string) => {
      if (openBlock?.kind === kind) {
        openBlock.lines.push(text)
        return
      }
      openBlock = { kind, lines: [text] }
      blocks.push(openBlock)
    }

    if (bullet) {
      append('bullets', bullet[1])
      continue
    }

    if (numbered) {
      append('numbers', numbered[1])
      continue
    }

    append('paragraph', line)
  }

  return blocks
}

export function AssistantAnswer({ answer }: { answer: string }) {
  const blocks = toBlocks(answer)

  return (
    <div className="space-y-2 text-sm leading-relaxed text-on-surface">
      {blocks.map((block, index) => {
        if (block.kind === 'bullets') {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line)}</li>
              ))}
            </ul>
          )
        }

        if (block.kind === 'numbers') {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {block.lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line)}</li>
              ))}
            </ol>
          )
        }

        return <p key={index}>{renderInline(block.lines.join(' '))}</p>
      })}
    </div>
  )
}
