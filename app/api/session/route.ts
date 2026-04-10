import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ArchitectureDelta, ChatMessage } from '@/lib/types'

function generateSlug(productDescription: string): string {
  const base = productDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      messages,
      architecture,
      productDescription,
    }: {
      messages: ChatMessage[]
      architecture: ArchitectureDelta
      productDescription: string
    } = body

    if (!messages || !architecture || !productDescription) {
      return NextResponse.json(
        { error: 'messages, architecture, and productDescription required' },
        { status: 400 }
      )
    }

    const slug = generateSlug(productDescription)

    const { data, error } = await supabase
      .from('arc_sessions')
      .insert({
        slug,
        messages,
        architecture,
        product_description: productDescription,
        completed_at: new Date().toISOString(),
        source: 'web',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      slug: data.slug,
      shareUrl: `/session/${data.slug}`,
      sessionId: data.id,
    })
  } catch (error) {
    console.error('Session save error:', error)
    return NextResponse.json(
      { error: 'Session save failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('arc_sessions')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'Session fetch failed' },
      { status: 500 }
    )
  }
}
