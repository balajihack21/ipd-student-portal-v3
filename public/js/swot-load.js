window.addEventListener("message", (e) => {
  if (e.data && e.data.type === "loadSwotData") {
    const d = e.data;
    if (d.team_name) document.getElementById("teamName").innerText = d.team_name;
    if (d.selected_idea) document.getElementById("idea").innerText = d.selected_idea;
    if (d.strengths) document.getElementById("strengths").innerText = d.strengths;
    if (d.weakness) document.getElementById("weakness").innerText = d.weakness;
    if (d.opportunities) document.getElementById("opportunities").innerText = d.opportunities;
    if (d.threats) document.getElementById("threats").innerText = d.threats;
    if (d.date) document.getElementById("date").innerText = new Date(d.createdAt || d.updatedAt || Date.now()).toLocaleDateString();
  }
});
