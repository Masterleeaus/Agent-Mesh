'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Image from 'next/image'

/* ─── Types ───────────────────────────────────────────── */
type FormData = { firstName: string; lastName: string; email: string; trade: string; teamSize: string }

const trades = ['Plumber', 'HVAC Tech', 'Electrician', 'General Contractor', 'Roofer', 'Painter', 'Landscaper', 'Other']
const teamSizes = ['Just me', '2-5 people', '6-15 people', '15+ people']

/* ─── Countdown ───────────────────────────────────────── */
function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }
  const [t, setT] = useState(calc())
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

/* ─── VoiceLog Phone Mockup (dark) ───────────────────── */
function PhoneVoiceLog() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0C0C0C' }}>
      <div className="flex justify-between px-4 pt-3 pb-2 text-[9px] font-semibold" style={{ color: '#FFFFFF' }}>
        <span>9:41 AM</span>
        <span style={{ color: '#AAAAAA', fontSize: '8px' }}>●●● WiFi</span>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3" style={{ borderBottom: '1px solid #2A2A2A' }}>
        <span className="font-bold text-[12px]" style={{ color: '#E8352A' }}>VoiceLogTM</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full block" style={{ background: '#E8352A' }} />
          <span className="text-[8px] font-bold" style={{ color: '#E8352A' }}>LIVE</span>
        </div>
      </div>
      <div className="px-4 pt-3">
        <div className="text-[8px] font-semibold uppercase tracking-widest" style={{ color: '#AAAAAA' }}>Job #284 - In Progress</div>
      </div>
      <div className="mx-4 mt-2 rounded p-3" style={{ background: '#181818', border: '1px solid #2A2A2A', borderRadius: '4px' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full block" style={{ background: '#E8352A' }} />
          <span className="text-[8px] font-bold" style={{ color: '#E8352A' }}>Recording...</span>
          <span className="ml-auto font-mono text-[8px]" style={{ color: '#AAAAAA' }}>0:47</span>
        </div>
        <div className="flex items-center gap-[2px] h-6 mb-2">
          {[2,5,8,4,7,10,6,3,9,5,8,2,6,10,4,7,3,5,8,6].map((h, i) => (
            <div key={i} className="rounded-full" style={{ width: '2.5px', height: `${h}px`, background: '#E8352A', opacity: 0.6 + (i % 3) * 0.13 }} />
          ))}
        </div>
        <div className="text-[8px] leading-[14px]" style={{ color: '#AAAAAA' }}>
          &quot;Replaced 40-gal Bradford White unit in basement. Added expansion tank. Customer approved PRO model upgrade on-site...&quot;
        </div>
      </div>
      <div className="flex-1" />
      <div className="px-4 pb-5">
        <div className="py-2.5 text-center text-[9px] font-bold" style={{ background: '#E8352A', color: '#FFFFFF', borderRadius: '4px' }}>
          Save + Next Job
        </div>
      </div>
    </div>
  )
}

