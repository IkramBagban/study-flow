import Image from "next/image";
import {
  Brain,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  LineChart,
  Network,
  NotebookPen,
  Sparkles,
  Timer,
} from "lucide-react";

const highlights = [
  {
    title: "Cognitive model, not a course list",
    description:
      "MemoryMesh builds a living map of what you know, what you misunderstand, and what you are ready to learn next.",
    icon: Network,
  },
  {
    title: "Active recall by default",
    description:
      "Prediction-first prompts and short answer checks turn every lesson into a retrieval workout.",
    icon: Brain,
  },
  {
    title: "Spaced repetition that feels natural",
    description:
      "FSRS scheduling revisits concepts right before they fade, so progress actually sticks.",
    icon: CalendarClock,
  },
];

const pillars = [
  {
    title: "Schema formation",
    description:
      "Concepts are taught as connected systems, not isolated facts — so learners build mental structures.",
    icon: LineChart,
  },
  {
    title: "Desirable difficulty",
    description:
      "Adaptive challenge keeps learners in the productive struggle zone without overwhelming them.",
    icon: Timer,
  },
  {
    title: "Prediction before explanation",
    description:
      "We ask for a guess first, then make the explanation land deeper through contrast.",
    icon: Lightbulb,
  },
  {
    title: "Micro-learning units",
    description:
      "One concept at a time with fast feedback loops to reduce cognitive load.",
    icon: NotebookPen,
  },
];

const steps = [
  {
    title: "Coarse self-assessment",
    description:
      "Learners quickly rate their familiarity, reducing uncertainty before diagnostics begin.",
  },
  {
    title: "Adaptive truth extraction",
    description:
      "Short recall prompts probe only where needed, uncovering exact misconceptions.",
  },
  {
    title: "Personalized learning path",
    description:
      "The engine chooses the right next concept, format, and recall schedule.",
  },
];

export default function WaitlistPage() {
  return (
    <div className="hero-gradient min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-10 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">MemoryMesh</p>
            <p className="text-xs text-slate-500">Learning Intelligence System</p>
          </div>
        </div>
        <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          Request early access
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Open early cohort
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              A learning system that continuously adapts to how your brain actually learns.
            </h1>
            <p className="text-lg text-slate-600">
              MemoryMesh isn&apos;t a course platform or a chatbot. It is a cognitive engine that
              models what you know, diagnoses gaps, and decides the right next learning move in
              real time — so every session feels purposeful.
            </p>
            <form className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-indigo-100/80 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-indigo-200 transition focus:ring-4"
              />
              <button
                type="submit"
                className="rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-400"
              >
                Join the waitlist
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Early product shaping access
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Personalized onboarding audit
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Private research drop updates
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 hidden h-36 w-36 rounded-full bg-indigo-200/40 blur-3xl lg:block" />
            <div className="absolute right-4 top-32 hidden h-24 w-24 rounded-full bg-emerald-200/40 blur-3xl lg:block" />
            <div className="glow-card relative overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Learning Intelligence Snapshot
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-slate-900">
                    Your cognitive map
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  Live
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                See how MemoryMesh connects the concepts you know, surfaces what you forgot, and
                chooses the next best step.
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                <Image
                  src="/mesh-hero.svg"
                  alt="Abstract neural mesh visualization"
                  width={640}
                  height={460}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-100 bg-white p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Icon className="h-4 w-4 text-indigo-500" />
                        {item.title}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-[32px] border border-slate-200 bg-white/90 p-10 shadow-lg">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                Why MemoryMesh
              </p>
              <h2 className="font-display text-3xl font-semibold text-slate-900">
                Designed for durable understanding, not content consumption.
              </h2>
              <p className="max-w-2xl text-slate-600">
                Learning today is linear and forgetful. MemoryMesh builds a persistent model of
                each learner so it can adaptively decide what to teach, how to teach it, and when
                to bring it back.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                  Dynamic
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  The learning path is rebuilt after every interaction.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Evidence-based
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Grounded in neuroscience, retrieval practice, and spaced repetition.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 section-divider" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                    <Icon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-900">
                      {pillar.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{pillar.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              How it works
            </p>
            <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900">
              The learning decision engine in three steps.
            </h2>
            <div className="mt-6 space-y-6">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-indigo-600 p-8 text-white shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
              Diagnostic intelligence
            </p>
            <h2 className="font-display mt-3 text-2xl font-semibold">
              The system decides: teach, test, or recall — every step.
            </h2>
            <p className="mt-4 text-sm text-indigo-100">
              MemoryMesh uses active recall, short open-ended prompts, and recognition checks to
              extract truth without wasting time. The engine constantly recalibrates difficulty,
              explanation style, and spacing.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-indigo-500/40 p-4">
                <p className="text-sm font-semibold">Adaptive quizzes</p>
                <p className="mt-2 text-xs text-indigo-100">
                  Precision tests that refine the knowledge graph after every answer.
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-500/40 p-4">
                <p className="text-sm font-semibold">Active recall flashcards</p>
                <p className="mt-2 text-xs text-indigo-100">
                  Conceptual prompts scheduled with FSRS for durable recall.
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-500/40 p-4">
                <p className="text-sm font-semibold">Micro-lessons</p>
                <p className="mt-2 text-xs text-indigo-100">
                  Short, focused explanations that land after prediction.
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-500/40 p-4">
                <p className="text-sm font-semibold">Concept analytics</p>
                <p className="mt-2 text-xs text-indigo-100">
                  Know exactly what is solid, shaky, or forgotten.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Join the waitlist
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-slate-900">
            Build the learning system you always wanted.
          </h2>
          <p className="mt-3 text-slate-600">
            We&apos;re inviting a small group of founders, educators, and learners to shape the
            first release. Leave your email and we&apos;ll follow up with next steps.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <input
              type="email"
              placeholder="you@domain.com"
              className="w-full max-w-sm rounded-2xl border border-slate-200 px-5 py-3 text-sm text-slate-700 outline-none ring-indigo-200 transition focus:ring-4"
            />
            <button className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800">
              Reserve my spot
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            No spam. Just thoughtful updates as we build MemoryMesh.
          </p>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>MemoryMesh © 2025</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span>Built on learning science.</span>
          <span className="text-slate-300">•</span>
          <span>Designed for long-term retention.</span>
        </div>
      </footer>
    </div>
  );
}
