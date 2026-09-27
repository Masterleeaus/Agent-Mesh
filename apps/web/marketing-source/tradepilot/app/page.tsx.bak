'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

/* ─── Types ───────────────────────────────────────────────────── */
type FormData = { email: string; trade: string; teamSize: string }

/* ─── Data ───────────────────────────────────────────────────── */
const trades = ['Plumber', 'HVAC Tech', 'Electrician', 'General Contractor', 'Roofer', 'Painter', 'Landscaper', 'Other']
const teamSizes = ['Just me', '2–5 people', '6–15 people', '15+ people']

const stats = [
  { value: '47 min', label: 'Lost to paperwork every job' },
  { value: '$12K', label: 'Uncharged time per year, avg' },
  { value: '3.2×', label: 'Faster quoting with AI' },
  { value: '8 hrs', label: 'Admin saved per week' },
]

const features = [
  {
    icon: '🎙️',
    name: 'VoiceLog™',
    tagline: 'Notes without typing.',
    desc: 'Speak your job notes hands-free on-site. AI cleans, structures, and saves them instantly — gloves on or off.',
    color: 'from-orange-50 to-amber-50',
    border: 'border-orange-100',
  },
  {
    icon: '💰',
    name: 'QuickQuote™',
    tagline: 'A quote in 30 seconds.',
    desc: 'Describe the job out loud. FLDWRK generates a full quote with parts, labor, and margin — right on your phone.',
    color: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
  },
  {
    icon: '🧠',
    name: 'TradeIQ™',
    tagline: 'Know your numbers.',
    desc: 'Revenue, margins, top customers, busiest months — your business intelligence, automatically surfaced every week.',
    color: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
  },
  {
    icon: '🚚',
    name: 'TruckStock™',
    tagline: 'Never run out on-site.',
    desc: 'Track every part in your truck. Get alerts before you run out of what you use most. No more 2nd trip.',
    color: 'from-purple-50 to-violet-50',
    border: 'border-purple-100',
  },
]

const testimonials = [
  {
    quote: "I used to spend an hour after every job just catching up on notes and invoices. With voice-first tools, I do it in the truck before I even start the engine.",
    name: 'Marcus T.',
    role: 'Master Plumber · Dallas, TX',
    trade: '🔧',
    stars: 5,
  },
  {
    quote: "I'm not a tech guy. I've tried Jobber, tried ServiceTitan. Too much clicking. If FLDWRK is as simple as talking into my phone, I'm in.",
    name: 'Devon R.',
    role: 'HVAC Owner · Phoenix, AZ',
    trade: '❄️',
    stars: 5,
  },
  {
    quote: "My crew doesn't fill out paperwork. Period. A voice-first tool is the only thing that's ever going to actually get used in the field.",
    name: 'Jamie L.',
    role: 'Electrical Contractor · Chicago, IL',
    trade: '⚡',
    stars: 5,
  },
]

const steps = [
  {
    num: '01',
    icon: '🎙️',
    title: 'Speak your day',
    desc: 'Open FLDWRK and talk. Log job notes, request a quote, check your schedule — all with your voice. No menus to navigate.',
  },
  {
    num: '02',
    icon: '🤖',
    title: 'AI does the work',
    desc: "Your words become structured notes, professional invoices, and real-time insights. FLDWRK handles the office work so you don't have to.",
  },
  {
    num: '03',
    icon: '📈',
    title: 'Grow your business',
    desc: "With TradeIQ™, see which jobs are most profitable, which customers come back, and where you're leaving money on the table.",
  },
]

const tradeProblems = {
  Plumber: {
    icon: '🔧',
    problems: ['Writing up water heater jobs after hours', 'Forgetting to charge for incidental materials', 'Losing track of jobs across multiple properties'],
    solution: 'FLDWRK turns your voice into a job report, auto-adds common parts to your quote, and keeps every job tied to the right address.',
  },
  'HVAC Tech': {
    icon: '❄️',
    problems: ['Seasonal rush means zero time for paperwork', 'Quoting refrigerant + labor fast on-site', 'Dispatching a 2-tech crew without losing job info'],
    solution: 'FLDWRK generates seasonal quotes in 30 seconds, handles crew dispatch, and keeps every job note in sync across your whole team.',
  },
  Electrician: {
    icon: '⚡',
    problems: ['Panel jobs require detailed documentation', 'Permit tracking across multiple sites', 'Customers asking for written quotes on the spot'],
    solution: 'VoiceLog™ captures detailed electrical notes automatically. FLDWRK keeps permit details per job and emails quotes from your phone.',
  },
}

