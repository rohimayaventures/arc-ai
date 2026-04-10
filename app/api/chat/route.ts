import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import {
  normalizeOriMessage,
  ORI_EMPTY_MESSAGE_FALLBACK,
} from '@/lib/oriMessage'
import { ORI_SYSTEM_PROMPT } from '@/lib/oriSystemPrompt'
import { ArchitectureDelta, ChatMessage, OriTurn } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function firstTextBlock(content: Anthropic.Messages.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === 'text') return block.text
  }
  return ''
}

function stripJsonFence(raw: string): string {
  const t = raw.trim()
  const m = t.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i)
  return m ? m[1].trim() : t
}

function coerceOriTurn(parsed: unknown): OriTurn {
  const p = parsed as Record<string, unknown>
  const message =
    normalizeOriMessage(p.message) || ORI_EMPTY_MESSAGE_FALLBACK

  const delta = (p.architectureDelta ?? {}) as ArchitectureDelta
  const turnNumber =
    typeof p.turnNumber === 'number' && Number.isFinite(p.turnNumber)
      ? p.turnNumber
      : 1
  const progressPercent =
    typeof p.progressPercent === 'number' && Number.isFinite(p.progressPercent)
      ? Math.min(100, Math.max(0, p.progressPercent))
      : 0

  return {
    message,
    architectureDelta: delta,
    turnNumber,
    architectureComplete: Boolean(p.architectureComplete),
    progressPercent,
  }
}

const SESSION_START_USER: ChatMessage = {
  role: 'user',
  content:
    'The user just opened a new architecture session. There is no prior conversation. Respond with your JSON only: follow turn 1 in your question sequence — briefly greet in character, then ask what kind of product they are building.',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages: ChatMessage[] = body.messages

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array required' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json(
        { error: 'Server missing ANTHROPIC_API_KEY' },
        { status: 503 }
      )
    }

    // Anthropic requires at least one message; Meet Ori starts with an empty array.
    const forModel =
      messages.length === 0 ? [SESSION_START_USER] : messages

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: ORI_SYSTEM_PROMPT,
      messages: forModel.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const rawText = firstTextBlock(response.content)
    const jsonPayload = stripJsonFence(rawText)

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonPayload)
    } catch {
      return NextResponse.json(
        { error: 'Ori returned malformed JSON', raw: rawText },
        { status: 500 }
      )
    }

    const turn = coerceOriTurn(parsed)
    return NextResponse.json(turn)
  } catch (error) {
    console.error('Ori API error:', error)
    return NextResponse.json(
      { error: 'Ori is unavailable' },
      { status: 500 }
    )
  }
}
