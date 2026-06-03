import React from 'react'

interface MarkdownRendererProps {
  text: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  // Splits text by bold (`**`) or inline code (`` ` ``) patterns
  const parseInlineStyles = (lineText: string): React.ReactNode[] => {
    const parts = lineText.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i}>{part.slice(1, -1)}</code>
      }
      return part
    })
  }

  // Split text by multi-line code blocks
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <div className="rendered-content">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/)
          const code = match ? match[2] : part.slice(3, -3)
          return (
            <pre key={index}>
              <code className="code-block">{code.trim()}</code>
            </pre>
          )
        } else {
          const lines = part.split('\n')
          return lines.map((line, lineIdx) => {
            if (line.trim() === '') {
              return <div key={`${index}-${lineIdx}`} style={{ height: '8px' }} />
            }

            // Bullet points matching '* ' or '- '
            const listMatch = line.match(/^[\s]*[*+-]\s+(.*)$/)
            if (listMatch) {
              return (
                <ul key={`${index}-${lineIdx}`} className="markdown-list">
                  <li>{parseInlineStyles(listMatch[1])}</li>
                </ul>
              )
            }

            return <p key={`${index}-${lineIdx}`}>{parseInlineStyles(line)}</p>
          })
        }
      })}
    </div>
  )
}
