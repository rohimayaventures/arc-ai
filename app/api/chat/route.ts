import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { ORI_SYSTEM_PROMPT } from '@/lib/oriSystemPrompt'
import { ChatMessage, OriTurn } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: ORI_SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed: OriTurn
    try {
      parsed = JSON.parse(rawText) as OriTurn
    } catch {
      return NextResponse.json(
        { error: 'Ori returned malformed JSON', raw: rawText },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Ori API error:', error)
    return NextResponse.json(
      { error: 'Ori is unavailable' },
      { status: 500 }
    )
  }
}
