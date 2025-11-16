/**
 * Seed the About table with structured content for 'about-nni'.
 * This script overwrites any existing About record with slug 'about-nni'.
 *
 * Usage:
 *   node prisma/scripts/seed_about.js
 */

const { PrismaClient } = require("@prisma/client");

async function run() {
  const prisma = new PrismaClient();
  const slug = "about-nni";

  const sections = {
    hero: {
      title: "About NNI News",
      subtitle: "Deep Analysis. Verified Truth. Uganda’s Digital Future.",
      image: null,
      meta: "Launched: November 3, 2025\nFounder & Editor-in-Chief: Knowledge Benjamin\nBase: Kampala, Uganda",
    },
    mission: `NNI News is more than a news site — it is a truth-mapping platform. In an era where AI-generated content floods the internet, we are building a living graph of verified facts, linking every claim to its original source, tracking contradictions, updates, and context in real time.\n\nWe don’t just report headlines.\nWe connect, analyze, and verify.\nOur goal: to become the trusted hub for fact-based insight in Uganda and East Africa — a place where readers come not just to know what happened, but why it matters, what it means for the future, and where the truth stands.`,
    why: `Most news platforms stop at the surface.\nThey deliver breaking alerts. They repeat press releases. They chase clicks.\nWe do the opposite.\nAt NNI, every article is a deep dive:\n\n- Connecting today’s events to historical patterns\n- Examining economic, social, and cultural implications\n- Linking global stories to Ugandan lives\n- Backed by verifiable sources — always cited, always accessible\n\nWe bridge the gap between information overload and meaningful understanding.`,
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
      { label: "Current articles", value: "7+" },
    ],
    founder: {
      name: "Knowledge Benjamin",
      role: "Founder & Editor-in-Chief",
      photo: "https://via.placeholder.com/240?text=KB",
      bio: `I am Knowledge Benjamin, a Computer Science student at Makerere University, born in Adjumani District (West Nile), raised in Jinja, and now building a media future in Kampala.\n\nI run NNI solo — from research and writing to publishing and strategy. I’ve managed social media for Jinja Full Gospel Church and took over the @droidconug X account for a day during Droidcon Uganda 2025. I have no formal journalism degree. But I have something stronger: A hunger for truth. A coder’s eye for systems. A Ugandan’s ear for context. I saw the rise of AI slop and asked: “Who will verify the verifiers?” NNI is my answer.`,
    },
    journey: [
      { date: "Nov 3, 2025", text: "Launched with 7 in-depth articles" },
      { date: "Current", text: "7+ analytical pieces and growing" },
      { date: "By Jan 2026", text: "250+ articles" },
      {
        date: "By Mar 2026",
        text: "Full legal registration with UCC and MCU; Team of 4 dedicated staff; Dedicated office in Kampala",
      },
    ],
    team: [
      {
        name: "Knowledge Benjamin",
        role: "Founder & Editor-in-Chief",
        photo: "https://via.placeholder.com/240?text=KB",
        bio: "I run NNI solo — from research and writing to publishing and strategy.",
      },
    ],
    contact: {
      cta: "Follow updates, send tips, or join the conversation: X: @knowledgebenj",
      email: "contact@nni.news",
    },
    notes:
      "All content is commentary and analysis based on publicly available, verifiable sources. Facts are linked. Corrections are published promptly and transparently.",
  };

  try {
    // Upsert About record (overwrite)
    const existing = await prisma.about.findUnique({ where: { slug } });
    if (existing) {
      const updated = await prisma.about.update({
        where: { id: existing.id },
        data: { sections },
      });
      console.log("Updated About record:", updated.id);
    } else {
      const created = await prisma.about.create({ data: { slug, sections } });
      console.log("Created About record:", created.id);
    }
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Failed to seed About table:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
