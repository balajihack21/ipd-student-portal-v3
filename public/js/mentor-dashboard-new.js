// Mentor Dashboard - Timeline-gated review/workbook sections

// Stages configuration matching admin.js timeline stages
const STAGES_CONFIG = [
  { key: "sem1_review1", sectionId: "sem1Review1Section", batch: "25ipd" },
  { key: "sem1_review2", sectionId: "sem1Review2Section", batch: "25ipd" },
  { key: "sem1_workbook", sectionId: "sem1WorkbookSection", batch: "25ipd" },
  { key: "sem2_review1", sectionId: "sem2Review1Section", batch: "25ipd" },
  { key: "sem2_review2", sectionId: "sem2Review2Section", batch: "25ipd" },
  { key: "sem2_workbook", sectionId: "sem2WorkbookSection", batch: "25ipd" },
  { key: "sem3_review1", sectionId: "sem3Review1Section", batch: "24ipd" },
  { key: "sem3_review2", sectionId: "sem3Review2Section", batch: "24ipd" },
  { key: "sem3_workbook", sectionId: "sem3WorkbookSection", batch: "24ipd" },
  { key: "sem4_review1", sectionId: "sem4Review1Section", batch: "24ipd" },
  { key: "sem4_review2", sectionId: "sem4Review2Section", batch: "24ipd" },
  { key: "sem4_workbook", sectionId: "sem4WorkbookSection", batch: "24ipd" }
];

async function loadMentorDetails() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/mentor/details', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const mentor = res.data;
    document.getElementById('mentorName').textContent = `${mentor.title}${mentor.name}`;
    document.getElementById('mentorEmail').textContent = mentor.email;

    if (mentor.is_coordinator) {
      // Fetch batch timelines to gate sections
      await checkTimelineAndToggleSections(token);
    } else {
      // Non-coordinators: hide all review/workbook sections
      STAGES_CONFIG.forEach(stage => {
        const section = document.getElementById(stage.sectionId);
        if (section) section.classList.add("hidden");
      });
    }

  } catch (err) {
    console.error('Failed to load mentor details:', err);
  }
}

async function checkTimelineAndToggleSections(token) {
  try {
    const res = await axios.get('/api/deadlines', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const timelineMap = {};
    if (res.data && res.data.timelines) {
      res.data.timelines.forEach(t => {
        // For mentors, timelines include batch; for students, stage key maps directly
        timelineMap[t.stage] = t;
      });
    }

    const now = new Date();

    // Check each stage and toggle visibility
    STAGES_CONFIG.forEach(stageConfig => {
      const section = document.getElementById(stageConfig.sectionId);
      if (!section) return;

      const timeline = timelineMap[stageConfig.key];

      if (timeline && timeline.start && timeline.deadline) {
        const startDate = new Date(timeline.start);
        const deadlineDate = new Date(timeline.deadline);

        // Show only if current time is between start and deadline
        if (now >= startDate && now <= deadlineDate) {
          section.classList.remove("hidden");

          // Load teams for this section
          loadTeamsForStage(stageConfig);
        } else {
          section.classList.add("hidden");
        }
      } else {
        // No timeline set → hide section
        section.classList.add("hidden");
      }
    });

  } catch (err) {
    console.error("Error checking timelines:", err);
    // On error, hide all sections
    STAGES_CONFIG.forEach(stage => {
      const section = document.getElementById(stage.sectionId);
      if (section) section.classList.add("hidden");
    });
  }
}

function loadTeamsForStage(stageConfig) {
  const { key, sectionId, batch } = stageConfig;

  // Determine if it's a review or workbook stage
  if (key.includes("review")) {
    loadReviewTeams(key, batch);
  } else if (key.includes("workbook")) {
    loadWorkbookTeams(key, batch);
  }
}

// Load teams dropdown for review stages
async function loadReviewTeams(stageKey, batch) {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.get(`/mentor/teams/dropdown?batch=${batch}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const selectId = `${stageKey.replace(/_/g, "")}TeamSelect`;
    const select = document.getElementById(selectId);

    if (!select) return;

    select.innerHTML = '<option value="">-- Select Team --</option>';

    res.data.forEach(team => {
      const opt = document.createElement("option");
      opt.value = team.UserId;
      opt.textContent = team.team_name;
      select.appendChild(opt);
    });

    // Attach change handler
    select.addEventListener("change", async (e) => {
      const teamId = e.target.value;
      if (!teamId) return;

      const studentsRes = await axios.get(`/mentor/teams/${teamId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      renderStudentTable(stageKey, studentsRes.data);
    });

  } catch (err) {
    console.error(`Error loading teams for ${stageKey}:`, err);
  }
}

