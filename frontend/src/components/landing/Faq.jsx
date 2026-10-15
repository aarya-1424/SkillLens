import { FAQ } from '../../data/landing';

export default function Faq() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <div className="text-center mb-10">
        <p className="eyebrow mb-4">Questions</p>
        <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05]">Things people <em className="text-brand">ask first.</em></h2>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="shrink-0 w-7 h-7 rounded-full border border-line flex items-center justify-center text-ink-soft transition group-open:rotate-45 group-open:bg-ink group-open:text-white group-open:border-ink" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-ink-soft leading-relaxed pr-10">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
