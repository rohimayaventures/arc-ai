/**
 * Coerces model/API output to a safe chat string. In React, `{0}` renders as
 * the character "0", so numeric or malformed `message` values must not reach UI children.
 */
export function normalizeOriMessage(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value == null || typeof value === 'number') return ''
  return String(value).trim()
}

export const ORI_EMPTY_MESSAGE_FALLBACK =
  "I'm having trouble with that reply. What would you like to build or automate with conversations?"
