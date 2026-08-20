"use client";

const skillsStats = [
  {
    title: "Capability score",
    value: "83%",
    detail:
      "Current core strengths remain healthy and well-positioned for continued growth.",
  },
  {
    title: "Skill spread",
    value: "6 areas",
    detail:
      "The plan covers several meaningful capability layers, not just one narrow focus.",
  },
  {
    title: "Application rate",
    value: "Strong",
    detail:
      "Learning is translating into practical action more often than not.",
  },
  {
    title: "Improvement pace",
    value: "Steady",
    detail:
      "There is enough sustained momentum for meaningful progress without overshooting capacity.",
  },
];

const actions = [
  "Review which skill areas deliver the most leverage for work, life, and long-term goals.",
  "Protect a recurring practice loop so potential learning turns into visible output and confidence.",
  "Identify the next capability gap before it becomes a bottleneck in personal or professional growth.",
  "Keep the skill roadmap realistic and narrow enough to translate effort into measurable progress.",
];

export default function SkillsPage() {
  return (
    <main className="page-shell feature-page">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark" aria-hidden="true">
            TM
          </div>
          <div>
            <p className="eyebrow">PRIVATE BETA / INDIA-FIRST</p>
            <h1>ThriveMatrix</h1>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="/">Overview</a>
          <a href="/goals">Goals</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/transactions">Transactions</a>
          <a href="/skills">Skills</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">SKILLS</p>
          <h2>
            Keep capability growth practical, aligned, and easy to improve over
            time.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Skills summary">
          <div>
            <span className="meta-label">Capability</span>
            <strong>Strong</strong>
          </div>
          <div>
            <span className="meta-label">Momentum</span>
            <strong>Steady</strong>
          </div>
          <div>
            <span className="meta-label">Priority</span>
            <strong>High</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">READINESS</p>
              <h3>Skills overview</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {skillsStats.map((item) => (
              <div className="insight-box" key={item.title}>
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">ACTIONS</p>
              <h3>Next priorities</h3>
            </div>
          </div>

          <ul className="activity-list">
            {actions.map((step) => (
              <li key={step}>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