// Render student table for marks entry
function renderStudentTable(stageKey, students) {
  const containerId = `${stageKey.replace(/_/g, "")}TableContainer`;
  const container = document.getElementById(containerId);

  if (!container) return;

  const fieldKey = stageKey; // e.g., sem1_review1

  let html = `
    <table class="w-full border">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2">Name</th>
          <th class="border p-2">Register No</th>
          <th class="border p-2">Dept</th>
          <th class="border p-2">Section</th>
          <th class="border p-2">Marks</th>
        </tr>
      </thead>
      <tbody>
  `;

  students.forEach(s => {
    html += `
      <tr>
        <td class="border p-2">${s.student_name}</td>
        <td class="border p-2">${s.register_no}</td>
        <td class="border p-2">${s.dept}</td>
        <td class="border p-2">${s.section}</td>
        <td class="border p-2">
          <input type="number" class="mark-input-${stageKey} border p-1 w-full"
            data-id="${s.id}" value="${s[fieldKey] ?? ""}" />
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  const submitBtnId = `submit${stageKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Marks`;
  const submitBtn = document.getElementById(submitBtnId);
  if (submitBtn) submitBtn.classList.remove("hidden");
}

// Load teams dropdown for workbook stages
async function loadWorkbookTeams(stageKey, batch) {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.get(`/mentor/teams/dropdown?batch=${batch}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const selectId = `${stageKey.replace(/_/g, "")}TeamSelect`;
    const select = document.getElementById(selectId);

    if (!select) return;

    select.innerHTML = '<option value="">-- Select Team --</option>';

    res.data.forEach(team => {
      const opt = document.createElement("option");
      opt.value = team.UserId;
      opt.textContent = team.team_name;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error(`Error loading workbook teams for ${stageKey}:`, err);
  }
}

// Submit handlers for all review stages
STAGES_CONFIG.filter(s => s.key.includes("review")).forEach(stageConfig => {
  const { key } = stageConfig;
  const btnId = `submit${key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Marks`;

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const selectId = `${key.replace(/_/g, "")}TeamSelect`;
      const teamId = document.getElementById(selectId)?.value;

      if (!teamId) {
        alert("Please select a team first");
        return;
      }

      const inputs = document.querySelectorAll(`.mark-input-${key}`);
      const students = Array.from(inputs).map(input => ({
        id: input.dataset.id,
        mark: input.value ? Number(input.value) : null
      }));

      const token = localStorage.getItem("token");
      const endpoint = `/mentor/teams/${teamId}/${key.replace(/_/g, "-")}`;

      try {
        await axios.post(endpoint, { students }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        alert(`${key} marks submitted successfully!`);
      } catch (err) {
        console.error(`Error submitting ${key}:`, err);
        alert(`Failed to submit ${key} marks`);
      }
    });
  });
});

// Submit handlers for all workbook stages
STAGES_CONFIG.filter(s => s.key.includes("workbook")).forEach(stageConfig => {
  const { key } = stageConfig;
  const semester = key.replace("_workbook", ""); // e.g., "sem1"
  const btnId = `submit${semester.charAt(0).toUpperCase() + semester.slice(1)}Workbook`;

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const selectId = `${key.replace(/_/g, "")}TeamSelect`;
      const inputId = `${key.replace(/_/g, "")}ScoreInput`;

      const teamId = document.getElementById(selectId)?.value;
      const score = document.getElementById(inputId)?.value;

      if (!teamId || !score) {
        alert("Please select a team and enter a score");
        return;
      }

      const token = localStorage.getItem("token");

      try {
        await axios.post("/mentor/workbook-score", {
          teamId,
          score: Number(score),
          semester
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        alert(`${semester} workbook score submitted successfully!`);
        document.getElementById(inputId).value = "";
      } catch (err) {
        console.error(`Error submitting ${key}:`, err);
        alert(`Failed to submit ${key} score`);
      }
    });
  });
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", loadMentorDetails);
} else {
  loadMentorDetails();
}

