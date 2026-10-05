window.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- Get URL params ---
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");
    const type = params.get("type");

    if (!userId || type.toLowerCase() !== "idea") {
      console.warn("⚠️ Missing or invalid parameters in URL.");
      return;
    }

    // --- Get token ---
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No authentication token found.");
      return;
    }

    // --- Fetch Idea Selection data from backend ---
    const res = await fetch(`/mentor/ideas?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("❌ Failed to fetch idea data. Status:", res.status);
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || !data[0].IdeaSelections) {
      console.warn("⚠️ No idea selection data found for this team.");
      return;
    }

    const ideaData = data[0].IdeaSelections[0]; // get first selection entry

    // --- Fill team name & selected idea ---
    const teamInput = document.querySelector('input[placeholder="Enter team name"]');
    const selectedIdeaInput = document.querySelector('input[placeholder="Enter selected idea"]');
    if (teamInput) teamInput.value = ideaData.team_name || "";
    if (selectedIdeaInput) selectedIdeaInput.value = ideaData.selected_idea || "";

    // --- Fill list of ideas ---
    const ideaInputs = document.querySelectorAll(".idea-input");
    ideaData.list_of_ideas.forEach((idea, index) => {
      if (ideaInputs[index]) ideaInputs[index].value = idea;

      // Fill idea scores if available
      const scores = ideaData.ideas_scores?.[idea];
      if (scores) {
        Object.entries(scores).forEach(([crit, val]) => {
          const select = document.querySelector(`select[name="idea${index + 1}_${crit}"]`);
          if (select) select.value = val;
        });
      }
    });

    // --- Fill Group Average Scores ---
const avgRows = Array.from(document.querySelectorAll("tr.c6"))
  .filter(tr => /Average\s*Score/i.test(tr.textContent));

  console.log(avgRows)

if (avgRows.length >= 2) {
  const group1Inputs = avgRows[0].querySelectorAll("input.c0[type='number']");
  const group2Inputs = avgRows[1].querySelectorAll("input.c0[type='number']");

  console.log("✅ Found Avg Rows:", { group1Inputs, group2Inputs });

  if (ideaData.ideas_avg_score) {
    const ideas = ideaData.list_of_ideas;

    ideas.forEach((idea, index) => {
      const avgObj = ideaData.ideas_avg_score[idea];
      if (avgObj) {
        if (group1Inputs[index]) group1Inputs[index].value = avgObj.group1 ?? "";
        if (group2Inputs[index]) group2Inputs[index].value = avgObj.group2 ?? "";
      }
    });
  } else {
    console.warn("⚠️ No ideas_avg_score field found in API data.");
  }
} else {
  console.warn("⚠️ Average Score rows not found in HTML.");
}

    // --- Disable all inputs (view-only) ---
    document.querySelectorAll("input, select, textarea, button").forEach((el) => {
      el.disabled = true;
      el.style.background = "#f5f5f5";
      el.style.pointerEvents = "none";
    });

    // --- Hide submit button ---
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.style.display = "none";

  } catch (err) {
    console.error("💥 Error loading mentor idea data:", err);
  }
});