/* ─── Dashboard Phone Mockup (dark) ─────────────────── */
function PhoneFieldIQ() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0C0C0C' }}>
      <div className="flex justify-between px-4 pt-3 pb-2 text-[9px] font-semibold" style={{ color: '#FFFFFF' }}>
        <span>9:41 AM</span>
        <span style={{ color: '#AAAAAA', fontSize: '8px' }}>●●● WiFi</span>
      </div>
      <div className="px-4 pb-3" style={{ borderBottom: '1px solid #2A2A2A' }}>
        <div className="font-bold text-[11px]" style={{ color: '#FFFFFF' }}>Good morning, Mike</div>
        <div className="text-[8px]" style={{ color: '#AAAAAA' }}>Monday · 3 jobs today</div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-4 pt-3 pb-2">
        {[
          { label: 'This Week', value: '$9,840' },
          { label: 'Jobs', value: '12' },
          { label: 'Margin', value: '71%' },
        ].map(s => (
          <div key={s.label} className="p-2 text-center" style={{ background: '#181818', borderLeft: '2px solid #E8352A', borderRadius: '4px' }}>
            <div className="text-[11px] font-black" style={{ color: '#FFFFFF' }}>{s.value}</div>
            <div className="text-[7px]" style={{ color: '#AAAAAA' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-2 p-2" style={{ background: '#181818', borderRadius: '4px' }}>
        <div className="text-[7px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#AAAAAA' }}>Revenue (7d)</div>
        <div className="flex items-end gap-1 h-8">
          {[35, 55, 40, 80, 60, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 5 ? '#E8352A' : '#2A2A2A' }} />
          ))}
        </div>
      </div>
      <div className="px-4 space-y-1.5">
        {[
          { job: 'Water heater replace', status: 'Done', color: '#22c55e' },
          { job: 'HVAC tune-up', status: 'Active', color: '#E8352A' },
          { job: 'Gas line inspect', status: 'Next', color: '#AAAAAA' },
        ].map(j => (
          <div key={j.job} className="flex items-center justify-between px-2.5 py-1.5" style={{ background: '#181818', borderRadius: '4px' }}>
            <span className="text-[8px]" style={{ color: '#FFFFFF' }}>{j.job}</span>
            <span className="text-[7px] font-bold" style={{ color: j.color }}>{j.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Dark Phone Frame ────────────────────────────────── */
function DarkPhone({ children, tilt = 0 }: { children: React.ReactNode; tilt?: number }) {
  return (
    <div style={{ width: 195, transform: `rotate(${tilt}deg)` }}>
      <div
        className="relative rounded-[44px] p-[3px]"
        style={{
          background: '#1C1C1E',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div className="rounded-[42px] p-[2px]" style={{ background: '#111111' }}>
          <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-14 h-[18px] rounded-full z-10" style={{ background: '#000000' }} />
          <div className="rounded-[40px] overflow-hidden" style={{ height: 406 }}>
            <div className="pt-8 h-full">{children}</div>
          </div>
        </div>
        <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-24 h-[4px] rounded-full" style={{ background: '#333333' }} />
      </div>
      <div className="absolute left-[-4px] top-[76px] w-[4px] h-7 rounded-l-full" style={{ background: '#2A2A2A' }} />
      <div className="absolute left-[-4px] top-[116px] w-[4px] h-10 rounded-l-full" style={{ background: '#2A2A2A' }} />
      <div className="absolute right-[-4px] top-[96px] w-[4px] h-14 rounded-r-full" style={{ background: '#2A2A2A' }} />
    </div>
  )
}



/* ─── Main Page ───────────────────────────────────────── */
export default function Home() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const countdown = useCountdown(new Date('2026-09-01T00:00:00'))
  const pad = (n: number) => String(n).padStart(2, '0')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) setSubmitted(true)
    } catch { setSubmitted(true) }
    finally { setLoading(false) }
  }

  return (
    <main style={{ background: '#0A0A0A', color: '#FFFFFF' }}>

      {/* ── NAV ──────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(12,12,12,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2A2A2A',
      }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: 64 }}>
          <Image src="/fldwrk-logo-dark.png" alt="FLDWRK" width={128} height={32} style={{ height: 32, width: 'auto' }} priority />
          <div className="hidden md:flex items-center gap-7">
            {['App', 'How It Works', 'Features', 'Pricing'].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/[TM\s]/g, '-').replace('how-it-works', 'features')}`}
                style={{ color: '#FFFFFF', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, textDecoration: 'none', opacity: 0.85 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
              >{link}</a>
            ))}
          </div>
          <a href="#waitlist" style={{
            background: '#E8352A', color: '#FFFFFF', fontWeight: 700, fontSize: 13,
            padding: '8px 18px', borderRadius: '4px', textDecoration: 'none', letterSpacing: '0.04em',
          }}>Join Waitlist</a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section id="app" style={{ minHeight: '100vh', paddingTop: 64, position: 'relative', overflow: 'hidden' }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/hero.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.5) 100%)',
        }} />
        {/* Contour map pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/patterns/fldwrk-contour-map-pattern.svg)',
          backgroundSize: 'cover', opacity: 0.04,
        }} />

        <div className="max-w-6xl mx-auto px-6 relative" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
            {/* Left: Copy */}
            <div style={{ maxWidth: 600 }}>
              <div className="mb-5" style={{ fontSize: 12, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
                AI-NATIVE FIELD SERVICE
              </div>
              <h1 className="font-black" style={{ fontSize: 'clamp(48px, 7vw, 72px)', lineHeight: 1.05, marginBottom: 20, color: '#FFFFFF' }}>
                You built this city.<br />Now run it smarter.
              </h1>
              <p style={{ fontSize: 18, color: '#AAAAAA', maxWidth: 520, lineHeight: 1.65, marginBottom: 32 }}>
                FLDWRK is the only AI-native platform built exclusively for tradespeople. Voice-first. No laptop. No paperwork. Just your phone and your skills.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <a href="#waitlist" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#E8352A', color: '#FFFFFF', fontWeight: 700,
                  padding: '14px 28px', borderRadius: '4px', textDecoration: 'none', fontSize: 15,
                }}>Claim My Founding Spot &rarr;</a>
                <a href="#app-preview" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'transparent', color: '#FFFFFF', fontWeight: 600,
                  padding: '14px 28px', borderRadius: '4px', textDecoration: 'none', fontSize: 15,
                  border: '1px solid rgba(255,255,255,0.25)',
                }}>See the App &darr;</a>
              </div>
              {/* Built for strip */}
              <div style={{ fontSize: 13, color: '#AAAAAA', letterSpacing: '0.04em' }}>
                Built for: Plumbers &middot; HVAC Techs &middot; Electricians &middot; Contractors &middot; Landscapers
              </div>
            </div>

            {/* Right: 2x2 stats grid */}
            <div className="grid grid-cols-2 gap-3" style={{ minWidth: 280 }}>
              {[
                { value: '47 min', label: 'Lost to paperwork every job' },
                { value: '$12K', label: 'Uncharged time per year' },
                { value: '3.2x', label: 'Faster quoting with AI' },
                { value: '8 hrs', label: 'Admin saved per week' },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#181818', borderLeft: '3px solid #E8352A',
                  padding: '20px 18px', borderRadius: '4px',
                }}>
                  <div className="font-black" style={{ fontSize: 28, color: '#FFFFFF', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ──────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 24px' }}>
        <div className="max-w-5xl mx-auto">
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 12, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 16 }}>
              THE PROBLEM
            </div>
            <h2 className="font-black" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: '#0A0A0A', lineHeight: 1.1 }}>
              Jobber was built for an office.<br />You work in the field.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: before/after */}
            <div className="space-y-2">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#555555', marginBottom: 12 }}>
                Right now, you&apos;re stuck:
              </div>
              {[
                'Writing up job notes at 9pm after a 10-hour day',
                'Building quotes in a spreadsheet while the customer watches',
                'Forgetting to charge for incidental parts and labor',
                'Guessing which jobs actually made you money this month',
                "Explaining the same tools to every new software you try",
              ].map(text => (
                <div key={text} className="flex items-start gap-3" style={{ padding: '12px 16px', background: '#F8F8F8' }}>
                  <span style={{ color: '#E8352A', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>-</span>
                  <span style={{ fontSize: 14, color: '#555555', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
              <div style={{ marginTop: 24, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#555555', marginBottom: 12 }}>
                With FLDWRK:
              </div>
              {[
                'Dictate job notes hands-free in 30 seconds, on-site',
                'AI-generated quote from a voice description - in front of the customer',
                'Every part auto-added so nothing gets left out',
                'Dashboard shows your revenue and jobs the moment you open the app',
                "Voice-first interface - if you can talk, you can use it",
              ].map(text => (
                <div key={text} className="flex items-start gap-3" style={{ padding: '12px 16px', background: '#F8F8F8', borderLeft: '3px solid #E8352A' }}>
                  <span style={{ color: '#E8352A', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>›</span>
                  <span style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500, lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
            {/* Right: photo */}
            <div style={{
              background: '#0C0C0C', borderRadius: '4px', overflow: 'hidden',
              border: '1px solid #2A2A2A', aspectRatio: '4/3',
            }}>
              <img src="/images/problem.jpg" alt="Contractor frustrated with paperwork" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION SECTION ──────────────────────────── */}
      <section style={{ background: '#0C0C0C', padding: '96px 24px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 12, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 16 }}>
              THE SOLUTION
            </div>
            <h2 className="font-black" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: '#FFFFFF', lineHeight: 1.1 }}>
              Everything you need. In your pocket. In seconds.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {([
              {
                iconNode: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512" fill="none">
                    <g stroke="#E8352A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M136 270 C136 198 188 150 256 150 C324 150 376 198 376 270 C376 342 324 390 256 390 H168 L136 424 V270 Z"/>
                      <path d="M204 270 H308 M224 232 H288 M224 308 H288"/>
                    </g>
                    <circle cx="316" cy="214" r="16" fill="#E8352A"/>
                  </svg>
                ),
                name: 'VoiceLogTM',
                tagline: 'Speak it. Done.',
                desc: 'Dictate job notes hands-free on-site. AI cleans, structures, and saves them instantly - gloves on or off.',
              },
              {
                iconNode: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512" fill="none">
                    <path d="M315.27 33L96 304h176l-31.91 175L432 208H256l59.27-175z" stroke="#E8352A" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                name: 'QuickQuoteTM',
                tagline: 'Quote in 30 seconds.',
                desc: 'Describe the job out loud. FLDWRK generates a full quote with parts, labor, and margin - right on your phone.',
              },
              {
                iconNode: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512" fill="none">
                    <path d="M32 32v432h448" stroke="#E8352A" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="96" y="224" width="80" height="224" stroke="#E8352A" strokeWidth="32"/>
                    <rect x="240" y="176" width="80" height="272" stroke="#E8352A" strokeWidth="32"/>
                    <rect x="384" y="80" width="80" height="368" stroke="#E8352A" strokeWidth="32"/>
                  </svg>
                ),
                name: 'Dashboard',
                tagline: 'Know your numbers.',
                desc: 'Revenue won this month. Quotes still waiting on an answer. What’s scheduled today. The numbers that decide your week, on one screen.',
              },
            ] as { iconNode: React.ReactNode; name: string; tagline: string; desc: string }[]).map(card => (
              <div key={card.name} style={{
                background: '#181818', borderTop: '2px solid #E8352A',
                padding: '28px 24px', borderRadius: '4px',
              }}>
                <div style={{ marginBottom: 12 }}>{card.iconNode}</div>
                <div style={{ fontSize: 11, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>{card.name}</div>
                <div className="font-black" style={{ fontSize: 20, color: '#FFFFFF', marginBottom: 10 }}>{card.tagline}</div>
                <div style={{ fontSize: 14, color: '#AAAAAA', lineHeight: 1.6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP PREVIEW SECTION ───────────────────────── */}
      <section id="app-preview" style={{ background: '#0C0C0C', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Grid nodes pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/patterns/fldwrk-grid-nodes-pattern.svg)',
          backgroundRepeat: 'repeat', backgroundSize: '120px 120px',
          opacity: 0.03,
        }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center" style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 16 }}>
              APP PREVIEW
            </div>
            <h2 className="font-black" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: '#FFFFFF', lineHeight: 1.1 }}>
              Built for how you actually work.
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            <div className="flex flex-col items-center gap-5">
              <DarkPhone tilt={-4}>
                <PhoneVoiceLog />
              </DarkPhone>
              <div className="text-center">
                <div className="font-black" style={{ color: '#FFFFFF', fontSize: 14 }}>VoiceLogTM</div>
                <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 2 }}>Hands-free job notes</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-5">
              <DarkPhone tilt={4}>
                <PhoneFieldIQ />
              </DarkPhone>
              <div className="text-center">
                <div className="font-black" style={{ color: '#FFFFFF', fontSize: 14 }}>Dashboard</div>
                <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 2 }}>Your numbers, always current</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────── */}
      <section id="features" style={{ background: '#0A0A0A' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center" style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 12, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 16 }}>
              FEATURES
            </div>
            <h2 className="font-black" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: '#FFFFFF', lineHeight: 1.1 }}>
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>
        </div>

        {/* Feature 1 - VoiceLog (dark) */}
        <div style={{ background: '#0C0C0C', borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A' }}>
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div style={{ fontSize: 11, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 12 }}>VoiceLogTM</div>
                <h3 className="font-black" style={{ fontSize: 36, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.15 }}>Notes without typing.</h3>
                <p style={{ fontSize: 16, color: '#AAAAAA', lineHeight: 1.7, marginBottom: 24 }}>
                  Open FLDWRK and speak. Job notes, site conditions, parts used - AI cleans it up and saves it instantly. Works with your gloves on, hands covered, or driving between jobs.
                </p>
                <div className="space-y-3">
                  {['Voice-to-text in any noise environment', 'Auto-structured job reports', 'Synced across your whole crew'].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <span style={{ color: '#E8352A', fontWeight: 700 }}>-</span>
                      <span style={{ fontSize: 14, color: '#AAAAAA' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#181818', borderRadius: '4px', overflow: 'hidden', border: '1px solid #2A2A2A', aspectRatio: '4/3' }}>
                <img src="/images/solution.jpg" alt="Worker using FLDWRK on job site" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 - QuickQuote (light) */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E5E0' }}>
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div style={{ background: '#F8F8F8', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E8E5E0', aspectRatio: '4/3', order: -1 }}>
                <img src="/images/problem.jpg" alt="Contractor generating quote on phone" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 12 }}>QuickQuoteTM</div>
                <h3 className="font-black" style={{ fontSize: 36, color: '#0A0A0A', marginBottom: 16, lineHeight: 1.15 }}>A quote in 30 seconds.</h3>
                <p style={{ fontSize: 16, color: '#555555', lineHeight: 1.7, marginBottom: 24 }}>
                  Describe the job out loud. FLDWRK generates a professional quote with parts, labor, and margin - right on your phone, in front of the customer. No spreadsheet. No laptop.
                </p>
                <div className="space-y-3">
                  {['Voice-driven quote generation', 'Auto-includes common parts + labor', 'Email quote directly from the truck'].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <span style={{ color: '#E8352A', fontWeight: 700 }}>-</span>
                      <span style={{ fontSize: 14, color: '#555555' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 - Dashboard (dark) */}
        <div style={{ background: '#0C0C0C', borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A' }}>
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div style={{ fontSize: 11, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 12 }}>Dashboard</div>
                <h3 className="font-black" style={{ fontSize: 36, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.15 }}>Your numbers, front and center.</h3>
                <p style={{ fontSize: 16, color: '#AAAAAA', lineHeight: 1.7, marginBottom: 24 }}>
                  Revenue won this month. Quotes still waiting on an answer. What&apos;s scheduled today. The numbers that decide your week - on one screen, the moment you open the app.
                </p>
                <div className="space-y-3">
                  {['Revenue and job totals at a glance', 'Open quotes and pending follow-ups', 'Today’s schedule, no digging required'].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <span style={{ color: '#E8352A', fontWeight: 700 }}>-</span>
                      <span style={{ fontSize: 14, color: '#AAAAAA' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#181818', borderRadius: '4px', overflow: 'hidden', border: '1px solid #2A2A2A', aspectRatio: '4/3' }}>
                <img src="/images/fieldiq.jpg" alt="FLDWRK Dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4 - AI Actions (light) */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E5E0' }}>
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div style={{ background: '#F8F8F8', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E8E5E0', aspectRatio: '4/3', order: -1 }}>
                <img src="/images/features-bg.jpg" alt="AI-powered field service" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 12 }}>AI Actions</div>
                <h3 className="font-black" style={{ fontSize: 36, color: '#0A0A0A', marginBottom: 16, lineHeight: 1.15 }}>Just talk. AI does the rest.</h3>
                <p style={{ fontSize: 16, color: '#555555', lineHeight: 1.7, marginBottom: 24 }}>
                  Tell FLDWRK what you need. Schedule a follow-up, send an invoice, look up a customer&apos;s job history - all without touching a menu. Built for people who work with their hands.
                </p>
                <div className="space-y-3">
                  {['Voice commands for every action', 'Smart scheduling and follow-ups', 'Instant customer history lookup'].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <span style={{ color: '#E8352A', fontWeight: 700 }}>-</span>
                      <span style={{ fontSize: 14, color: '#555555' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── PRICING SECTION ───────────────────────────── */}
      <section id="pricing" style={{ background: '#F8F8F8', padding: '96px 24px' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div style={{ fontSize: 12, color: '#E8352A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 16 }}>
            PRICING
          </div>
          <h2 className="font-black" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: '#0A0A0A', marginBottom: 12 }}>
            Simple. Flat. No surprises.
          </h2>
          {/* Founding callout */}
          <div style={{
            background: '#181818', color: '#FFFFFF',
            padding: '14px 24px', borderRadius: '4px', marginBottom: 40,
            display: 'inline-block', fontSize: 14, fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            Founding members lock in 40% off forever.
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: 'Solo',
                price: '$49',
                founding: '$29',
                desc: 'The one-man operation',
                features: ['VoiceLogTM (unlimited)', 'QuickQuoteTM', 'Unlimited jobs', 'iOS + Android app', 'Email support'],
                cta: 'Start Solo',
                featured: false,
              },
              {
                name: 'Crew',
                price: '$89',
                founding: '$53',
                desc: 'Growing crews up to 5 techs',
                features: ['Everything in Solo', 'Multi-tech dispatch', 'Dashboard analytics', 'Customer portal', 'Priority support'],
                cta: 'Start Crew',
                featured: true,
              },
              {
                name: 'Shop',
                price: '$149',
                founding: '$89',
                desc: 'Established operations',
                features: ['Everything in Crew', 'Advanced reporting', 'API access', 'Custom integrations', 'Dedicated support'],
                cta: 'Start Shop',
                featured: false,
              },
            ].map(plan => (
              <div key={plan.name} style={{
                background: '#181818',
                border: plan.featured ? '2px solid #E8352A' : '1px solid #2A2A2A',
                padding: '28px 24px', borderRadius: '4px',
                position: 'relative', textAlign: 'left',
              }}>
                {plan.featured && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#E8352A', color: '#FFFFFF', fontSize: 10, fontWeight: 800,
                    padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>Most Popular</div>
                )}
                <div style={{ fontSize: 11, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{plan.name}</div>
                <div className="flex items-end gap-2" style={{ marginBottom: 4 }}>
                  <span className="font-black" style={{ fontSize: 36, color: '#FFFFFF', lineHeight: 1 }}>{plan.founding}</span>
                  <span style={{ fontSize: 13, color: '#555555', marginBottom: 4, textDecoration: 'line-through' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: '#555555', marginBottom: 4 }}>/mo</span>
                </div>
                <div style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 20 }}>{plan.desc}</div>
                <div className="space-y-2" style={{ marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <span style={{ color: '#E8352A', fontWeight: 700, fontSize: 12 }}>›</span>
                      <span style={{ fontSize: 13, color: '#AAAAAA' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="#waitlist" style={{
                  display: 'block', textAlign: 'center',
                  background: plan.featured ? '#E8352A' : '#222222',
                  color: '#FFFFFF', fontWeight: 700, fontSize: 13,
                  padding: '12px', borderRadius: '4px', textDecoration: 'none',
                  border: plan.featured ? 'none' : '1px solid #2A2A2A',
                }}>{plan.cta} &rarr;</a>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 24 }}>Founding pricing locks in at launch. No card required today.</p>
        </div>
      </section>

      {/* ── WAITLIST / CTA SECTION ────────────────────── */}
      <section id="waitlist" style={{ background: '#0C0C0C', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div className="max-w-2xl mx-auto relative">
          {/* Countdown */}
          <div className="text-center" style={{ marginBottom: 64 }}>
            <h2 className="font-black" style={{ fontSize: 'clamp(36px, 6vw, 56px)', color: '#FFFFFF', lineHeight: 1.05, marginBottom: 16 }}>
              The clock is ticking.
            </h2>
            <p style={{ fontSize: 16, color: '#AAAAAA', marginBottom: 40 }}>
              We&apos;re heads-down building. Founding members get in first - and their 40% discount is locked forever.
            </p>
            <div className="flex justify-center gap-3">
              {[
                { label: 'Days', val: countdown.days },
                { label: 'Hours', val: countdown.hours },
                { label: 'Min', val: countdown.minutes },
                { label: 'Sec', val: countdown.seconds },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col items-center justify-center" style={{
                  background: '#181818', border: '1px solid #2A2A2A',
                  borderRadius: '4px', width: 80, height: 80,
                }}>
                  <span className="font-black tabular-nums" style={{ fontSize: 30, color: '#E8352A', lineHeight: 1 }}>{pad(val)}</span>
                  <span style={{ fontSize: 9, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          {submitted ? (
            <div className="text-center" style={{ padding: '48px 32px', background: '#181818', border: '1px solid #2A2A2A', borderRadius: '4px' }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: '#E8352A', fontWeight: 900 }}>Done.</div>
              <h2 className="font-black" style={{ fontSize: 28, color: '#FFFFFF', marginBottom: 12 }}>You&apos;re on the list.</h2>
              <p style={{ fontSize: 15, color: '#AAAAAA', marginBottom: 24 }}>
                You&apos;re one of our founding members. We&apos;ll reach out personally before launch.
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="https://twitter.com/intent/tweet?text=Just%20joined%20the%20FLDWRK%20waitlist%20%E2%80%94%20AI-native%20field%20service%20management%20built%20for%20the%20trades.%20fldwrk.ai"
                  target="_blank"
                  style={{ background: '#FFFFFF', color: '#0A0A0A', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: '4px', textDecoration: 'none' }}
                >Share on X</a>
                <button
                  onClick={() => navigator.clipboard.writeText('https://fldwrk.ai')}
                  style={{ background: '#222222', color: '#AAAAAA', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: '4px', border: '1px solid #2A2A2A', cursor: 'pointer' }}
                >Copy Link</button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#181818', border: '1px solid #2A2A2A', borderRadius: '4px', padding: '40px 32px' }}>
              <div className="text-center" style={{ marginBottom: 32 }}>
                <h3 className="font-black" style={{ fontSize: 24, color: '#FFFFFF', marginBottom: 8 }}>Get in before we launch.</h3>
                <p style={{ fontSize: 14, color: '#AAAAAA' }}>Founding members get 40% off forever and direct access to the product team.</p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: 'firstName' as const, label: 'First Name', placeholder: 'Mike' },
                    { field: 'lastName' as const, label: 'Last Name', placeholder: 'Torres' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#FFFFFF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
                      <input
                        {...register(f.field, { required: 'Required' })}
                        type="text" placeholder={f.placeholder}
                        style={{ width: '100%', background: '#222222', border: '1px solid #2A2A2A', borderRadius: '4px', padding: '12px 14px', color: '#FFFFFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                      {errors[f.field] && <p style={{ color: '#E8352A', fontSize: 11, marginTop: 4 }}>{errors[f.field]?.message}</p>}
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#FFFFFF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Work Email</label>
                  <input
                    {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Valid email required' } })}
                    type="email" placeholder="you@yourcompany.com"
                    style={{ width: '100%', background: '#222222', border: '1px solid #2A2A2A', borderRadius: '4px', padding: '12px 14px', color: '#FFFFFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {errors.email && <p style={{ color: '#E8352A', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#FFFFFF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Trade</label>
                  <select
                    {...register('trade', { required: true })}
                    style={{ width: '100%', background: '#222222', border: '1px solid #2A2A2A', borderRadius: '4px', padding: '12px 14px', color: '#FFFFFF', fontSize: 14, outline: 'none' }}
                  >
                    <option value="">Select your trade</option>
                    {trades.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#FFFFFF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    {teamSizes.map(size => (
                      <label key={size} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#222222', border: '1px solid #2A2A2A', borderRadius: '4px', padding: '10px 14px', cursor: 'pointer' }}>
                        <input {...register('teamSize', { required: true })} type="radio" value={size} style={{ accentColor: '#E8352A' }} />
                        <span style={{ fontSize: 13, color: '#AAAAAA' }}>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', background: loading ? '#8B1A15' : '#E8352A',
                    color: '#FFFFFF', fontWeight: 800, fontSize: 15,
                    padding: '16px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                    letterSpacing: '0.02em', marginTop: 8,
                  }}
                >{loading ? 'Securing your spot...' : 'Secure My Founding Spot \u2192'}</button>
                <p style={{ textAlign: 'center', fontSize: 12, color: '#555555' }}>
                  No credit card. No commitment. Just early access.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer style={{ background: '#0A0A0A', borderTop: '1px solid #2A2A2A', padding: '48px 24px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6" style={{ marginBottom: 32 }}>
            <Image src="/fldwrk-logo-dark.png" alt="FLDWRK" width={112} height={28} style={{ height: 28, width: 'auto' }} />
            <p style={{ fontSize: 13, color: '#AAAAAA', textAlign: 'center' }}>
              The AI-native field service platform. Built exclusively for the trades.
            </p>
            <div className="flex gap-6">
              {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:hello@fldwrk.ai']].map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: 13, color: '#555555', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#AAAAAA')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
                >{label}</a>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#555555', borderTop: '1px solid #2A2A2A', paddingTop: 24 }}>
            &copy; 2026 FLDWRK, Inc. &middot; Built for the truck.
          </div>
        </div>
      </footer>

    </main>
  )
}
