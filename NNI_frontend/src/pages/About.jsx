import React, { useEffect, useState } from "react";
import * as api from "../utils/api";
import "./About.css";

function Hero({ hero }) {
  return (
    <section className="about-hero card">
      <div
        className="about-hero-inner about-hero-structured"
        style={{
          backgroundImage: hero?.image ? `url(${hero.image})` : "none",
        }}
      >
        <div className="about-hero-text">
          <h1>{hero?.title || "NNI News"}</h1>
          {hero?.subtitle ? (
            <p className="lead">{hero.subtitle}</p>
          ) : (
            <p className="muted">Deep Analysis. Verified Truth.</p>
          )}
          {hero?.meta && <p className="about-cta">{hero.meta}</p>}
        </div>
      </div>
    </section>
  );
}

function Mission({ text }) {
  return (
    <div className="about-vision card">
      <h3>Our Mission</h3>
      <p>{text}</p>
    </div>
  );
}

function StatsGrid({ stats = [] }) {
  return (
    <div className="about-stats">
      {stats.map((s, i) => (
        <div key={i} className="stat-card card">
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function TeamGrid({ members = [] }) {
  return (
    <div className="about-team">
      {members.map((m, i) => (
        <div key={i} className="team-card card">
          <img
            src={m.photo || "https://via.placeholder.com/240x240"}
            alt={m.name}
          />
          <div className="team-meta">
            <div className="team-name">{m.name}</div>
            <div className="team-role muted">{m.role}</div>
            <div className="team-bio">{m.bio}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ValuesList({ values = [] }) {
  return (
    <div className="about-values card">
      <h3>Our Core Values</h3>
      <ul>
        {values.map((v, i) => (
          <li key={i}>
            <strong>{v.title || v}</strong>
            {v.description && <div className="muted">{v.description}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FounderCard({ founder }) {
  if (!founder) return null;
  return (
    <div className="about-founder card">
      <h3>Meet the Founder</h3>
      <div className="founder-row">
        <img
          src={founder.photo || "https://via.placeholder.com/240?text=Founder"}
          alt={founder.name}
        />
        <div className="founder-meta">
          <div className="founder-name">{founder.name}</div>
          <div className="founder-role muted">{founder.role}</div>
          <p className="founder-bio">{founder.bio}</p>
        </div>
      </div>
    </div>
  );
}

function JourneyTimeline({ items = [] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="about-journey card">
      <h3>Our Journey So Far</h3>
      <ol>
        {items.map((it, i) => (
          <li key={i}>
            <strong>{it.date}</strong>
            <div className="muted">{it.text}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function About() {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Prefer the structured About endpoint backed by the About table
        try {
          const r = await api.getAbout();
          if (mounted && r && r.data && r.data.type === "about") {
            // normalize to previous 'article' shape expected elsewhere
            setArticle({
              id: `about-${Date.now()}`,
              title: "About NNI",
              content: JSON.stringify(r.data),
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          // ignore and fallback to article fetch
        }

        const res = await api.getArticleBySlug("about-nni");
        if (mounted) setArticle(res);
      } catch (e) {
        if (mounted) setError(e.message || "Not found");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  // If article.content is structured JSON produced by the CMS AboutEditor,
  // parse it and render section components. Otherwise fall back to HTML.
  let structured = null;
  try {
    if (article && article.content) {
      const parsed = JSON.parse(article.content);
      if (parsed && parsed.type === "about" && parsed.sections) {
        structured = parsed.sections;
      }
    }
  } catch (e) {
    structured = null;
  }

  // Fallback static content when no article content available
  const fallback = {
    hero: {
      title: "NNI News",
      subtitle: "Deep Analysis. Verified Truth. Uganda’s Digital Future.",
      image: "https://via.placeholder.com/1200x480?text=NNI+News",
      meta: "Launched: November 3, 2025 • Founder & Editor-in-Chief: Knowledge Benjamin • Kampala, Uganda",
    },
    mission: `NNI News is more than a news site — it is a truth-mapping platform. In an era where AI-generated content floods the internet, we are building a living graph of verified facts, linking every claim to its original source, tracking contradictions, updates, and context in real time. We don’t just report headlines. We connect, analyze, and verify. Our goal: to become the trusted hub for fact-based insight in Uganda and East Africa — a place where readers come not just to know what happened, but why it matters, what it means for the future, and where the truth stands.`,
    why: `Most news platforms stop at the surface. They deliver breaking alerts. They repeat press releases. They chase clicks. We do the opposite. At NNI, every article is a deep dive: connecting today’s events to historical patterns; examining economic, social, and cultural implications; linking global stories to Ugandan lives; backed by verifiable sources — always cited, always accessible. We bridge the gap between information overload and meaningful understanding.`,
    coreValues: [
      {
        title: "Truth with Verifiable Sources",
        description: "Every fact is linked. No claim stands alone.",
      },
      {
        title: "Transparency",
        description: "We show our process. You see the evidence.",
      },
      {
        title: "Honesty",
        description: "No sensationalism. No clickbait. No distortion.",
      },
      {
        title: "Inclusiveness",
        description:
          "Voices from West Nile to Kampala, from rural farmers to tech innovators — all belong here.",
      },
      {
        title: "Well-Rounded Analysis",
        description:
          "We explore every angle. One-sided stories don’t survive here.",
      },
    ],
    stats: [
      { label: "Launched", value: "Nov 3, 2025" },
      { label: "Initial articles", value: "7+" },
    ],
    team: [
      {
        name: "Knowledge Benjamin",
        role: "Founder & Editor-in-Chief",
        photo: "https://via.placeholder.com/240?text=KB",
        bio: `I am Knowledge Benjamin, a Computer Science student at Makerere University, born in Adjumani District (West Nile), raised in Jinja, and now building a media future in Kampala. I run NNI solo — from research and writing to publishing and strategy. I’ve managed social media for Jinja Full Gospel Church and took over the @droidconug X account for a day during Droidcon Uganda 2025. I have no formal journalism degree. But I have something stronger: A hunger for truth. A coder’s eye for systems. A Ugandan’s ear for context. I saw the rise of AI slop and asked: “Who will verify the verifiers?” NNI is my answer.`,
      },
    ],
    journey: [
      { date: "Nov 3, 2025", text: "Launched with 7 in-depth articles" },
      { date: "Jan 2026 (goal)", text: "250+ articles" },
      {
        date: "Mar 2026 (goal)",
        text: "Full legal registration with UCC and MCU; Team of 4; Dedicated office in Kampala",
      },
    ],
    contact: {
      cta: "Follow updates, send tips, or join the conversation: X: @knowledgebenj",
      email: "contact@nni.news",
    },
    notes: `All content is commentary and analysis based on publicly available, verifiable sources. Facts are linked. Corrections are published promptly and transparently.`,
  };

  const sections = structured || fallback;

  // Ensure founder appears in the team list for rendering. If a separate
  // `founder` section exists, merge it into the team array (front).
  const combinedTeam = (sections.team || []).slice();
  if (sections.founder && sections.founder.name) {
    const exists = combinedTeam.find(
      (m) =>
        String(m.name || "").trim() ===
        String(sections.founder.name || "").trim()
    );
    if (!exists) {
      combinedTeam.unshift({
        name: sections.founder.name,
        role: sections.founder.role || "",
        photo: sections.founder.photo || null,
        bio: sections.founder.bio || "",
      });
    } else {
      // if exists but missing photo or bio, enrich it
      for (let i = 0; i < combinedTeam.length; i++) {
        if (
          String(combinedTeam[i].name || "").trim() ===
          String(sections.founder.name || "").trim()
        ) {
          combinedTeam[i] = {
            name: sections.founder.name,
            role: sections.founder.role || combinedTeam[i].role,
            photo: combinedTeam[i].photo || sections.founder.photo || null,
            bio: combinedTeam[i].bio || sections.founder.bio || "",
          };
          break;
        }
      }
    }
  }

  return (
    <main className="about-page container">
      <Hero hero={sections.hero} />

      <section className="about-content card">
        <div className="about-body">
          {structured || !article ? (
            <>
              <Mission text={sections.mission} />
              <div className="about-why card">
                <h3>Why NNI Exists</h3>
                <p>{sections.why}</p>
              </div>

              <ValuesList values={sections.coreValues} />

              <StatsGrid stats={sections.stats} />

              <FounderCard
                founder={sections.founder || combinedTeam[0] || null}
              />

              <JourneyTimeline items={sections.journey} />

              <h3 style={{ marginTop: "1rem" }}>Meet the Team</h3>
              <TeamGrid members={combinedTeam} />

              <div className="about-contact card">
                <h4>Contact & Press</h4>
                <p>{sections.contact?.cta}</p>
                {sections.contact?.email && (
                  <p>
                    <a href={`mailto:${sections.contact.email}`}>
                      {sections.contact.email}
                    </a>
                  </p>
                )}
              </div>

              {sections.notes && (
                <div
                  className="about-notes muted"
                  style={{ marginTop: ".75rem" }}
                >
                  {sections.notes}
                </div>
              )}
            </>
          ) : (
            // legacy HTML content fallback
            <div dangerouslySetInnerHTML={{ __html: article?.content || "" }} />
          )}
        </div>
      </section>
    </main>
  );
}
