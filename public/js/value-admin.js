window.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- Get URL params ---
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");
    const type = params.get("type");

    console.log("🔍 Params:", { userId, type });

    if (!userId || type.toLowerCase() !== "value") {
      console.warn("⚠️ Missing or invalid parameters in URL.");
      return;
    }

    // --- Get token ---
    // const token = localStorage.getItem("token");
    // if (!token) {
    //   console.error("❌ No authentication token found.");
    //   return;
    // }

    // --- Fetch mentor’s student's Value Proposition data ---
    const res = await fetch(`/admin/value-propositions?userId=${encodeURIComponent(userId)}`, {
      method: "GET"
    });

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      console.error("❌ Failed to fetch Value Proposition data. Status:", res.status);
      return;
    }

    const data = await res.json();
    console.log("✅ Fetched Value Proposition data:", data);

    if (!Array.isArray(data) || data.length === 0 || !data[0].ValuePropositions) {
      console.warn("⚠️ No Value Proposition data found for this team.");
      return;
    }

    const value = data[0].ValuePropositions;

    // --- Populate fields ---
    document.getElementById('ta1').value = value[0].gain_creators || "";
    document.getElementById('ta2').value = value[0].gains || "";
    document.getElementById('ta3').value = value[0].products_and_services || "";
    document.getElementById('ta4').value = value[0].customer_jobs || "";
    document.getElementById('ta5').value = value[0].pain_relievers || "";
    document.getElementById('ta6').value = value[0].pains || "";
    document.getElementById('ta7').value = value[0].value_proposition || "";
    document.getElementById('ta8').value = value[0].customer_segment || "";

    // --- Make all fields readonly ---
    for (let i = 1; i <= 8; i++) {
      const el = document.getElementById(`ta${i}`);
      if (el) {
        el.readOnly = true;
        el.style.background = "#f5f5f5";
      }
    }

    // --- Hide submit button ---
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.style.display = "none";

  } catch (err) {
    console.error("💥 Error fetching Value Proposition:", err);
  }
});
