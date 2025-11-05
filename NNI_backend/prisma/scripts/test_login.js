(async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.user+1@example.com",
        password: "StrongPass1",
      }),
    });
    const data = await res.json();
    console.log("status", res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("fetch error", err);
    process.exit(1);
  }
})();
