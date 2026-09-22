export default function SectionLabel({ children }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-nx-purple-light uppercase tracking-widest mb-3">
      <span className="w-5 h-0.5 bg-nx-purple rounded-full" />
      {children}
    </div>
  )
}
