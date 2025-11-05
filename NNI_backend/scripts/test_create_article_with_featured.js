(async () => {
  const fetch = global.fetch || (await import("node-fetch")).default;
  const base = "http://localhost:5000";

  try {
    console.log("Logging in...");
    const r = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@nni.news", password: "Admin123" }),
    });
    const j = await r.json();
    if (!r.ok) {
      console.error("Login failed", r.status, j);
      process.exit(1);
    }
    const token = j.token;
    console.log("Got token, creating article with featuredImage...");

    const inlineImg =
      "https://i.ibb.co/Z699thkc/original-725220a9858acb4f0569569ea0afdc83.png";
    const article = {
      title: "E2E Test Featured " + Date.now(),
      content: `<p>Test content with inline image <img src="${inlineImg}"></p>`,
      excerpt: "test-excerpt",
      status: "PUBLISHED",
      featuredImage: inlineImg,
    };

    const c = await fetch(`${base}/api/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(article),
    });
    const cj = await c.json();
    console.log("Create response status", c.status, cj);

    console.log("Fetching published articles...");
    const g = await fetch(`${base}/api/articles?status=PUBLISHED`);
    const gj = await g.json();
    console.log("Published count:", gj.count);
    const found = gj.data.find(
      (a) => a.title && a.title.startsWith("E2E Test Featured")
    );
    console.log("Found created article in list?", !!found);
    if (found) console.log("Stored featuredImage:", found.featuredImage);
  } catch (err) {
    console.error("Error", err);
    process.exit(1);
  }
})();
