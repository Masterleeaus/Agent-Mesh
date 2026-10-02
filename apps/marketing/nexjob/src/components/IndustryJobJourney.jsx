import SectionLabel from './SectionLabel'

export default function IndustryJobJourney({ industryName, jobJourney, examples }) {
  if (!jobJourney?.length && !examples?.length) return null

  return (
    <section className="py-24 px-6 border-y border-nx-border">
      <div className="max-w-7xl mx-auto">
        <SectionLabel>{industryName} workflow</SectionLabel>
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
          From first enquiry to a useful work history.
        </h2>
        <p className="text-nx-muted max-w-3xl mb-10 leading-relaxed">
          Keep the customer conversation, agreed scope, field work and job record connected through the service cycle.
        </p>

        {jobJourney?.length > 0 && (
          <ol className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {jobJourney.map(([title, description], index) => (
              <li key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-6">
                <p className="text-xs font-bold text-nx-purple-light mb-3">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-nx-muted leading-relaxed">{description}</p>
              </li>
            ))}
          </ol>
        )}

        {examples?.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-bold mb-5">Example {industryName.toLowerCase()} work</h3>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {examples.map(([title, description]) => (
                <article key={title} className="bg-nx-surface/70 border border-nx-border rounded-xl p-5">
                  <h4 className="font-semibold mb-2">{title}</h4>
                  <p className="text-sm text-nx-muted leading-relaxed">{description}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
