import Link from 'next/link'

import { BulletList } from '@/components/bullet-list'
import { ContentSlide } from '@/components/content-slide'
import { Deck } from '@/components/deck'
import { SectionDivider } from '@/components/section-divider'
import { StatSlide } from '@/components/stat-slide'
import { TitleSlide } from '@/components/title-slide'
import { Keyword } from '@/components/typography'
import { Wordmark } from '@/components/wordmark'

const palette = [
  { name: 'Red', hex: '#D82128', swatch: 'bg-dh-red', note: 'Pantone 1795 C — the only accent' },
  { name: 'White', hex: '#FFFFFF', swatch: 'bg-dh-white border border-dh-ink/15', note: 'Dominant surface' },
  { name: 'Ink', hex: '#1A1A1A', swatch: 'bg-dh-ink', note: 'Body text' },
  { name: 'Band', hex: '#F5F5F5', swatch: 'bg-dh-band border border-dh-ink/15', note: 'Section bands' },
  { name: 'Muted', hex: '#8C8C8C', swatch: 'bg-dh-muted', note: 'Captions / footnotes' },
]

const typeScale = [
  { label: 'Title', cls: 'font-[900] text-[2.75rem] leading-[1.03] tracking-[-0.02em]', sample: 'Delivery, redefined', note: '44pt · Black' },
  { label: 'Section', cls: 'font-[800] text-[2rem] leading-tight tracking-[-0.015em]', sample: 'How the network scales', note: '32pt · Heavy' },
  { label: 'Body', cls: 'font-[300] text-[1.125rem] leading-relaxed', sample: 'One red doing all the accent work, on a white surface.', note: '18pt · Light' },
  { label: 'Caption', cls: 'font-normal text-xs text-dh-muted', sample: 'Source: internal figures, 2026', note: '12pt · Regular' },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-dh-white text-dh-ink">
      {/* Header */}
      <header className="border-b border-dh-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Wordmark tone="red" className="text-2xl" />
          <div className="flex items-center gap-6">
            <span className="hidden text-xs font-[700] uppercase tracking-[0.16em] text-dh-muted sm:inline">
              Design System
            </span>
            <Link
              href="/app"
              className="text-xs font-[700] uppercase tracking-[0.1em] text-dh-red underline underline-offset-4"
            >
              App demo
            </Link>
          </div>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <span aria-hidden className="mb-6 block h-1 w-16 bg-dh-red" />
        <h1 className="max-w-[20ch] text-4xl font-[900] leading-[1.03] tracking-[-0.02em] sm:text-6xl">
          One red. White. Black.
          <br />
          <Keyword>One typeface.</Keyword>
        </h1>
        <p className="mt-6 max-w-[60ch] text-lg font-[300] leading-relaxed text-dh-ink">
          A deliberately spare design system for <Keyword>slides and apps</Keyword>. The
          discipline is the design: a single red does all the accent work, on flat white
          surfaces, in one typeface — the restraint is what reads as Delivery Hero. See the{' '}
          <Link href="/app" className="font-[700] text-dh-red underline underline-offset-4">
            app demo
          </Link>{' '}
          for the same rules applied to a product screen.
        </p>
      </section>

      {/* Palette */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <SectionLabel>Palette</SectionLabel>
        <div className="grid grid-cols-2 gap-px bg-dh-ink/10 sm:grid-cols-3 lg:grid-cols-5">
          {palette.map((c) => (
            <div key={c.name} className="bg-dh-white">
              <div className={`aspect-[4/3] w-full ${c.swatch}`} />
              <div className="p-4">
                <p className="text-sm font-[700]">{c.name}</p>
                <p className="mt-0.5 font-mono text-xs text-dh-muted">{c.hex}</p>
                <p className="mt-2 text-xs font-[300] text-dh-ink">{c.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Type scale */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <SectionLabel>Type — Fira Sans</SectionLabel>
        <div className="divide-y divide-dh-ink/10 border-y border-dh-ink/10">
          {typeScale.map((t) => (
            <div key={t.label} className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[8rem_1fr_10rem] sm:items-baseline">
              <span className="text-xs font-[700] uppercase tracking-[0.14em] text-dh-red">
                {t.label}
              </span>
              <span className={t.cls}>{t.sample}</span>
              <span className="text-xs font-[300] text-dh-muted sm:text-right">{t.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Slides */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-4">
        <SectionLabel>Slide patterns</SectionLabel>
      </section>
      <Deck>
        <TitleSlide
          title="Delivery, redefined at global scale"
          subtitle="A quarterly review of the world's local delivery platform."
        />

        <SectionDivider number="01" label="The shape of the network" />

        <ContentSlide
          eyebrow="Market position"
          heading="Red only where it counts"
        >
          <BulletList
            items={[
              <>
                Operating across <Keyword>70+ countries</Keyword> on a single brand system.
              </>,
              'Left-aligned copy, generous margins, and flat colour throughout.',
              'No shadows, no rounded card stacks, no icon zoo — the restraint is the point.',
            ]}
          />
        </ContentSlide>

        <StatSlide
          eyebrow="Orders per second, peak"
          value="3,600"
          caption="Processed at peak across the platform — one number, doing all the talking."
        />

        <ContentSlide band eyebrow="Section band" heading="A quieter surface when you need one">
          <BulletList
            items={[
              'The grey band is the only alternative to white — still no second accent.',
              <>
                Reserve red for the <Keyword>one</Keyword> word or figure that matters.
              </>,
            ]}
          />
        </ContentSlide>
      </Deck>

      <footer className="mx-auto mt-16 max-w-6xl border-t border-dh-ink/10 px-6 py-10">
        <Wordmark tone="red" className="text-lg" />
        <p className="mt-2 text-xs font-[300] text-dh-muted">
          Delivery Hero Slide System — substitute face Fira Sans in place of the licensed Corpid.
        </p>
      </footer>
    </main>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span aria-hidden className="h-3 w-3 bg-dh-red" />
      <h2 className="text-sm font-[700] uppercase tracking-[0.16em] text-dh-ink">{children}</h2>
    </div>
  )
}