// ===== TEAM LOADING + ASSIGNED TEAMS (merged from old mentor-dashboard.js) =====

function groupUploadsBySemester(uploads) {
  const groups = {};
  uploads.forEach(u => {
    const sem = Math.ceil(u.week_number / 5);
    const label = `Semester ${sem}`;
    if (!groups[label]) groups[label] = [];
    groups[label].push(u);
  });
  return Object.entries(groups).map(([label, uploads]) => ({ label, uploads }));
}

async function loadTeams(batch = "25ipd") {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/mentor/my-teams?batch=${batch}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teamList = document.getElementById('teamList');
    if (!teamList) return;
    teamList.innerHTML = '';

    if (!res.data || res.data.length === 0) {
      teamList.innerHTML = '<p class="text-gray-500 italic">No assigned teams for this batch.</p>';
      return;
    }

    res.data.forEach(team => {
      const teamCard = document.createElement('div');
      teamCard.className = 'border rounded-lg p-4 shadow-sm';

      let uploadsContent = '';
      if (team.TeamUploads && team.TeamUploads.length > 0) {
        const renderUpload = (upload) => {
          const alreadyReviewed = !!upload.review_comment;
          const stat = upload.status;
          let viewLink = "";
          if (upload.file_url) {
            viewLink = `<a href="${upload.file_url}" class="text-blue-600 underline" target="_blank">Download</a>`;
          } else {
            viewLink = `<a href="#" class="text-blue-600 underline view-link" data-week="${upload.week_number}">View</a>`;
          }
          const weekTitles = { 1: "Problem Statement", 2: "Affinity Diagram", 3: "Idea Generation", 4: "SWOT Analysis", 5: "Value Proposition", 17: "BMC Template", 18: "Prototype Planning" };
          return `<div class="p-3 border rounded bg-gray-50">
            <p class="font-semibold">${weekTitles[upload.week_number] || `Week ${upload.week_number}`}</p>
            ${viewLink}
            ${alreadyReviewed && stat === "REVIEWED" ? `<textarea class="w-full mt-2 p-2 border rounded bg-gray-100" readonly>${upload.review_comment}</textarea><button class="mt-2 bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed" disabled>Reviewed</button>`
            : `<textarea placeholder="Write your review..." class="w-full mt-2 p-2 border rounded review-text"></textarea><button class="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 submitReviewBtn" data-team-id="${team.id}" data-upload-id="${upload.id}">Submit Review</button>`}
          </div>`;
        };
        uploadsContent = groupUploadsBySemester(team.TeamUploads).map(group => `
          <div class="portal-upload-group"><h4 class="portal-group-title">${group.label}</h4><div class="space-y-3">${group.uploads.map(renderUpload).join('')}</div></div>
        `).join('');
      } else {
        let fallbackLinks = '';
        if (team.IdeaSelection) fallbackLinks += `<a href="#" class="text-blue-600 underline view-link" data-week="3">View Idea Generation</a>`;
        if (team.SwotAnalysis) fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-week="4">View SWOT Analysis</a>`;
        if (team.ValueProposition) fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-week="5">View Value Proposition</a>`;
        if (!fallbackLinks) fallbackLinks = `<span class="text-gray-600 italic">No data available yet</span>`;
        uploadsContent = `<div class="p-3 border rounded bg-gray-50">${fallbackLinks}</div>`;
      }

      teamCard.innerHTML = `
        <div class="flex justify-between items-center">
          <div><h3 class="font-bold text-lg">${team.team_name}</h3><p class="text-gray-600">Leader: ${team.email}</p></div>
          <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 toggleUploads">View Uploads</button>
        </div>
        <div class="uploads mt-4 hidden space-y-3">${uploadsContent}</div>
      `;
      teamList.appendChild(teamCard);
    });
  } catch (err) {
    console.error('Failed to load teams:', err);
  }
}

const batchSelect = document.getElementById("batchSelect");
if (batchSelect) {
  batchSelect.addEventListener("change", () => {
    loadTeams(batchSelect.value);
  });
}

// Load default batch on init
loadTeams("25ipd");
