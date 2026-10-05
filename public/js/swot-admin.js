window.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- Get URL params ---
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");   // e.g. 24IPD071
    const type = params.get("type");   // e.g. swot

    console.log("🔍 Params:", { userId, type });

    // --- Check if valid for SWOT page ---
    if (!userId || type?.toLowerCase() !== "swot") {
      console.warn("⚠️ Missing or invalid parameters in URL.");
      return;
    }

    // --- Get stored token ---
    // const token = localStorage.getItem("token");
    // if (!token) {
    //   console.error("❌ No authentication token found.");
    //   return;
    // }

    // --- Fetch SWOT data from backend ---
    const res = await fetch(`/admin/swots?userId=${encodeURIComponent(userId)}`, {
      method: "GET"
    });

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      console.error("❌ Failed to fetch SWOT data. Status:", res.status);
      return;
    }

    const data = await res.json();
    console.log("✅ Fetched SWOT data:", data);

    // Check valid data
    if (!Array.isArray(data) || data.length === 0 || !data[0].SwotAnalyses) {
      console.warn("⚠️ No SWOT data found for this team.");
      return;
    }

    // --- Extract SWOT info ---
    const swot = data[0].SwotAnalyses;
    const teamName = data[0].team_name || "";

    // --- Populate fields directly ---
    document.getElementById("teamName").innerText = teamName || "";
    document.getElementById("idea").innerText = swot[0].selected_idea || "";
    document.getElementById("strengths").innerText = swot[0].strengths || "";
    document.getElementById("weakness").innerText = swot[0].weakness || "";
    document.getElementById("opportunities").innerText = swot[0].opportunities || "";
    document.getElementById("threats").innerText = swot[0].threats || "";

    // --- Make all fields readonly for mentor ---
    ["teamName", "idea", "strengths", "weakness", "opportunities", "threats"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.contentEditable = "false";
        el.style.background = "#f5f5f5";
      }
    });

    // --- Hide submit button ---
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.style.display = "none";

    // --- Display date (readonly) ---
    const dateEl = document.getElementById("date");
    if (dateEl) {
      dateEl.innerText = new Date().toLocaleDateString("en-GB");
      dateEl.style.pointerEvents = "none";
      dateEl.style.background = "#f5f5f5";
    }

  } catch (err) {
    console.error("💥 Error fetching SWOT:", err);
  }
});
