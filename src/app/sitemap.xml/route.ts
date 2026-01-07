import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = process.env.SITE_URL || 'https://example.com'

const staticRoutes = [
  '',
  'about',
  'contact',
  'programs',
  'results',
  'signup',
  'login',
  'trial-lesson',
  'enrol',
  'reset-password-required',
]

function xmlEscape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildXml(entries: { loc: string; lastmod?: string }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => {
      const lastmod = e.lastmod ? `\n    <lastmod>${xmlEscape(e.lastmod)}</lastmod>` : ''
      return `  <url>\n    <loc>${xmlEscape(e.loc)}</loc>${lastmod}\n  </url>`
    })
    .join('\n')}\n</urlset>`
}

export async function GET(_request: NextRequest) {
  const admin = createAdminClient()

  // Fetch courses and classes from Supabase (if available)
  const [{ data: courses }, { data: classes }] = await Promise.all([
    admin.from('courses').select('id,name,updated_at'),
    admin.from('classes').select('id,course_id,updated_at'),
  ])

  const entries: { loc: string; lastmod?: string }[] = []

  // add static routes
  for (const route of staticRoutes) {
    const path = route ? `/${route}` : ''
    entries.push({ loc: `${SITE_URL}${path}` })
  }

  // append course-specific enrol/trial links with lastmod if available
  if (Array.isArray(courses)) {
    for (const c of courses) {
      if (!c || !c.id) continue
      const lastmod = c.updated_at ? new Date(c.updated_at).toISOString() : undefined
      entries.push({ loc: `${SITE_URL}/enrol?courseId=${encodeURIComponent(c.id)}`, lastmod })
      entries.push({ loc: `${SITE_URL}/trial-lesson?courseId=${encodeURIComponent(c.id)}`, lastmod })
    }
  }

  // append class-specific enrol/trial links with lastmod if available
  if (Array.isArray(classes)) {
    for (const cls of classes) {
      if (!cls || !cls.id) continue
      const lastmod = cls.updated_at ? new Date(cls.updated_at).toISOString() : undefined
      entries.push({ loc: `${SITE_URL}/enrol?classId=${encodeURIComponent(cls.id)}`, lastmod })
      entries.push({ loc: `${SITE_URL}/trial-lesson?classId=${encodeURIComponent(cls.id)}`, lastmod })
    }
  }

  const sitemap = buildXml(entries)

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
