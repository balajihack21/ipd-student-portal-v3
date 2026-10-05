// Function to collect data and send to backend
async function submitSwot() {
    try {
        const data = {
            teamName: document.getElementById("teamName").innerText.trim(),
            selectedIdea: document.getElementById("idea").innerText.trim(),
            strengths: document.getElementById("strengths").innerText.trim(),
            weakness: document.getElementById("weakness").innerText.trim(),
            opportunities: document.getElementById("opportunities").innerText.trim(),
            threats: document.getElementById("threats").innerText.trim()
        };

        // Basic validation
        if (!data.teamName || !data.selectedIdea) {
            alert("Team Name and Selected Idea are required");
            return;
        }

        const token = localStorage.getItem("token");

        const res = await fetch("/api/swot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error("Failed to store SWOT analysis");

        const result = await res.json();
        alert("✅ SWOT Analysis saved successfully!");

        // Optionally clear fields after submission
        fields.forEach(id => document.getElementById(id).innerText = "");

    } catch (err) {
        console.error(err);
        alert("❌ Error saving SWOT Analysis: " + err.message);
    }
}

// Bind to submit button
document.getElementById("submitBtn").addEventListener("click", submitSwot);