/* ─── Countdown ──────────────────────────────────────────────── */
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

/* ─── App Screen Components ──────────────────────────────────── */

function PhoneVoiceLog() {
  return (
    <div className="w-full h-full bg-[#F9F8F6] flex flex-col text-[#1A1A1A]">
      {/* Status */}
      <div className="flex justify-between px-4 pt-3 pb-1 text-[8px] text-gray-400">
        <span className="font-semibold">9:41</span>
        <div className="flex gap-1">
          <span>●●●●</span><span>WiFi</span><span>🔋</span>
        </div>
      </div>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pb-3 border-b border-gray-100">
        <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-[9px] font-black text-white">F</div>
        <span className="font-bold text-[11px] text-gray-800">VoiceLog™</span>
        <span className="ml-auto text-[8px] text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">LIVE</span>
      </div>
      {/* Content */}
      <div className="flex-1 px-4 py-3 flex flex-col gap-3">
        <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest">Job #284 — In Progress</div>
        {/* Recording card */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center pulse-dot">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-orange-600 text-[8px] font-bold">Recording...</span>
            <span className="ml-auto text-orange-400 text-[8px] font-mono">0:47</span>
          </div>
          <p className="text-gray-700 text-[8px] leading-[14px]">
            "Replaced 40-gal Bradford White unit in basement. Added expansion tank. Customer approved PRO model upgrade on-site..."
          </p>
          {/* Waveform */}
          <div className="flex items-center gap-[2px] mt-2 h-5">
            {[2,5,8,4,7,10,6,3,9,5,8,2,6,10,4,7,3,5,8,6,4,9,7,3].map((h, i) => (
              <div key={i} className="w-[2.5px] rounded-full bg-orange-400" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
        {/* Saved notes */}
        <div className="space-y-1.5">
          <div className="text-[7px] font-semibold text-gray-400 uppercase tracking-widest">Recent</div>
          {['Job #283 — HVAC filter + coil clean', 'Job #282 — Kitchen P-trap, leak fixed'].map(n => (
            <div key={n} className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-[8px] text-gray-500 flex items-center gap-2 card-shadow">
              <span className="text-green-500 text-[8px]">✓</span>{n}
            </div>
          ))}
        </div>
      </div>
      {/* Action */}
      <div className="px-4 pb-4">
        <div className="bg-orange-500 rounded-xl py-2.5 text-center text-[9px] font-bold text-white shadow-md">
          Save + Next Job →
        </div>
      </div>
    </div>
  )
}

function PhoneQuickQuote() {
  return (
    <div className="w-full h-full bg-[#F9F8F6] flex flex-col text-[#1A1A1A]">
      <div className="flex justify-between px-4 pt-3 pb-1 text-[8px] text-gray-400">
        <span className="font-semibold">9:41</span>
        <div className="flex gap-1"><span>●●●●</span><span>WiFi</span><span>🔋</span></div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3 border-b border-gray-100">
        <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-[9px] font-black text-white">F</div>
        <span className="font-bold text-[11px] text-gray-800">QuickQuote™</span>
        <span className="ml-auto text-[8px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">AI · 28 sec</span>
      </div>
      <div className="flex-1 px-4 py-3 flex flex-col gap-2">
        <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest">Martinez Residence</div>
        <div className="space-y-1">
          {[
            { label: 'Water Heater (40gal PRO)', price: '$1,240' },
            { label: 'Expansion Tank', price: '$180' },
            { label: 'Labor (2.5 hrs @ $130)', price: '$325' },
            { label: 'City Permit Fee', price: '$85' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center bg-white border border-gray-100 rounded-xl px-3 py-2 card-shadow">
              <span className="text-[8px] text-gray-600">{item.label}</span>
              <span className="text-[9px] font-bold text-gray-800">{item.price}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
          <span className="text-[9px] font-semibold text-gray-500">Total</span>
          <span className="text-[16px] font-black text-orange-500">$1,830</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-2.5 card-shadow">
          <div className="text-[7px] text-gray-400 mb-1.5 font-semibold">Estimated Margin</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '68%' }} />
            </div>
            <span className="text-[9px] text-emerald-600 font-bold">68%</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 text-center text-[8px] text-gray-500 font-semibold card-shadow">Edit</div>
        <div className="flex-1 bg-orange-500 rounded-xl py-2.5 text-center text-[9px] font-bold text-white shadow-md">Send →</div>
      </div>
    </div>
  )
}

function TabletDashboard() {
  return (
    <div className="w-full h-full bg-[#F9F8F6] flex flex-col text-[#1A1A1A]">
      {/* Status */}
      <div className="flex justify-between px-5 pt-3 pb-2 text-[8px] text-gray-400 border-b border-gray-100 bg-white">
        <span className="font-semibold">9:41 AM · Monday</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-orange-500 flex items-center justify-center text-[7px] font-black text-white">F</div>
          <span className="font-bold text-[10px] text-gray-800">FLDWRK</span>
        </div>
        <div className="flex gap-1 text-[7px]"><span>●●●●</span><span>WiFi</span><span>🔋</span></div>
      </div>
      {/* Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-20 bg-white border-r border-gray-100 flex flex-col gap-0.5 p-2 pt-3">
          {[
            { icon: '📊', label: 'Overview', active: true },
            { icon: '🎙️', label: 'VoiceLog', active: false },
            { icon: '💰', label: 'Quotes', active: false },
            { icon: '👥', label: 'Jobs', active: false },
            { icon: '🧠', label: 'TradeIQ', active: false },
            { icon: '🚚', label: 'Truck', active: false },
          ].map(item => (
            <div key={item.label} className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl cursor-pointer ${item.active ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
              <span className="text-sm">{item.icon}</span>
              <span className={`text-[6.5px] font-semibold ${item.active ? 'text-orange-600' : 'text-gray-400'}`}>{item.label}</span>
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 p-3 flex flex-col gap-2 bg-[#F9F8F6] overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black text-gray-800">Good morning, Mike 👋</div>
              <div className="text-[7px] text-gray-400">Week of Apr 21 · 3 jobs today</div>
            </div>
            <div className="bg-orange-500 text-white text-[7px] font-bold px-2.5 py-1.5 rounded-lg">+ New Job</div>
          </div>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'This Week', value: '$9,840', delta: '↑ 18%', color: 'text-emerald-600' },
              { label: 'Jobs Done', value: '12', delta: '↑ 3 vs last wk', color: 'text-blue-500' },
              { label: 'Avg Margin', value: '71%', delta: '↑ 4pts', color: 'text-orange-500' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-2.5 card-shadow">
                <div className="text-[7px] text-gray-400 mb-0.5">{c.label}</div>
                <div className="text-[14px] font-black text-gray-800">{c.value}</div>
                <div className={`text-[7px] font-semibold ${c.color}`}>{c.delta}</div>
              </div>
            ))}
          </div>
          {/* Jobs */}
          <div className="bg-white rounded-2xl p-2.5 card-shadow flex-1">
            <div className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-2">Today&apos;s Jobs</div>
            <div className="space-y-1.5">
              {[
                { job: 'Water heater replacement', customer: 'Martinez Residence', status: 'Done', statusColor: 'bg-emerald-100 text-emerald-700', margin: '68%' },
                { job: 'HVAC tune-up + filter swap', customer: 'Parkview Dental', status: 'Active', statusColor: 'bg-orange-100 text-orange-700', margin: '74%' },
                { job: 'Gas line safety inspection', customer: 'Cornerstone Apts', status: 'Next', statusColor: 'bg-gray-100 text-gray-500', margin: '—' },
              ].map(j => (
                <div key={j.job} className="flex items-center justify-between bg-gray-50 rounded-xl px-2.5 py-2">
                  <div>
                    <div className="text-[8.5px] font-semibold text-gray-800">{j.job}</div>
                    <div className="text-[7px] text-gray-400">{j.customer}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[7px] text-gray-400">{j.margin}</span>
                    <span className={`text-[6.5px] px-2 py-0.5 rounded-full font-bold ${j.statusColor}`}>{j.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mini chart */}
          <div className="bg-white rounded-2xl p-2.5 card-shadow">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">Revenue (7d)</span>
              <span className="text-[7px] font-bold text-orange-500">TradeIQ™</span>
            </div>
            <div className="flex items-end gap-1.5 h-10">
              {[40, 65, 45, 80, 55, 90, 72].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${h}%`, background: i === 5 ? '#f97316' : '#FED7AA' }} />
              ))}
            </div>
            <div className="flex justify-between text-[6.5px] text-gray-300 mt-1">
              {['M','T','W','T','F','S','S'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Device Frames ─────────────────────────────────────────── */

function IPhone({ children, tilt = 0 }: { children: React.ReactNode; tilt?: number }) {
  return (
    <div className="relative" style={{ width: 195, transform: `rotate(${tilt}deg)` }}>
      <div
        className="relative bg-[#E8E5E0] rounded-[44px] p-[3px]"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' }}
      >
        {/* Inner shell */}
        <div className="bg-[#D4D0CA] rounded-[42px] p-[2px]">
          {/* Dynamic island */}
          <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-14 h-[18px] bg-[#1a1a1a] rounded-full z-10" />
          {/* Screen */}
          <div className="bg-white rounded-[40px] overflow-hidden" style={{ height: 406 }}>
            <div className="pt-8 h-full">
              {children}
            </div>
          </div>
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-24 h-[4px] bg-[#C0BDB8] rounded-full" />
      </div>
      {/* Side buttons */}
      <div className="absolute left-[-4px] top-[76px] w-[4px] h-7 bg-[#C8C5BF] rounded-l-full" />
      <div className="absolute left-[-4px] top-[116px] w-[4px] h-10 bg-[#C8C5BF] rounded-l-full" />
      <div className="absolute left-[-4px] top-[138px] w-[4px] h-10 bg-[#C8C5BF] rounded-l-full" />
      <div className="absolute right-[-4px] top-[96px] w-[4px] h-14 bg-[#C8C5BF] rounded-r-full" />
    </div>
  )
}

function IPad({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ width: 380 }}>
      <div
        className="relative bg-[#E0DDD8] rounded-[30px] p-[4px]"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.85)' }}
      >
        <div className="bg-[#CCCAC5] rounded-[27px] p-[2px]">
          {/* Front camera */}
          <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#B8B5AF] z-10" />
          {/* Screen */}
          <div className="bg-white rounded-[25px] overflow-hidden" style={{ height: 490 }}>
            <div className="h-full">
              {children}
            </div>
          </div>
        </div>
        {/* Home bar */}
        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-20 h-[4px] bg-[#B8B5AF] rounded-full" />
      </div>
      {/* Side button */}
      <div className="absolute right-[-4px] top-[80px] w-[4px] h-10 bg-[#C8C5BF] rounded-r-full" />
      {/* Volume */}
      <div className="absolute top-[-4px] left-[90px] h-[4px] w-9 bg-[#C8C5BF] rounded-t-full" />
      <div className="absolute top-[-4px] left-[112px] h-[4px] w-9 bg-[#C8C5BF] rounded-t-full" />
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────── */

export default function Home() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [spotsLeft] = useState(47)
  const [activeTab, setActiveTab] = useState<'Plumber' | 'HVAC Tech' | 'Electrician'>('Plumber')
  const countdown = useCountdown(new Date('2026-06-01T00:00:00'))
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
    <main className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A]">

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E8E5E0]" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center font-black text-sm text-white shadow-md">F</div>
            <span className="font-black text-lg tracking-tight text-gray-900">FLDWRK</span>
            <span className="text-xs text-gray-300 font-mono">.ai</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 font-medium">
            <a href="#app-preview" className="hover:text-gray-900 transition-colors">App</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <a
            href="#waitlist"
            className="text-sm bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
          >
            Join Waitlist →
          </a>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6 hero-gradient">
        <div className="max-w-5xl mx-auto text-center">

          {/* Launch badge */}
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 text-sm text-orange-600 font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-500 pulse-dot inline-block" />
            Launching June 2026 · {spotsLeft} founding spots left
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-[72px] font-black tracking-tight leading-[1.03] mb-6 text-gray-900">
            The field service app
            <br />
            <span className="gradient-text">built for your truck.</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            FLDWRK is the only AI-native platform built <em>exclusively</em> for tradespeople.
            <br className="hidden md:block" />
            Voice-first. No laptop. No paperwork. Just your phone and your skills.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <a href="#waitlist" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Claim My Founding Spot →
            </a>
            <a href="#app-preview" className="inline-flex items-center justify-center gap-2 bg-white border border-[#E8E5E0] text-gray-700 font-semibold px-8 py-4 rounded-2xl text-base transition-all card-shadow hover:card-shadow-hover hover:-translate-y-0.5">
              See the App ↓
            </a>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-2xl px-4 py-5 card-shadow text-center">
                <div className="text-2xl font-black gradient-text">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ──────────────────────────── */}
      <section className="py-8 px-6 bg-white border-y border-[#E8E5E0]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center">
          <div className="text-sm text-gray-400 font-medium">Built for</div>
          {['🔧 Plumbers', '❄️ HVAC Techs', '⚡ Electricians', '🏠 Contractors', '🌿 Landscapers'].map(t => (
            <div key={t} className="text-sm font-semibold text-gray-600">{t}</div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ──────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              Jobber was built for an office.<br />
              <span className="text-gray-400">You work in the field.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4">Right now, you're stuck:</div>
              {[
                { emoji: '😤', text: 'Writing up job notes at 9pm after a 10-hour day' },
                { emoji: '📝', text: 'Building quotes in a spreadsheet while the customer watches' },
                { emoji: '💸', text: 'Forgetting to charge for incidental parts and labor time' },
                { emoji: '🤷', text: 'Guessing which jobs actually made you money this month' },
                { emoji: '📦', text: "Running out of parts mid-job because your truck isn't tracked" },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <span className="text-lg mt-0.5">{item.emoji}</span>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4">With FLDWRK:</div>
              {[
                { emoji: '🎙️', text: 'Dictate job notes hands-free in 30 seconds, on-site' },
                { emoji: '⚡', text: 'AI-generated quote from a voice description — in front of the customer' },
                { emoji: '✅', text: 'Every part auto-added to the quote so nothing gets left out' },
                { emoji: '📊', text: 'TradeIQ™ shows your most profitable jobs automatically' },
                { emoji: '🚨', text: 'TruckStock™ alerts you before you run out — before you leave the shop' },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  <span className="text-lg mt-0.5">{item.emoji}</span>
                  <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── APP PREVIEW ─────────────────────────────────── */}
      <section id="app-preview" className="py-24 px-6 bg-gradient-to-b from-white to-[#F9F8F6] border-t border-[#E8E5E0] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">App Preview</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">Built for how you actually work.</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Voice-first on your phone. Full visibility on your iPad. Everything synced in real-time.
            </p>
          </div>

          {/* Device trio */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-4">

            {/* iPhone – VoiceLog, tilted left */}
            <div className="flex flex-col items-center gap-5 float" style={{ animationDelay: '0s' }}>
              <IPhone tilt={-3}>
                <PhoneVoiceLog />
              </IPhone>
              <div className="text-center">
                <div className="font-black text-gray-800 text-sm">VoiceLog™</div>
                <div className="text-xs text-gray-400 mt-0.5">Hands-free job notes</div>
              </div>
            </div>

            {/* iPad – Dashboard, center, elevated */}
            <div className="flex flex-col items-center gap-5 order-first lg:order-none float" style={{ animationDelay: '0.5s' }}>
              <IPad>
                <TabletDashboard />
              </IPad>
              <div className="text-center">
                <div className="font-black text-gray-800 text-sm">TradeIQ™ Dashboard</div>
                <div className="text-xs text-gray-400 mt-0.5">Full business visibility on iPad</div>
              </div>
            </div>

            {/* iPhone – QuickQuote, tilted right */}
            <div className="flex flex-col items-center gap-5 float" style={{ animationDelay: '1s' }}>
              <IPhone tilt={3}>
                <PhoneQuickQuote />
              </IPhone>
              <div className="text-center">
                <div className="font-black text-gray-800 text-sm">QuickQuote™</div>
                <div className="text-xs text-gray-400 mt-0.5">AI quotes in 30 seconds</div>
              </div>
            </div>
          </div>

          {/* Ambient glow */}
          <div className="flex justify-center -mt-8 pointer-events-none">
            <div className="w-[500px] h-16 bg-orange-200/40 blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">Simple enough for any tradesperson.</h2>
            <p className="text-gray-400 mt-4">No training. No onboarding call. Just open it and talk.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="bg-white rounded-3xl p-8 card-shadow relative overflow-hidden group hover:card-shadow-hover hover:-translate-y-1 transition-all">
                <div className="absolute top-4 right-4 text-[64px] font-black text-gray-50 leading-none select-none">{step.num}</div>
                <div className="text-4xl mb-5">{step.icon}</div>
                <h3 className="font-black text-lg text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT FOR YOUR TRADE ────────────────────────── */}
      <section className="py-24 px-6 bg-white border-y border-[#E8E5E0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Trade-Specific</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">Made for your exact job.</h2>
            <p className="text-gray-400 mt-4">We didn't build a generic tool. We built one for the trades.</p>
          </div>
          {/* Tabs */}
          <div className="flex justify-center gap-3 mb-10">
            {(['Plumber', 'HVAC Tech', 'Electrician'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === t
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white border border-[#E8E5E0] text-gray-500 hover:border-orange-200 card-shadow'
                }`}
              >
                {tradeProblems[t].icon} {t}
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Your pain points:</div>
              <div className="space-y-3">
                {tradeProblems[activeTab].problems.map(p => (
                  <div key={p} className="flex items-start gap-3 bg-[#F9F8F6] border border-[#E8E5E0] rounded-2xl px-4 py-3.5">
                    <span className="text-orange-400 mt-0.5">→</span>
                    <span className="text-sm text-gray-600">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4">FLDWRK solves it:</div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                <div className="text-4xl mb-4">{tradeProblems[activeTab].icon}</div>
                <p className="text-gray-700 leading-relaxed">{tradeProblems[activeTab].solution}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">Everything you need. Nothing you don&apos;t.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f) => (
              <div key={f.name} className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-3xl p-8 group hover:-translate-y-1 transition-all card-shadow hover:card-shadow-hover`}>
                <div className="text-4xl mb-5">{f.icon}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{f.name}</div>
                <h3 className="font-black text-xl text-gray-900 mb-3">{f.tagline}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-t border-[#E8E5E0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">From the Field</p>
            <h2 className="text-4xl font-black text-gray-900">Tradespeople are done with the old way.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-[#F9F8F6] border border-[#E8E5E0] rounded-3xl p-7 card-shadow hover:card-shadow-hover hover:-translate-y-1 transition-all">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-base">{t.trade}</div>
                  <div>
                    <div className="font-bold text-sm text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Simple. Flat. No surprises.</h2>
          <p className="text-gray-400 mb-14">Founding members lock in 40% off forever. No credit card to join.</p>
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {[
              {
                name: 'Solo',
                price: '$49',
                founding: '$29',
                desc: 'The one-man operation',
                features: ['VoiceLog™ (unlimited)', 'QuickQuote™', 'Unlimited jobs', 'iOS + Android app', 'Email support'],
                cta: 'Start Solo',
              },
              {
                name: 'Crew',
                price: '$89',
                founding: '$53',
                desc: 'Growing crews up to 5 techs',
                features: ['Everything in Solo', 'Multi-tech dispatch', 'TradeIQ™ analytics', 'Customer portal', 'Priority support'],
                cta: 'Start Crew',
                featured: true,
              },
              {
                name: 'Shop',
                price: '$149',
                founding: '$89',
                desc: 'Established operations',
                features: ['Everything in Crew', 'TruckStock™ inventory', 'API access', 'Custom reporting', 'Dedicated support'],
                cta: 'Start Shop',
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-7 text-left relative ${plan.featured
                  ? 'bg-orange-500 text-white orange-glow'
                  : 'bg-white border border-[#E8E5E0] card-shadow'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.featured ? 'text-orange-100' : 'text-gray-400'}`}>{plan.name}</div>
                <div className="flex items-end gap-2 mb-1">
                  <span className={`text-4xl font-black ${plan.featured ? 'text-white' : 'text-gray-900'}`}>{plan.founding}</span>
                  <span className={`text-sm mb-1.5 line-through ${plan.featured ? 'text-orange-200' : 'text-gray-300'}`}>{plan.price}</span>
                  <span className={`text-sm mb-1.5 ${plan.featured ? 'text-orange-200' : 'text-gray-400'}`}>/mo</span>
                </div>
                <p className={`text-xs mb-6 ${plan.featured ? 'text-orange-100' : 'text-gray-400'}`}>{plan.desc}</p>
                <ul className="space-y-2 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className={`text-sm flex items-center gap-2 ${plan.featured ? 'text-orange-50' : 'text-gray-600'}`}>
                      <span className={`text-xs font-bold ${plan.featured ? 'text-orange-200' : 'text-orange-400'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.featured
                    ? 'bg-white text-orange-500 hover:bg-orange-50'
                    : 'bg-orange-500 text-white hover:bg-orange-400 shadow-md'
                  }`}
                >
                  {plan.cta} →
                </a>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm">Founding pricing locks in at launch. No card required today.</p>
        </div>
      </section>

      {/* ── COUNTDOWN ───────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-4">Launching June 2026</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4">The clock is ticking.</h2>
          <p className="text-gray-400 mb-12 max-w-lg mx-auto">
            We&apos;re heads-down building. Founding members get in first — and their 40% discount is locked forever.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            {[
              { label: 'Days', val: countdown.days },
              { label: 'Hours', val: countdown.hours },
              { label: 'Min', val: countdown.minutes },
              { label: 'Sec', val: countdown.seconds },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl w-20 h-20 justify-center gap-1">
                <span className="text-3xl font-black gradient-text tabular-nums">{pad(val)}</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all shadow-lg hover:shadow-xl"
          >
            Secure My Founding Spot →
          </a>
        </div>
      </section>

      {/* ── WAITLIST ────────────────────────────────────── */}
      <section id="waitlist" className="py-24 px-6 bg-[#F9F8F6]">
        <div className="max-w-xl mx-auto">
          {submitted ? (
            <div className="text-center">
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-4xl font-black mb-4 text-gray-900">You&apos;re on the list.</h2>
              <p className="text-gray-500 text-lg mb-8">
                You&apos;re one of our founding members. We&apos;ll reach out personally before launch.
              </p>
              <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6 card-shadow">
                <p className="text-sm text-gray-400 mb-4">Tell your crew about FLDWRK</p>
                <div className="flex gap-3 justify-center">
                  <a
                    href="https://twitter.com/intent/tweet?text=Just%20joined%20the%20FLDWRK%20waitlist%20%E2%80%94%20AI-native%20field%20service%20management%20built%20for%20the%20trades.%20No%20laptop%20required.%20fldwrk.ai"
                    target="_blank"
                    className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Share on X
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText('https://fldwrk.ai')}
                    className="bg-white border border-[#E8E5E0] text-gray-600 text-sm font-semibold px-5 py-2.5 rounded-xl hover:border-gray-300 transition-colors card-shadow"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Early Access</p>
                <h2 className="text-4xl font-black mb-4 text-gray-900">Get in before we launch.</h2>
                <p className="text-gray-500">
                  Founding members get 40% off forever, direct access to the product team, and help shape what we build.
                </p>
              </div>

              <div className="bg-white border border-[#E8E5E0] rounded-3xl p-8 card-shadow">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Work Email</label>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
                      })}
                      type="email"
                      placeholder="you@yourcompany.com"
                      className="w-full bg-[#F9F8F6] border border-[#E8E5E0] rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What&apos;s your trade?</label>
                    <select
                      {...register('trade', { required: true })}
                      className="w-full bg-[#F9F8F6] border border-[#E8E5E0] rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
                    >
                      <option value="">Select your trade</option>
                      {trades.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Team size</label>
                    <div className="grid grid-cols-2 gap-2">
                      {teamSizes.map(size => (
                        <label
                          key={size}
                          className="flex items-center gap-3 bg-[#F9F8F6] border border-[#E8E5E0] rounded-xl px-4 py-3 cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50"
                        >
                          <input {...register('teamSize', { required: true })} type="radio" value={size} className="accent-orange-500" />
                          <span className="text-sm font-medium text-gray-600">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-300 text-white font-black py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? 'Locking in your spot...' : 'Secure My Founding Spot →'}
                  </button>

                  <p className="text-center text-xs text-gray-300">
                    No spam ever. No credit card. Just early access + 40% off at launch.
                  </p>
                </form>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-[#E8E5E0] bg-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center font-black text-xs text-white">F</div>
              <span className="font-black text-base text-gray-900">FLDWRK</span>
              <span className="text-gray-300 text-xs font-mono">.ai</span>
            </div>
            <p className="text-gray-400 text-sm text-center">
              The AI-native field service platform. Built exclusively for the trades.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-gray-700 transition-colors">Terms</a>
              <a href="mailto:hello@fldwrk.ai" className="hover:text-gray-700 transition-colors">Contact</a>
            </div>
          </div>
          <div className="text-center text-xs text-gray-300 border-t border-[#E8E5E0] pt-6">
            © 2026 FLDWRK, Inc. · Built for the trades. · Launching June 2026.
          </div>
        </div>
      </footer>

    </main>
  )
}
