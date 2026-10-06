const addMentorForm = document.getElementById("addMentorForm");
addMentorForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById("addMentorMessage");
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  message.textContent = "Saving mentor...";
  message.className = "mt-3 text-sm text-gray-600";

  try {
    await axios.post('/admin/mentors', {
      title: document.getElementById("newMentorTitle").value,
      name: document.getElementById("newMentorName").value.trim(),
      email: document.getElementById("newMentorEmail").value.trim(),
      department: document.getElementById("newMentorDepartment").value.trim(),
      designation: document.getElementById("newMentorDesignation").value.trim(),
      password: document.getElementById("newMentorPassword").value,
    });

    form.reset();
    message.textContent = "Mentor saved. Refresh the team assignment list to use the new mentor.";
    message.className = "mt-3 text-sm text-green-700";

    try {
      await fetchMentorsAndTeams();
      await fetchTeams();
      renderReassignMentorTable();
      renderMentorDirectory();
      message.textContent = "Mentor added and available for team assignment.";
    } catch (refreshError) {
      console.error("Mentor saved, but assignment lists could not refresh:", refreshError);
    }
  } catch (err) {
    message.textContent = err.response?.data?.error || "Unable to add mentor.";
    message.className = "mt-3 text-sm text-red-700";
  } finally {
    submitButton.disabled = false;
  }
});

const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

// ======================= BATCH FILTER =======================
let currentBatch = "all"; // "all" | "24IPD" | "25IPD"

function matchesBatch(userId) {
  if (currentBatch === "all") return true;
  return (userId || "").toString().toUpperCase().startsWith(currentBatch);
}

function refreshAllTabsForBatch() {
  // Teams tab
  if (currentTeams.length) {
    filteredTeams = currentTeams.filter(t => matchesBatch(t.UserId));
    currentPage = 1;
    renderTeams(filteredTeams);

    // Refresh assignment results independently from the Project Teams table.
    currentReassignPage = 1;
    applyReassignFilters();
  }

  // History tab
  if (historyData.length) {
    applyHistoryFilters();
  }

  // Review tab
  if (reviewData.length) {
    applyReviewFilters();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const batchFilterEl = document.getElementById("batchFilter");
  if (batchFilterEl) {
    batchFilterEl.addEventListener("change", (e) => {
      currentBatch = e.target.value;
      refreshAllTabsForBatch();
    });
  }

  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  }
  document.querySelectorAll(".admin-nav .tab").forEach((tab) => {
    tab.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  });
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    // Reset all tabs and contents
    tabs.forEach(t => t.classList.remove("active", "border-b-2", "border-blue-500"));
    contents.forEach(c => c.classList.add("hidden"));

    // Activate selected tab
    tab.classList.add("active", "border-b-2", "border-blue-500");
    document.getElementById(tab.dataset.tab).classList.remove("hidden");

    // 🔹 Assign Tab
    if (tab.dataset.tab === "assignTab") {
      renderReassignMentorTable();
    }

    // 🔹 History Tab
    if (tab.dataset.tab === "historyTab") {
      fetchAllTeamHistories();
    }

    // 🔹 Timeline Tab
    if (tab.dataset.tab === "timelineTab") {
      loadAllTimelineDates(); // 👈 new function to fetch timeline dates
    }

    if (tab.dataset.tab === "reviewTab") {
      fetchReviewScores();
    }

  });
});

// ======================= REVIEW SCORES TAB =======================

let reviewData = [];
let reviewFiltered = [];
let reviewCurrentPage = 1;
let reviewRowsPerPage = 10;
let currentReviewSemester = "sem2";

function getReviewSemesterConfig(semester = currentReviewSemester) {
  const map = {
    sem1: { label: "Semester 1", batch: "25IPD", review1: "sem1_review1", review2: "sem1_review2", workbook: "sem1_workbook" },
    sem2: { label: "Semester 2", batch: "25IPD", review1: "sem2_review1", review2: "sem2_review2", workbook: "sem2_workbook" },
    sem3: { label: "Semester 3", batch: "24IPD", review1: "sem3_review1", review2: "sem3_review2", workbook: "sem3_workbook" },
    sem4: { label: "Semester 4", batch: "24IPD", review1: "sem4_review1", review2: "sem4_review2", workbook: "sem4_workbook" },
  };

  return map[semester] || map.sem2;
}

function syncReviewBatchToSemester() {
  const semesterSelect = document.getElementById("reviewSemesterFilter");
  const batchFilterEl = document.getElementById("batchFilter");
  if (!semesterSelect || !batchFilterEl) return;

  const semester = semesterSelect.value || currentReviewSemester;
  const { batch } = getReviewSemesterConfig(semester);
  currentBatch = batch;
  batchFilterEl.value = batch;
  updateReviewBatchIndicator();
}

function updateReviewBatchIndicator() {
  const indicator = document.getElementById("reviewBatchIndicator");
  if (!indicator) return;

  const semesterSelect = document.getElementById("reviewSemesterFilter") || { value: currentReviewSemester };
  const { label, batch } = getReviewSemesterConfig(semesterSelect.value || currentReviewSemester);
  indicator.textContent = `Showing: ${label} | Batch: ${batch}`;
}

async function fetchReviewScores() {
  try {
    const semesterFilter = document.getElementById("reviewSemesterFilter");
    const selectedSemester = semesterFilter ? semesterFilter.value : currentReviewSemester;
    currentReviewSemester = selectedSemester;

    const res = await axios.get("/admin/all-review-scores", {
      params: { semester: selectedSemester }
    });

    reviewData = Array.isArray(res.data) ? res.data : [];
    reviewFiltered = [...reviewData];

    // Assign "Role" properly (Team Leader / Student 1, 2, 3, ...)
    const groupedByTeam = {};
    reviewData.forEach((r) => {
      if (!groupedByTeam[r.teamId]) groupedByTeam[r.teamId] = [];
      groupedByTeam[r.teamId].push(r);
    });

    Object.keys(groupedByTeam).forEach((teamId) => {
      const teamMembers = groupedByTeam[teamId];
      let studentCounter = 1;
      teamMembers.forEach((m) => {
        if (m.role === "Leader" || m.is_leader) {
          m.role = "Team Leader";
        } else {
          m.role = `Student ${studentCounter++}`;
        }
      });
    });

    // Handle rows per page change
    const select = document.getElementById("reviewRowsPerPageSelect");
    if (select) {
      reviewRowsPerPage = Number(select.value);
      select.onchange = (e) => {
        reviewRowsPerPage = Number(e.target.value);
        reviewCurrentPage = 1;
        renderReviewTable();
      };
    }

    const semesterSelect = document.getElementById("reviewSemesterFilter");
    if (semesterSelect) {
      semesterSelect.value = selectedSemester;
      semesterSelect.onchange = () => {
        currentReviewSemester = semesterSelect.value;
        syncReviewBatchToSemester();
        fetchReviewScores();
      };
    }

    syncReviewBatchToSemester();
    updateReviewBatchIndicator();
    attachReviewFilters();
    applyReviewFilters();
  } catch (err) {
    console.error("Error fetching review scores:", err);
    document.getElementById("reviewTable").innerHTML =
      `<p class="text-red-600 p-4">Failed to load review scores.</p>`;
  }
}

function renderReviewTable() {
  const container = document.getElementById("reviewTable");
  if (!container) return;

  const { label } = getReviewSemesterConfig();
  const start = (reviewCurrentPage - 1) * reviewRowsPerPage;
  const paginated = reviewFiltered.slice(start, start + reviewRowsPerPage);

  if (!paginated.length) {
    container.innerHTML = `<p class="text-gray-500 text-center p-4">No records found.</p>`;
    renderReviewPagination();
    return;
  }

  const rows = paginated
    .map((r) => {
      const r1 = r.review1score ?? 0;
      const r2 = r.review2score ?? 0;
      const wb = r.workbook_score ?? 0;

      const reviewTotal = r1 + r2;
      const total = r.total_score ?? r1 + r2 + wb;

      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-2">${r.teamId || ""}</td>
          <td class="p-2 font-semibold">${r.team_name || ""}</td>
          <td class="p-2">${r.name || ""}</td>
          <td class="p-2">${r.section || ""}</td>
          <td class="p-2">${r.register_no || ""}</td>
          <td class="p-2">${r.dept || ""}</td>
          <td class="p-2 font-medium text-blue-700">${r.role || ""}</td>
          <td class="p-2 text-center">${r1}</td>
          <td class="p-2 text-center">${r2}</td>
          <td class="p-2 text-center font-semibold">${reviewTotal}</td>
          <td class="p-2 text-center">${wb}</td>
          <td class="p-2 font-bold text-green-700 text-center">${total}</td>
        </tr>`;
    })
    .join("");

  container.innerHTML = `
    <table class="min-w-full text-sm border-collapse border border-gray-200">
      <thead class="bg-gray-100 text-gray-700">
        <tr>
          <th class="p-2">Team ID</th>
          <th class="p-2">Team Name</th>
          <th class="p-2">Student Name</th>
          <th class="p-2">Section</th>
          <th class="p-2">Register No</th>
          <th class="p-2">Dept</th>
          <th class="p-2">Role</th>
          <th class="p-2">${label} Review 1</th>
          <th class="p-2">${label} Review 2</th>
          <th class="p-2">Review Total</th>
          <th class="p-2">${label} Workbook</th>
          <th class="p-2">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  renderReviewPagination();
}

function renderReviewPagination() {
  const controls = document.getElementById("reviewPaginationControls");
  if (!controls) return;
  controls.innerHTML = "";

  const totalPages = Math.ceil(reviewFiltered.length / reviewRowsPerPage) || 1;

  const makeBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = `px-3 py-1 rounded border ${active ? "bg-blue-600 text-white" : "bg-white"
      } ${disabled ? "opacity-50" : "hover:bg-blue-100"}`;
    btn.disabled = disabled;
    if (!disabled)
      btn.onclick = () => {
        reviewCurrentPage = page;
        renderReviewTable();
      };
    return btn;
  };

  controls.appendChild(
    makeBtn("Prev", reviewCurrentPage - 1, reviewCurrentPage === 1)
  );
  for (let i = 1; i <= totalPages; i++) {
    if (i <= 3 || i > totalPages - 3 || Math.abs(i - reviewCurrentPage) <= 1) {
      controls.appendChild(makeBtn(i, i, false, i === reviewCurrentPage));
    } else if (i === 4 || i === totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      controls.appendChild(span);
    }
  }
  controls.appendChild(
    makeBtn("Next", reviewCurrentPage + 1, reviewCurrentPage === totalPages)
  );
}

function attachReviewFilters() {
  const general = document.getElementById("reviewGeneralSearch");
  const id = document.getElementById("reviewFilterTeamId");
  const team = document.getElementById("reviewFilterTeamName");
  const studentName = document.getElementById("reviewFilterStudentName");
  const dept = document.getElementById("reviewFilterDept");
  const section = document.getElementById("reviewFilterSection");

  [general, id, team, studentName, dept, section].forEach(
    (el) => el && el.addEventListener("input", applyReviewFilters)
  );

  const exportBtn = document.getElementById("exportReviewExcel");
  if (exportBtn) exportBtn.onclick = exportReviewExcel;
}

function applyReviewFilters() {
  const generalVal =
    (document.getElementById("reviewGeneralSearch")?.value || "").toLowerCase();
  const idVal =
    (document.getElementById("reviewFilterTeamId")?.value || "").toLowerCase();
  const teamVal =
    (document.getElementById("reviewFilterTeamName")?.value || "").toLowerCase();
  const studentVal =
    (document.getElementById("reviewFilterStudentName")?.value || "").toLowerCase();
  const deptVal =
    (document.getElementById("reviewFilterDept")?.value || "").toLowerCase();
  const secVal =
    (document.getElementById("reviewFilterSection")?.value || "").toLowerCase();

  reviewFiltered = reviewData.filter((r) => {
    return (
      (!generalVal ||
        JSON.stringify(r).toLowerCase().includes(generalVal)) &&
      (!idVal || (r.teamId || "").toLowerCase().includes(idVal)) &&
      (!teamVal || (r.team_name || "").toLowerCase().includes(teamVal)) &&
      (!studentVal || (r.name || "").toLowerCase().includes(studentVal)) &&
      (!deptVal || (r.dept || "").toLowerCase().includes(deptVal)) &&
      (!secVal || (r.section || "").toLowerCase().includes(secVal)) &&
      matchesBatch(r.teamId)
    );
  });

  // ✅ When filtering by dept or section, sort by register_no ascending
  if (deptVal || secVal) {
    reviewFiltered.sort((a, b) => (a.register_no || 0) - (b.register_no || 0));
  }

  reviewCurrentPage = 1;
  renderReviewTable();
}

function exportReviewExcel() {
  if (!reviewFiltered.length) return alert("No data to export.");

  const rows = [
    [
      "S.No",
      "Team ID",
      "Team Name",
      "Student Name",
      "Section",
      "Register No",
      "Dept",
      "Role",
      "Review 1 (30)",
      "Review 2 (30)",
      "Review Total (60)",
      "Workbook (40)",
      "Total (100)",
    ],
  ];

  reviewFiltered.forEach((r, i) => {
    const r1 = r.review1score ?? 0;
    const r2 = r.review2score ?? 0;
    const wb = r.workbook_score ?? 0;
    const reviewTotal = r1 + r2;
    const total = r.total_score ?? r1 + r2 + wb;

    rows.push([
      i + 1,
      r.teamId,
      r.team_name,
      r.name,
      r.section,
      r.register_no,
      r.dept,
      r.role,
      `${r1}`,
      `${r2}`,
      `${reviewTotal}`,
      `${wb}`,
      `${total}`,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Review Scores");
  XLSX.writeFile(wb, "review_scores.xlsx");
}





let allMentors = [];

let currentTeams = [];
let filteredTeams = [];
let filteredAssignmentTeams = [];
let filteredHistory = [];

async function fetchTeams() {
  const res = await axios.get("/admin/teams");
  currentTeams = res.data;
  filteredTeams = currentTeams.filter(t => matchesBatch(t.UserId));
  renderTeams(filteredTeams);
  applyReassignFilters();
  attachFilters()


}

let currentPage = 1;
const itemsPerPage = 10;
let historyData = [];  // will store all team histories
let historyCurrentPage = 1;
let historyRowsPerPage = 10;


async function fetchAllTeamHistories() {
  try {
    const res = await axios.get(`/admin/team-history`); // should return all
    historyData = res.data.teams; // store for pagination
    filteredHistory = historyData.filter(t => matchesBatch(t.UserId));
    console.log(res.data)
    document.getElementById('uploadedTeamsCount').textContent =
      `Uploaded Teams: ${res.data.uploadedCount}`;
    document.getElementById('notUploadedTeamsCount').textContent =
      `Not Uploaded Teams: ${res.data.notUploadedCount}`;
    historyCurrentPage = 1; // reset to first page
    renderHistoryTableFiltered(filteredHistory);
    attachHistoryFilters();
    document.getElementById("uploadStatusFilter").addEventListener("change", applyHistoryFilters);


  } catch (err) {
    console.error(err);
    document.getElementById("historyContent").innerHTML = `<p class="text-red-500">Failed to load team histories.</p>`;
  }
}

function attachHistoryFilters() {
  const teamIdInput = document.getElementById("historyFilterTeamId");
  const teamNameInput = document.getElementById("historyFilterTeamName");
  const statusSelect = document.getElementById("historyFilterStatus");
  const mentorInput = document.getElementById("historyFilterMentorName");
  const leaderDeptInput = document.getElementById("historyFilterLeaderDept");

  [teamIdInput, teamNameInput, statusSelect, mentorInput, leaderDeptInput].forEach(el => {
    el.addEventListener("input", applyHistoryFilters);
    if (el.tagName === "SELECT") {
      el.addEventListener("change", applyHistoryFilters);
    }
  });
}

function applyHistoryFilters(resetPage = true) {
  const idVal = document.getElementById("historyFilterTeamId").value.toLowerCase();
  const nameVal = document.getElementById("historyFilterTeamName").value.toLowerCase();
  const statusVal = document.getElementById("historyFilterStatus").value.toLowerCase();
  const mentorVal = document.getElementById("historyFilterMentorName").value.toLowerCase();
  const leaderDeptVal = document.getElementById("historyFilterLeaderDept").value.toLowerCase();
  const uploadStatusFilter = document.getElementById("uploadStatusFilter").value;

  filteredHistory = historyData.filter(team => {
    const matchesUploadStatus =
      uploadStatusFilter === "all" ||
      (uploadStatusFilter === "uploaded" && team.TeamUploads && team.TeamUploads.length > 0) ||
      (uploadStatusFilter === "not_uploaded" && (!team.TeamUploads || team.TeamUploads.length === 0));

    const matchesId = team.UserId.toLowerCase().includes(idVal);
    const matchesName = team.team_name.toLowerCase().includes(nameVal);
    const matchesMentor = mentorVal === "" || (team.mentor?.name || "").toLowerCase().includes(mentorVal);
    const matchesLeaderDept = leaderDeptVal === "" || (team.Students.find(s => s.is_leader)?.dept || "").toLowerCase().includes(leaderDeptVal);
    const matchesStatus =
      statusVal === "" ||
      team.TeamUploads.some(
        u =>
          (u.status || "").toLowerCase() === statusVal &&
          (!u.review_comment || u.review_comment.trim() === "")
      );


    return matchesUploadStatus && matchesId && matchesName && matchesMentor && matchesLeaderDept && matchesStatus && matchesBatch(team.UserId);
  });

  // ✅ Only reset page when a new filter is applied
  if (resetPage) {
    historyCurrentPage = 1;
  }

  renderHistoryTableFiltered(filteredHistory);
}


function historyUploadsHtml(team) {
  // Build list of uploads to display (REVIEWED + those with comments)
  const reviewedUploads = team.TeamUploads
    ? team.TeamUploads.filter(u =>
      u.status === "REVIEWED" || (u.review_comment && u.review_comment.trim() !== "")
    )
    : [];

  if (reviewedUploads.length === 0) {
    let fallbackLinks = '';
    if (team.IdeaSelection) {
      fallbackLinks += `<a href="#" class="text-blue-600 underline view-link" data-week="3" data-type="idea" data-id="${team.UserId}">View Idea Generation</a>`;
    }
    if (team.SwotAnalysis) {
      fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-week="4" data-type="swot" data-id="${team.UserId}">View SWOT Analysis</a>`;
    }
    if (team.ValueProposition) {
      fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-week="5" data-type="value" data-id="${team.UserId}">View Value Proposition</a>`;
    }
    if (!fallbackLinks) {
      fallbackLinks = `<span class="text-gray-600 italic">No data available yet</span>`;
    }
    return `<div class="ml-4">${fallbackLinks}</div>`;
  }

  const groups = groupUploadsBySemester(reviewedUploads);

  const renderUploadItem = (u) => {
    const daysPending = Math.floor(
      (new Date() - new Date(u.uploaded_at)) / (1000 * 60 * 60 * 24)
    );
    const isPendingTooLong = u.status !== 'REVIEWED' && daysPending > 2;

    let viewLink = "";
    if (u.file_url) {
      viewLink = `<a href="${u.file_url}" class="text-blue-600 underline" target="_blank">${getUploadTitle(u.week_number)}</a>`;
    } else {
      let dataType = "";
      if (u.week_number == 3) dataType = "idea";
      else if (u.week_number == 4) dataType = "swot";
      else if (u.week_number == 5) dataType = "value";
      viewLink = `<a href="#" class="text-blue-600 underline view-link" data-week="${u.week_number}" data-type="${dataType}" data-id="${team.UserId}">${getUploadTitle(u.week_number)}</a>`;
    }

    return `
      <div class="p-3 border rounded bg-gray-50 mb-2">
        ${viewLink}
        <span class="text-xs text-gray-500 ml-1">(${new Date(u.uploaded_at).toLocaleString()})</span>
        ${isPendingTooLong
        ? `<span class="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Pending > 2 days</span>`
        : ''}
        <div class="mt-1 ml-1 text-sm text-gray-700">
          <div>
            <strong>Status:</strong>
            <span class="font-medium ${u.status === 'REVIEWED'
        ? 'text-green-600'
        : u.status === 'SUBMITTED'
          ? 'text-red-600'
          : 'text-yellow-600'
      }">${u.status || 'Pending'}</span>
          </div>
          <div><strong>Comment:</strong> ${u.review_comment || 'No comment'}</div>
        </div>
        <div class="mt-2 ml-1">
          <textarea
            id="admin-comment-${u.id}"
            rows="2"
            class="w-full p-2 border rounded text-sm"
            placeholder="Write admin comment..."
          >${localStorage.getItem("adminComment-" + u.id) || ""}</textarea>
          <button
            class="mt-1 bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 admin-comment-btn"
            data-upload-id="${u.id}"
          >
            Send Comment
          </button>
          ${localStorage.getItem("adminComment-" + u.id)
        ? `<span class="ml-2 text-green-600 text-xs font-medium">(Reviewed by Admin)</span>`
        : ''}
        </div>
      </div>`;
  };

  return groups.map(group => `
    <div class="portal-upload-group mb-3 border rounded">
      <button type="button" data-sem-btn
        class="w-full flex justify-between items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-left font-semibold text-gray-800">
        <span>${group.label}</span>
        <span class="text-sm text-gray-600">▸</span>
      </button>
      <div class="p-3 hidden space-y-2">
        ${group.uploads.map(renderUploadItem).join('')}
      </div>
    </div>
  `).join('');
}

function historyDetailsHtml(team) {
  return `
    <div class="history-details-grid">
      <section>
        <h3 class="history-details-title">Team</h3>
        <p><strong>Email:</strong> ${team.email}</p>
        <p><strong>Mentor:</strong> ${team.mentor?.name || 'None'} (${team.mentor?.department || 'N/A'})</p>
        <p><strong>Mentor Email:</strong> ${team.mentor?.email || 'None'}</p>
      </section>

      <section>
        <h3 class="history-details-title">Team Members</h3>
        <ul class="space-y-1 list-disc list-inside text-gray-600 text-sm">
          ${team.Students.map(s =>
    `<li>${s.student_name} (${s.register_no}) - ${s.dept} ${s.section} ${s.is_leader ? "<span class='text-blue-600 font-medium'>(Leader)</span>" : ""}</li>`
  ).join('')}
        </ul>
      </section>

      <section>
        <h3 class="history-details-title">Problem Statement &amp; Selected Idea</h3>
        <p><strong>Problem Statement:</strong> ${team.ProblemStatements[0]?.problem_description || 'Not submitted yet'}</p>
        <p><strong>Selected Idea:</strong> ${team.ProblemStatements[0]?.selected_idea || 'Not selected yet'}</p>
      </section>

      <section class="history-details-uploads">
        <h3 class="history-details-title">Uploads</h3>
        ${historyUploadsHtml(team)}
      </section>
    </div>`;
}

// render filtered instead of all
function getTeamCategory(team) {
  const uploads = team.TeamUploads || [];
  const weekNumbers = uploads.map(u => Number(u.week_number)).filter(n => !isNaN(n));

  const softwareWeeks = [12, 13, 14, 15, 16]; // DB Schema, HLD, Tech Stack, User Flow, Mock Up
  const hardwareWeeks = [7, 8, 9, 10, 11]; // Product Dimensions, Performance, BOM, 2D, 3D

  const hasSoftware = weekNumbers.some(w => softwareWeeks.includes(w));
  const hasHardware = weekNumbers.some(w => hardwareWeeks.includes(w));

  if (hasHardware && hasSoftware) return "Hardware/Software";
  if (hasHardware) return "Hardware";
  if (hasSoftware) return "Software";
  return "-";
}

function renderHistoryTableFiltered(filteredTeams) {
  const start = (historyCurrentPage - 1) * historyRowsPerPage;
  const end = start + historyRowsPerPage;
  const paginatedTeams = filteredTeams.slice(start, end);

  const rows = paginatedTeams.map(team => {
    const leader = team.Students.find(s => s.is_leader);
    const uploads = team.TeamUploads || [];
    const reviewed = uploads.filter(u => u.status === "REVIEWED").length;
    const lastUploadedAt = uploads.reduce((latest, u) => {
      const at = new Date(u.uploaded_at);
      return !latest || at > latest ? at : latest;
    }, null);

    return `
      <tr>
        <td>${team.UserId}</td>
        <td class="font-semibold">${team.team_name}</td>
        <td>
          ${leader?.student_name || '-'}
          <div class="history-cell-sub">${leader?.dept || ''} ${leader?.section || ''}</div>
        </td>
        <td>
          ${team.mentor?.name || 'Unassigned'}
          <div class="history-cell-sub">${team.mentor?.department || 'N/A'}</div>
        </td>
        <td class="text-center">${team.Students.length}</td>
        <td>
          ${uploads.length
        ? `<span class="history-badge ${reviewed === uploads.length ? 'is-success' : 'is-warning'}">${reviewed}/${uploads.length} reviewed</span>`
        : `<span class="history-badge is-muted">No uploads</span>`}
        </td>
        <td>${lastUploadedAt ? lastUploadedAt.toLocaleDateString() : '-'}</td>
        <td>
          <span class="history-badge ${team.isLocked ? 'is-danger' : 'is-success'}">${team.isLocked ? 'Locked' : 'Open'}</span>
        </td>
        <td>${getTeamCategory(team)}</td>
        <td class="whitespace-nowrap">
          <button class="history-toggle admin-btn admin-btn-ghost" data-team-id="${team.UserId}">Details</button>
          ${team.isLocked
        ? `<button class="unlock-btn bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 ml-1" data-team-id="${team.UserId}">Unlock</button>`
        : `<button class="lock-btn bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700 ml-1" data-team-id="${team.UserId}">Lock</button>`}
        </td>
      </tr>
      <tr id="historyDetails-${team.UserId}" class="history-details hidden">
        <td colspan="10">${historyDetailsHtml(team)}</td>
      </tr>`;
  }).join('');

  document.getElementById("historyContent").innerHTML = paginatedTeams.length
    ? `<div class="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Team ID</th>
              <th>Team Name</th>
              <th>Team Leader</th>
              <th>Mentor</th>
              <th>Members</th>
              <th>Uploads</th>
              <th>Last Upload</th>
              <th>State</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    : `<div class="admin-card text-center text-gray-500">No teams match the current filters.</div>`;

  renderHistoryPaginationControlsFiltered(filteredTeams.length);

  document.querySelectorAll(".history-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = document.getElementById(`historyDetails-${btn.dataset.teamId}`);
      const expanded = row.classList.toggle("hidden");
      btn.textContent = expanded ? "Details" : "Hide";
    });
  });

  // 🔒 Lock / Unlock handlers
  document.querySelectorAll(".lock-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const teamId = e.target.dataset.teamId;
      await toggleLock(teamId, true);
    });
  });

  document.querySelectorAll(".unlock-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const teamId = e.target.dataset.teamId;
      await toggleLock(teamId, false);
    });
  });

  // 👁️ View link handlers (mentor modal logic)
  document.querySelectorAll(".view-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const dataType = link.getAttribute("data-type");
      const teamId = link.getAttribute("data-id");

      if (dataType === "swot") {
        document.getElementById("swotModal").classList.remove("hidden");
        document.getElementById("swotIframe").src = `swot-admin.html?id=${teamId}&type=swot`;
      } else if (dataType === "idea") {
        document.getElementById("ideaModal").classList.remove("hidden");
        document.getElementById("ideaIframe").src = `idea-admin.html?id=${teamId}&type=idea`;
      } else if (dataType === "value") {
        document.getElementById("valueModal").classList.remove("hidden");
        document.getElementById("valueIframe").src = `value-admin.html?id=${teamId}&type=value`;
      }
    });
  });
}

// 🔐 Lock/unlock API
async function toggleLock(teamId, lock) {
  try {
    const token = localStorage.getItem("token");
    await axios.post(`/admin/teams/${teamId}/${lock ? "lock" : "unlock"}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(`Team ${teamId} ${lock ? "locked" : "unlocked"} successfully`);
  } catch (err) {
    console.error("Error updating lock state:", err);
    alert("Failed to update lock state");
  }
}

// Bulk lock/unlock by batch
async function bulkLockBatch(lock) {
  try {
    const token = localStorage.getItem("token");
    await axios.post(`/admin/teams/batch/${lock ? 'lock' : 'unlock'}`, {
      batch: currentBatch
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert(`Batch ${currentBatch}: all teams ${lock ? 'locked' : 'unlocked'}`);
    fetchAllTeamHistories();
  } catch (err) {
    console.error("Batch toggle failed:", err);
    alert(`Failed to ${lock ? 'lock' : 'unlock'} batch`);
  }
}

document.getElementById("lockAllBtn")?.addEventListener("click", () => bulkLockBatch(true));
document.getElementById("unlockAllBtn")?.addEventListener("click", () => bulkLockBatch(false));

// 🧩 Modal close buttons
document.getElementById("closeSwotModal").addEventListener("click", () => {
  document.getElementById("swotModal").classList.add("hidden");
});
document.getElementById("closeIdeaModal").addEventListener("click", () => {
  document.getElementById("ideaModal").classList.add("hidden");
});
document.getElementById("closeValueModal").addEventListener("click", () => {
  document.getElementById("valueModal").classList.add("hidden");
});




document.getElementById("historyContent").addEventListener("click", (e) => {
  if (e.target.classList.contains("admin-comment-btn")) {
    const uploadId = e.target.dataset.uploadId;
    submitAdminComment(uploadId);
  }
});


function renderHistoryPaginationControlsFiltered(totalItems) {
  const totalPages = Math.ceil(totalItems / historyRowsPerPage);
  const container = document.getElementById("historyPaginationControls");

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  const createButton = (text, onClick, disabled = false) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'px-3 py-1 bg-gray-200 rounded mr-1';
    if (disabled) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btn.addEventListener('click', onClick);
    }
    return btn;
  };

  // Prev button
  container.appendChild(
    createButton(
      'Prev',
      () => historyPrevPageFiltered(),
      historyCurrentPage === 1
    )
  );

  // Page info span
  const pageInfo = document.createElement('span');
  pageInfo.className = 'px-3';
  pageInfo.textContent = `Page ${historyCurrentPage} of ${totalPages}`;
  container.appendChild(pageInfo);

  // Next button
  container.appendChild(
    createButton(
      'Next',
      () => historyNextPageFiltered(totalItems),
      historyCurrentPage === totalPages
    )
  );
}



function historyPrevPageFiltered() {
  if (historyCurrentPage > 1) {
    historyCurrentPage--;
    applyHistoryFilters(false); // don't reset to page 1
  }
}

function historyNextPageFiltered(totalItems) {
  const totalPages = Math.ceil(totalItems / historyRowsPerPage);
  if (historyCurrentPage < totalPages) {
    historyCurrentPage++;
    applyHistoryFilters(false); // don't reset to page 1
  }
}


function renderHistoryTable(filteredTeams = historyData) {
  renderHistoryTableFiltered(filteredTeams);
}


function renderHistoryPaginationControls() {
  const totalPages = Math.ceil(historyData.length / historyRowsPerPage);
  const container = document.getElementById("historyPaginationControls");
  container.innerHTML = ''; // clear old

  if (historyCurrentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Prev";
    prevBtn.className = "px-3 py-1 bg-gray-200 rounded";
    prevBtn.addEventListener("click", historyPrevPage);
    container.appendChild(prevBtn);
  }

  const span = document.createElement("span");
  span.textContent = `Page ${historyCurrentPage} of ${totalPages}`;
  span.className = "px-3";
  container.appendChild(span);

  if (historyCurrentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "px-3 py-1 bg-gray-200 rounded";
    nextBtn.addEventListener("click", historyNextPage);
    container.appendChild(nextBtn);
  }
}


function historyPrevPage() {
  if (historyCurrentPage > 1) {
    historyCurrentPage--;
    renderHistoryTable();
  }
}

function historyNextPage() {
  const totalPages = Math.ceil(historyData.length / historyRowsPerPage);
  if (historyCurrentPage < totalPages) {
    historyCurrentPage++;
    renderHistoryTable();
  }
}

function renderTeams(teams) {
  const container = document.getElementById("teamsTable");
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = teams.slice(startIndex, startIndex + itemsPerPage);

  container.innerHTML = `
    <table class="min-w-full table-auto border rounded overflow-hidden shadow text-sm text-left">
      <thead class="bg-blue-100">
        <tr>
          <th class="p-3">Team ID</th>
          <th class="p-3">Team Name</th>
          <th class="p-3">Name</th>
          <th class="p-3">Section</th>
          <th class="p-3">Register No</th>
          <th class="p-3">Mobile</th>
          <th class="p-3">Email</th>
          <th class="p-3">Dept</th>
          <th class="p-3">Role</th>
          <th class="p-3">Mentor Name</th>
          <th class="p-3">Mentor Department</th>
          <th class="p-3">Actions</th>
        </tr>
      </thead>
      <tbody id="teamBody" class="bg-white divide-y">
        ${paginatedTeams.map((team) =>
    team.Students?.map((student, i) => `
            <tr>
              <td class="p-3">${i === 0 ? team.UserId : ''}</td>
              <td class="p-3 font-medium text-blue-800">${i === 0 ? team.team_name : ''}</td>
              <td class="p-3">${student.student_name || ''}</td>
              <td class="p-3">${student.section || ''}</td>
              <td class="p-3">${student.register_no || ''}</td>
              <td class="p-3">${i === 0 ? team.mobile : ''}</td>
              <td class="p-3">${i === 0 ? team.email : ''}</td>
              <td class="p-3">${student.dept || ''}</td>
              <td class="p-3">${student.is_leader ? 'TeamLeader' : `Student ${i}`}</td>
              <td class="p-3">${i === 0 ? (team.mentor?.name || 'Unassigned') : ''}</td>
              <td class="p-3">${i === 0 ? (team.mentor?.department || 'N/A') : ''}</td>
              <td class="p-3">
                <button class="manage-btn text-purple-600 hover:underline" data-team-id="${team.UserId}">Manage</button>
                <button class="edit-btn text-blue-600 hover:underline ml-2" data-team-id="${team.UserId}" data-reg="${student.register_no}">Edit</button>
                <button class="delete-btn text-red-600 hover:underline ml-2" data-team-id="${team.UserId}" data-reg="${student.register_no}" data-is-leader="${student.is_leader}">Delete</button>
              </td>
            </tr>
          `).join('')
  ).join('')}
      </tbody>
    </table>
  `;

  renderPaginationControls(teams.length);
  bindActionButtons(); // bind all buttons
}

let currentReassignPage = 1;
const reassignItemsPerPage = 10;

function renderReassignMentorTable() {
  const container = document.getElementById("reassignTableContainer");

  const startIndex = (currentReassignPage - 1) * reassignItemsPerPage;
  const paginatedTeams = filteredAssignmentTeams.slice(startIndex, startIndex + reassignItemsPerPage);

  const rows = paginatedTeams.map(team => {
    const leader = team.Students?.find(s => s.is_leader);
    return `
      <tr>
        <td class="p-3">${team.UserId}</td>
        <td class="p-3">${team.team_name}</td>
        <td class="p-3">${leader?.student_name || ''}</td>
        <td class="p-3">${team.email}</td>
        <td class="p-3">${leader?.dept || ''}</td>
        <td class="p-3">${leader?.section || ''}</td>
        <td class="p-3">${team.mobile}</td>
        <td class="p-3">${team.mentor?.name || 'Unassigned'}</td>
        <td class="p-3">${team.mentor?.department || 'N/A'}</td>
        <td class="p-3">
          <select id="reassign-${team.UserId}" class="border rounded px-2 py-1 text-sm">
            <option value="">Select Mentor</option>
            ${allMentors.map(m => `
              <option value="${m.mentorId}" ${team.mentor?.mentorId === m.mentorId ? "selected" : ""}>
                ${m.name} (${m.department})
              </option>
            `).join("")}
          </select>

<button
  class="reassign-btn ml-2 px-2 py-1 bg-blue-600 text-white rounded text-sm"
  data-team-id="${team.UserId}"
  data-select-id="reassign-${team.UserId}">
  Reassign
</button>

</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="min-w-full table-auto border rounded overflow-hidden shadow text-sm text-left mt-4">
      <thead class="bg-blue-100">
        <tr>
          <th class="p-3">Team ID</th>
          <th class="p-3">Team Name</th>
          <th class="p-3">Leader Name</th>
          <th class="p-3">Email</th>
          <th class="p-3">Dept</th>
          <th class="p-3">Section</th>
          <th class="p-3">Mobile</th>
          <th class="p-3">Mentor</th>
          <th class="p-3">Mentor Dept</th>
          <th class="p-3">Reassign</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div id="reassignPaginationControls" class="mt-4 flex flex-wrap gap-2"></div>
  `;

  renderReassignPaginationControls(filteredAssignmentTeams.length);
}

function renderReassignPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / reassignItemsPerPage);
  const paginationContainer = document.getElementById("reassignPaginationControls");

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  paginationContainer.innerHTML = '';

  const createButton = (text, page, disabled = false, isActive = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `px-3 py-1 border rounded mr-1 ${isActive ? "bg-blue-500 text-white" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;
    if (!disabled) {
      btn.addEventListener("click", () => {
        currentReassignPage = page;
        renderReassignMentorTable();
      });
    } else {
      btn.disabled = true;
    }
    return btn;
  };

  paginationContainer.appendChild(createButton("Prev", currentReassignPage - 1, currentReassignPage === 1));

  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.appendChild(createButton(i, i, false, currentReassignPage === i));
  }

  paginationContainer.appendChild(createButton("Next", currentReassignPage + 1, currentReassignPage === totalPages));
}




function bindActionButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamId = btn.getAttribute("data-team-id");
      const regNo = btn.getAttribute("data-reg");
      console.log(teamId, regNo)
      editStudent(teamId, regNo);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamId = btn.getAttribute("data-team-id");
      const regNo = btn.getAttribute("data-reg");
      const isLeader = btn.getAttribute("data-is-leader") === "true";
      deleteStudent(teamId, regNo, isLeader);
    });
  });

  document.querySelectorAll(".manage-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamId = btn.getAttribute("data-team-id");
      openTeamManagerModal(teamId);
    });
  });
}

async function deleteStudent(teamId, registerNo, isLeader) {
  if (isLeader) {
    if (!confirm("This is the team leader. Deleting will remove the entire team. Proceed?")) return;
    await axios.delete(`/admin/delete-team/${teamId}`);
  } else {
    if (!confirm("Are you sure you want to delete this student from the team?")) return;
    await axios.delete(`/admin/delete-student/${teamId}/${registerNo}`);
  }
  fetchTeams();
}

async function editStudent(teamId, registerNo) {
  const team = filteredTeams.find(t => t.UserId === teamId);
  if (!team) return alert("Team not found");

  const student = team.Students.find(s =>
    String(s.register_no).trim() === String(registerNo).trim()
  );
  if (!student) return alert("Student not found");
  console.log(student)

  const newName = prompt("Enter new student name:", student.student_name);
  const newSection = prompt("Enter new section:", student.section);
  // const newreg=prompt("Enter new Register No:",student.register_no)
  const newDept = prompt("Enter new department:", student.dept);

  if (newName && newSection && newDept) {
    try {
      await axios.put('/admin/edit-student', {
        teamId,
        registerNo,
        student_name: newName,
        section: newSection,
        dept: newDept
      });
      fetchTeams();
    } catch (err) {
      console.error(err);
      alert("Failed to update student.");
    }
  }
}




function renderPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById("paginationControls");

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  // Clear existing buttons and listeners
  paginationContainer.innerHTML = '';

  const createButton = (text, page, disabled = false, isActive = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = `px-3 py-1 border rounded mr-1 ${isActive ? "bg-blue-500 text-white" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;
    if (!disabled) {
      btn.addEventListener("click", () => {
        currentPage = page;
        renderTeams(filteredTeams);
      });
    } else {
      btn.disabled = true;
    }
    return btn;
  };

  // Prev Button
  paginationContainer.appendChild(createButton("Prev", currentPage - 1, currentPage === 1));

  // Page Buttons
  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.appendChild(createButton(i, i, false, currentPage === i));
  }

  // Next Button
  paginationContainer.appendChild(createButton("Next", currentPage + 1, currentPage === totalPages));
}


window.changePage = function (page) {
  currentPage = page;
  renderTeams(filteredTeams); // re-render based on new page
}





function attachFilters() {
  const searchUserId = document.getElementById("searchUserId");
  const searchTeamName = document.getElementById("searchTeamName");
  const searchMentorDept = document.getElementById("searchMentorDept");
  const searchLeaderDept = document.getElementById("searchLeaderDept");
  const searchStudentName = document.getElementById("searchStudentName");

  [searchUserId, searchTeamName, searchMentorDept, searchLeaderDept, searchStudentName].forEach(input => {
    input.addEventListener("input", () => {
      currentPage = 1; // 🔥 Reset to first page
      const userVal = searchUserId.value.toLowerCase();
      const teamVal = searchTeamName.value.toLowerCase();
      const mentorVal = searchMentorDept.value.toLowerCase();
      const leaderVal = searchLeaderDept.value.toLowerCase();
      const studentnameVal = searchStudentName.value.toLowerCase();

      filteredTeams = currentTeams.filter(team =>
        team.UserId.toString().toLowerCase().includes(userVal) &&
        team.team_name.toLowerCase().includes(teamVal) &&
        (team.mentor?.department || "").toLowerCase().includes(mentorVal) &&
        (team.Students?.find(s => s.is_leader)?.dept || "").toLowerCase().includes(leaderVal) &&
        team.Students?.some(s => s.student_name.toLowerCase().includes(studentnameVal)) &&
        matchesBatch(team.UserId)
      );

      renderTeams(filteredTeams);
    });

  });
}

function openTeamManagerModal(teamId) {
  const modal = document.getElementById("teamManagerModal");
  const container = document.getElementById("teamManagerContent");
  const title = document.getElementById("teamManagerTitle");
  const team = currentTeams.find(t => t.UserId === teamId);
  if (!team) {
    alert("Team not found. Refresh the team list and try again.");
    return;
  }
  const allTeams = currentTeams.filter(t => t.UserId !== teamId);
  const students = team.Students || [];
  const deletedStudentIds = new Set();

  title.textContent = `Edit Team: ${team.UserId}`;

  const teamForm = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label class="block text-sm font-medium mb-1">Team ID</label>
        <input id="teamManagerTeamId" value="${team.UserId}" class="w-full border rounded p-2" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Team Name</label>
        <input id="teamManagerTeamName" value="${team.team_name || ""}" class="w-full border rounded p-2" placeholder="Team Name" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Team Email</label>
        <input id="teamManagerEmail" value="${team.email || ""}" class="w-full border rounded p-2" placeholder="team@email.com" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Mobile</label>
        <input id="teamManagerMobile" value="${team.mobile || ""}" class="w-full border rounded p-2" placeholder="Mobile" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Mentor</label>
        <select id="teamManagerMentor" class="w-full border rounded p-2">
          <option value="">Unassigned</option>
          ${allMentors.map(m => `<option value="${m.mentorId}" ${team.mentor?.mentorId === m.mentorId ? "selected" : ""}>${m.name} (${m.department})</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-lg font-semibold">Team Members</h3>
      <button id="teamManagerAddStudent" type="button" class="admin-btn admin-btn-primary">＋ Add Member</button>
    </div>

    <div id="teamManagerStudentRows" class="space-y-3">
      ${students.length ? students.map((student, idx) => `
        <div class="grid grid-cols-1 md:grid-cols-8 gap-2 border rounded p-3 bg-gray-50 student-row" data-student-id="${student.id || "new"}">
          <input class="student-field student-name border rounded p-2" value="${student.student_name || ""}" placeholder="Name" />
          <input class="student-field student-reg border rounded p-2" value="${student.register_no || ""}" placeholder="Register no" />
          <input class="student-field student-dept border rounded p-2" value="${student.dept || ""}" placeholder="Dept" />
          <input class="student-field student-section border rounded p-2" value="${student.section || ""}" placeholder="Section" />
          <input class="student-field student-mobile border rounded p-2" value="${student.mobile || ""}" placeholder="Mobile" />
          <select class="student-target-team border rounded p-2">
            <option value="">Keep in this team</option>
            ${allTeams.map(t => `<option value="${t.UserId}">${t.UserId} - ${t.team_name}</option>`).join("")}
          </select>
          <label class="flex items-center gap-2 border rounded p-2 bg-white">
            <input type="checkbox" class="student-leader" ${student.is_leader ? "checked" : ""} />
            Leader
          </label>
          <button type="button" class="remove-team-member admin-btn admin-btn-danger">Remove</button>
        </div>
      `).join("") : `
        <p class="text-sm text-gray-600">This team has no student records.</p>
      `}
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <button id="saveTeamManagerBtn" class="admin-btn admin-btn-primary">Save Changes</button>
      <button id="cancelTeamManagerBtn" class="admin-btn admin-btn-secondary">Cancel</button>
    </div>
  `;

  container.innerHTML = teamForm;
  modal.classList.remove("hidden");

  const saveBtn = document.getElementById("saveTeamManagerBtn");
  saveBtn.onclick = async () => {
    const teamIdVal = document.getElementById("teamManagerTeamId").value.trim();
    const teamNameVal = document.getElementById("teamManagerTeamName").value.trim();
    const emailVal = document.getElementById("teamManagerEmail").value.trim();
    const mobileVal = document.getElementById("teamManagerMobile").value.trim();
    const mentorIdVal = document.getElementById("teamManagerMentor").value;

    if (!teamIdVal || !teamNameVal || !emailVal || !mobileVal) {
      alert("Please fill Team Name, Email and Mobile.");
      return;
    }

    const studentRows = [...container.querySelectorAll(".student-row")].map((row) => {
      const name = row.querySelector(".student-name")?.value.trim();
      const registerNo = row.querySelector(".student-reg")?.value.trim();
      const dept = row.querySelector(".student-dept")?.value.trim();
      const section = row.querySelector(".student-section")?.value.trim();
      const mobile = row.querySelector(".student-mobile")?.value.trim();
      const isLeader = row.querySelector(".student-leader")?.checked;
      const targetTeam = row.querySelector(".student-target-team")?.value || teamIdVal;

      return {
        id: row.dataset.studentId || null,
        student_name: name,
        register_no: registerNo,
        dept,
        section,
        mobile,
        is_leader: !!isLeader,
        targetTeamId: targetTeam,
      };
    });

    if (studentRows.some(student => !student.student_name || !student.register_no || !student.dept || !student.section)) {
      alert("Each team member must have a name, register number, department and section.");
      return;
    }

    if (deletedStudentIds.size && !confirm(`Permanently delete ${deletedStudentIds.size} selected team member${deletedStudentIds.size === 1 ? "" : "s"}?`)) {
      return;
    }

    try {
      await axios.put("/admin/team-manager", {
        teamId: teamIdVal,
        team_name: teamNameVal,
        email: emailVal,
        mobile: mobileVal,
        mentor_id: mentorIdVal || null,
        students: studentRows,
        deletedStudentIds: [...deletedStudentIds],
      });
      alert("Team and member changes saved.");

      modal.classList.add("hidden");
      fetchTeams();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save team details.");
    }
  };

  document.getElementById("cancelTeamManagerBtn").onclick = () => modal.classList.add("hidden");
  document.getElementById("closeTeamManagerModal").onclick = () => modal.classList.add("hidden");
  container.querySelectorAll(".remove-team-member").forEach(button => {
    button.onclick = () => {
      const row = button.closest(".student-row");
      const studentId = row.dataset.studentId;
      if (studentId) deletedStudentIds.add(studentId);
      row.remove();
      if (!container.querySelector(".student-row")) {
        document.getElementById("teamManagerStudentRows").innerHTML = '<p class="text-sm text-gray-600">No members in this team. Add a member or save to keep the team empty.</p>';
      }
    };
  });
  document.getElementById("teamManagerAddStudent").onclick = () => {
    const rows = document.getElementById("teamManagerStudentRows");
    rows.querySelector("p")?.remove();
    rows.insertAdjacentHTML("beforeend", `
      <div class="grid grid-cols-1 md:grid-cols-8 gap-2 border rounded p-3 bg-gray-50 student-row" data-student-id="">
        <input class="student-field student-name border rounded p-2" placeholder="Name" required />
        <input class="student-field student-reg border rounded p-2" placeholder="Register no" required />
        <input class="student-field student-dept border rounded p-2" placeholder="Dept" required />
        <input class="student-field student-section border rounded p-2" placeholder="Section" required />
        <input class="student-field student-mobile border rounded p-2" placeholder="Mobile" />
        <span class="border rounded p-2 text-sm text-gray-600">Adding to ${team.UserId}</span>
        <label class="flex items-center gap-2 border rounded p-2 bg-white">
          <input type="checkbox" class="student-leader" /> Leader
        </label>
        <button type="button" class="remove-team-member admin-btn admin-btn-danger">Remove</button>
      </div>
    `);
  };
}

window.manageTeam = (teamId) => openTeamManagerModal(teamId);





document.getElementById("exportExcel").addEventListener("click", () => {
  console.log(typeof XLSX);

  const rows = [
    ["SNo", "Team ID", "Team Name", "Name", "Register No", "Mobile", "Email", "Dept", "Section", "Role", "Mentor Name"]
  ];

  let idx = 1
  filteredTeams.forEach(team => {
    team.Students?.forEach((student, i) => {
      rows.push([
        i == 0 ? idx++ : "",
        i === 0 ? team.UserId : "",
        i === 0 ? team.team_name : "",
        student.student_name || "",
        student.register_no || "",
        i === 0 ? team.mobile : "",
        i === 0 ? team.email : "",
        student.dept || "",
        student.section || "",
        student.is_leader ? "TeamLeader" : `Team Member ${i}`,
        i === 0 ? (team.mentor?.name || "Unassigned") : "",
      ]);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Teams");

  XLSX.writeFile(workbook, "filtered_teams_export.xlsx");
});


document.getElementById("exportHistoryExcel").addEventListener("click", () => {
  if (!filteredHistory.length) {
    alert("No data to export!");
    return;
  }

  // Find max week number across all teams
  const maxWeek = Math.max(
    0,
    ...filteredHistory.map(t =>
      t.TeamUploads ? t.TeamUploads.map(u => u.week_number || 0) : [0]
    ).flat()
  );

  // ✅ Added Problem Statement + Selected Idea columns
  const headers = [
    "SNo",
    "Team ID",
    "Team Name",
    "Name",
    "Register No",
    "Mobile",
    "Email",
    "Dept",
    "Section",
    "Role",
    "Mentor Name",
    "Mentor Email",
    "Status",
    "Problem Statement",
    "Selected Idea"
  ];

  for (let w = 1; w <= maxWeek; w++) {
    headers.push(`${getUploadTitle(w)} Status`, `${getUploadTitle(w)} Url`);
  }

  const rows = [headers];
  let idx2 = 1;

  filteredHistory.forEach(team => {
    const studentsSorted = [...(team.Students || [])].sort((a, b) => b.is_leader - a.is_leader);

    studentsSorted.forEach((student, i) => {
      const rowBase = [
        i === 0 ? idx2++ : "",
        i === 0 ? team.UserId : "",
        i === 0 ? team.team_name : "",
        student.student_name || "",
        student.register_no || "",
        i === 0 ? team.mobile : "",
        i === 0 ? team.email : "",
        student.dept || "",
        student.section || "",
        student.is_leader ? "TeamLeader" : `Team Member ${i}`,
        i === 0 ? (team.mentor?.name || "Unassigned") : "",
        i === 0 ? (team.mentor?.email || "Unassigned") : "",
        i === 0 ? (team.TeamUploads?.length ? "Uploaded" : "No Uploads") : "",
        // ✅ New fields — ProblemStatement + Selected Idea
        i === 0 ? (team.ProblemStatements[0]?.problem_description || "Not Submitted") : "",
        i === 0 ? (team.ProblemStatements[0]?.selected_idea || "Not Submitted") : ""
      ];

      if (i === 0) {
        for (let w = 1; w <= maxWeek; w++) {
          const upload = team.TeamUploads?.find(u => Number(u.week_number) === w);
          if (upload) {
            rowBase.push(upload.status || "Uploaded");
            rowBase.push(upload.file_url || "");
          } else {
            rowBase.push("No Upload");
            rowBase.push("");
          }
        }
      } else {
        for (let w = 1; w <= maxWeek; w++) {
          rowBase.push("", ""); // Empty for members
        }
      }

      rows.push(rowBase);
    });
  });

  // Create and export Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "History");
  XLSX.writeFile(wb, "history_export.xlsx");
});








async function fetchMentorsAndTeams() {
  const mentorsRes = await axios.get('/admin/mentors');
  allMentors = mentorsRes.data;
  renderMentorDirectory();
}

function renderMentorDirectory() {
  const container = document.getElementById("mentorDirectoryTable");
  if (!container) return;

  const nameFilter = document.getElementById("mentorFilterName")?.value.trim().toLowerCase() || "";
  const emailFilter = document.getElementById("mentorFilterEmail")?.value.trim().toLowerCase() || "";
  const departmentFilter = document.getElementById("mentorFilterDepartment")?.value.trim().toLowerCase() || "";
  const designationFilter = document.getElementById("mentorFilterDesignation")?.value.trim().toLowerCase() || "";
  const visibleMentors = allMentors.filter(mentor =>
    `${mentor.title || ""} ${mentor.name || ""}`.toLowerCase().includes(nameFilter) &&
    (mentor.email || "").toLowerCase().includes(emailFilter) &&
    (mentor.department || "").toLowerCase().includes(departmentFilter) &&
    (mentor.designation || "").toLowerCase().includes(designationFilter)
  );

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Department</th>
          <th>Designation</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${visibleMentors.length ? visibleMentors.map(mentor => `
          <tr>
            <td>${mentor.title ? `${mentor.title} ` : ""}${mentor.name}</td>
            <td>${mentor.email}</td>
            <td>${mentor.department}</td>
            <td>${mentor.designation}</td>
            <td><button type="button" class="delete-mentor-btn admin-btn admin-btn-danger" data-mentor-id="${mentor.mentorId}">Delete</button></td>
          </tr>
        `).join("") : '<tr><td colspan="5">No matching mentors.</td></tr>'}
      </tbody>
    </table>
  `;

  container.querySelectorAll(".delete-mentor-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const mentor = allMentors.find(item => String(item.mentorId) === button.dataset.mentorId);
      if (!mentor || !confirm(`Delete mentor ${mentor.name}? Their assigned teams will remain but become unassigned.`)) return;

      button.disabled = true;
      try {
        const response = await axios.delete(`/admin/mentors/${mentor.mentorId}`);
        await fetchMentorsAndTeams();
        await fetchTeams();
        renderReassignMentorTable();
        const unassignedTeams = response.data.unassignedTeams || 0;
        alert(`Mentor deleted.${unassignedTeams ? ` ${unassignedTeams} team${unassignedTeams === 1 ? " is" : "s are"} now unassigned.` : ""}`);
      } catch (err) {
        alert(err.response?.data?.error || "Unable to delete mentor.");
        button.disabled = false;
      }
    });
  });
}

function applyReassignFilters() {
  const idVal = document.getElementById("filterTeamId")?.value.trim().toLowerCase() || "";
  const nameVal = document.getElementById("filterTeamName")?.value.trim().toLowerCase() || "";
  const leaderVal = document.getElementById("filterLeaderName")?.value.trim().toLowerCase() || "";
  const emailVal = document.getElementById("filterTeamEmail")?.value.trim().toLowerCase() || "";
  const mentorVal = document.getElementById("filterMentorName")?.value.trim().toLowerCase() || "";
  const departmentVal = document.getElementById("filterMentorDepartment")?.value.trim().toLowerCase() || "";

  filteredAssignmentTeams = currentTeams.filter(team =>
    String(team.UserId || "").toLowerCase().includes(idVal) &&
    String(team.team_name || "").toLowerCase().includes(nameVal) &&
    String(team.Students?.find(student => student.is_leader)?.student_name || "").toLowerCase().includes(leaderVal) &&
    String(team.email || "").toLowerCase().includes(emailVal) &&
    String(team.mentor?.name || "").toLowerCase().includes(mentorVal) &&
    String(team.mentor?.department || "").toLowerCase().includes(departmentVal) &&
    matchesBatch(team.UserId)
  );

  currentReassignPage = 1;
  renderReassignMentorTable();
}

function attachReassignFilters() {
  [
    "filterTeamId",
    "filterTeamName",
    "filterLeaderName",
    "filterTeamEmail",
    "filterMentorName",
    "filterMentorDepartment",
  ].forEach(id => {
    document.getElementById(id)?.addEventListener("input", applyReassignFilters);
  });

  [
    "mentorFilterName",
    "mentorFilterEmail",
    "mentorFilterDepartment",
    "mentorFilterDesignation",
  ].forEach(id => {
    document.getElementById(id)?.addEventListener("input", renderMentorDirectory);
  });
}


window.editTeam = async (id) => {
  alert(`Edit functionality for team ${id} not implemented yet.`);
};

window.deleteTeam = async (id) => {
  if (confirm("Are you sure you want to delete this team?")) {
    await axios.delete(`/admin/delete-team/${id}`);
    fetchTeams();
  }
};


document.addEventListener("click", (e) => {
  if (e.target.classList.contains("reassign-btn")) {
    const selectId = e.target.dataset.selectId;
    const teamId = e.target.dataset.teamId;

    const select = document.getElementById(selectId);
    const mentorId = select?.value;

    console.log(teamId, mentorId);
    reassignMentor(teamId, mentorId);
  }
});


async function reassignMentor(teamId, mentorId) {
  console.log(teamId, mentorId)
  if (!mentorId) {
    alert("Please select a mentor.");
    return;
  }

  try {
    await axios.put('/admin/assign-mentor', {
      team_id: teamId,
      mentor_id: mentorId
    });
    alert("Mentor reassigned successfully.");
    fetchTeams();
  } catch (err) {
    console.error(err);
    alert("Failed to reassign mentor.");
  }
};


// TEAMS GENERAL SEARCH
function attachTeamsGeneralSearch() {
  const searchInput = document.getElementById("teamsGeneralSearch");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    filteredTeams = currentTeams.filter(team =>
      JSON.stringify(team).toLowerCase().includes(query) && matchesBatch(team.UserId)
    );
    currentPage = 1; // reset pagination
    renderTeams(filteredTeams);
  });
}

// ASSIGN GENERAL SEARCH
function attachAssignGeneralSearch() {
  const searchInput = document.getElementById("assignGeneralSearch");
  searchInput?.addEventListener("input", applyReassignFilters);
}

// HISTORY GENERAL SEARCH
function attachHistoryGeneralSearch() {
  const searchInput = document.getElementById("historyGeneralSearch");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    filteredHistory = historyData.filter(record =>
      JSON.stringify(record).toLowerCase().includes(query) && matchesBatch(record.UserId)
    );
    historyCurrentPage = 1;
    renderHistoryTableFiltered(filteredHistory);
  });
}


document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  window.location.href = "/login.html";
});



try {
  fetchTeams();
  fetchMentorsAndTeams();
  attachReassignFilters()
  attachTeamsGeneralSearch();
  attachAssignGeneralSearch();
  attachHistoryGeneralSearch();
}
catch (err) {
  console.error("Admin dashboard initialization failed:", err);
}

// Define all stages - 18 uploads + sem1_review1 + sem2_review1 + sem2_review2
// Labels show just the upload file name (no "Week N:" prefix) for a cleaner desktop layout
const stages = [
  // Semester 1 uploads
  { key: "upload_1", label: "Problem Statement Canvas", week: 1, group: "Semester 1" },
  { key: "upload_2", label: "Affinity Diagram", week: 2, group: "Semester 1" },
  { key: "upload_3", label: "Idea Generation Canvas", week: 3, group: "Semester 1" },
  { key: "upload_4", label: "SWOT Analysis", week: 4, group: "Semester 1" },
  { key: "upload_5", label: "Value Proposition", week: 5, group: "Semester 1" },
  { key: "sem1_review1", label: "Semester 1 Review 1", review: true, group: "Semester 1" },
  { key: "sem1_review2", label: "Semester 1 Review 2", review: true, group: "Semester 1" },
  { key: "sem1_workbook", label: "Semester 1 Workbook", workbook: true, group: "Semester 1" },

  // Semester 2 uploads
  { key: "upload_6", label: "User Requirements", week: 6, group: "Semester 2" },
  { key: "upload_7", label: "Product Dimensions", week: 7, group: "Semester 2" },
  { key: "upload_8", label: "Performance Requirement", week: 8, group: "Semester 2" },
  { key: "upload_9", label: "Bill Of Materials", week: 9, group: "Semester 2" },
  { key: "upload_10", label: "2D Modelling", week: 10, group: "Semester 2" },
  { key: "upload_11", label: "3D Modelling", week: 11, group: "Semester 2" },
  { key: "upload_12", label: "DB Schema", week: 12, group: "Semester 2" },
  { key: "upload_13", label: "HLD", week: 13, group: "Semester 2" },
  { key: "upload_14", label: "Tech Stack Architecture", week: 14, group: "Semester 2" },
  { key: "upload_15", label: "User Flow Diagram", week: 15, group: "Semester 2" },
  { key: "upload_16", label: "Mock Up / Wireframe", week: 16, group: "Semester 2" },
  { key: "sem2_review1", label: "Semester 2 Review 1", review: true, group: "Semester 2" },
  { key: "sem2_review2", label: "Semester 2 Review 2", review: true, group: "Semester 2" },
  { key: "sem2_workbook", label: "Semester 2 Workbook", workbook: true, group: "Semester 2" },

  // Semester 3 uploads
  { key: "sem3_review1", label: "Semester 3 Review 1", review: true, group: "Semester 3" },
  { key: "sem3_review2", label: "Semester 3 Review 2", review: true, group: "Semester 3" },
  { key: "sem3_workbook", label: "Semester 3 Workbook", workbook: true, group: "Semester 3" },

  // Semester 4 uploads
  { key: "sem4_review1", label: "Semester 4 Review 1", review: true, group: "Semester 4" },
  { key: "sem4_review2", label: "Semester 4 Review 2", review: true, group: "Semester 4" },
  { key: "sem4_workbook", label: "Semester 4 Workbook", workbook: true, group: "Semester 4" },

  // Additional submissions
  { key: "upload_17", label: "BMC Template", week: 17, group: "Additional" },
  { key: "upload_18", label: "Prototype Planning Canvas", week: 18, group: "Additional" }
];

let currentTimelineBatch = "24IPD"; // Default batch

// Dynamically render sections with batch selector
function renderTimelineSections() {
  const container = document.getElementById("timelineSections");

  // Add batch selector at the top
  container.innerHTML = `
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
      <label class="block font-semibold text-gray-800 mb-2">📚 Select Batch to Manage Timeline</label>
      <select id="timelineBatchSelector" class="p-2 border rounded shadow-sm w-full max-w-xs">
        <option value="24IPD">24 Batch (24IPD)</option>
        <option value="25IPD">25 Batch (25IPD)</option>
      </select>
      <p class="text-sm text-gray-600 mt-2">Timeline settings apply only to the selected batch.</p>
    </div>

    <div class="mb-4 flex gap-2">
      <button id="bulkSaveTimelines" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow font-medium">
        💾 Save All Timelines
      </button>
      <button id="clearAllTimelines" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow">
        🗑️ Clear All
      </button>
    </div>

    <div id="timelineStagesList" class="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <!-- stages rendered below -->
    </div>
  `;

  const stagesList = document.getElementById("timelineStagesList");

  // Group stages by semester
  const groups = {};
  stages.forEach(s => {
    const g = s.group || "Other";
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  });

  Object.entries(groups).forEach(([groupName, groupStages]) => {
    // Add group header
    const groupHeader = document.createElement("div");
    groupHeader.className = "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 mt-4 mb-2";
    groupHeader.innerHTML = `<h3 class="text-lg font-bold text-gray-800 border-b pb-1">${groupName}</h3>`;
    stagesList.appendChild(groupHeader);

    groupStages.forEach(({ key, label, review }) => {
      const icon = review ? "📝" : "📄";
      const borderColor = review ? "border-yellow-300" : "border-gray-200";
      const headerBg = review ? "bg-yellow-50" : "bg-gray-50";

      const card = document.createElement("div");
      card.className = `timeline-stage-card overflow-hidden flex flex-col ${borderColor}`;
      card.innerHTML = `
        <div class="px-3 py-2 ${headerBg} border-b ${borderColor}">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-gray-800 truncate" title="${label}">${icon} ${label}</span>
            <button class="save-timeline-btn shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                    data-stage="${key}">
              💾 Save
            </button>
          </div>
        </div>
        <div class="p-3 flex flex-col gap-2">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Start</label>
            <input type="datetime-local"
                   id="${key}Start"
                   class="p-1.5 border rounded text-sm w-full"
                   data-stage="${key}">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
            <input type="datetime-local"
                   id="${key}Deadline"
                   class="p-1.5 border rounded text-sm w-full"
                   data-stage="${key}">
          </div>
          <div id="${key}CurrentTimeline" class="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600 hidden">
            <span id="${key}CurrentStart"></span> → <span id="${key}CurrentEnd"></span>
          </div>
        </div>
      `;
      stagesList.appendChild(card);
    });
  });

  // Add event listener for batch selector
  document.getElementById("timelineBatchSelector").addEventListener("change", (e) => {
    currentTimelineBatch = e.target.value;
    loadAllTimelineDates();
  });

  // Add event listener for bulk save
  document.getElementById("bulkSaveTimelines").addEventListener("click", bulkSaveTimelines);

  // Add event listener for clear all
  document.getElementById("clearAllTimelines").addEventListener("click", clearAllTimelines);

  // Add event listeners for individual save buttons
  document.querySelectorAll('.save-timeline-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const stage = this.dataset.stage;
      const token = localStorage.getItem("token");

      const startDate = document.getElementById(`${stage}Start`).value;
      const deadline = document.getElementById(`${stage}Deadline`).value;

      if (!startDate || !deadline) {
        alert("Please fill in both start date and deadline.");
        return;
      }

      try {
        await axios.post(`/rubrics/deadline/${stage}`, {
          start: startDate,
          deadline: deadline,
          batch: currentTimelineBatch
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        alert(`✅ Timeline saved for ${stage}!`);
        loadAllTimelineDates(); // refresh display
      } catch (err) {
        console.error("Failed to save timeline:", err);
        alert("❌ Failed to save timeline. Please try again.");
      }
    });
  });
}

// Load deadlines for all stages for the selected batch
async function loadAllTimelineDates() {
  const token = localStorage.getItem("token");

  // Set the batch selector to current batch
  const selector = document.getElementById("timelineBatchSelector");
  if (selector) {
    selector.value = currentTimelineBatch;
  }

  for (let { key } of stages) {
    try {
      const res = await axios.get(`/rubrics/deadline/${key}?batch=${currentTimelineBatch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { start, deadline } = res.data;

      const startInput = document.getElementById(`${key}Start`);
      const deadlineInput = document.getElementById(`${key}Deadline`);
      const currentTimeline = document.getElementById(`${key}CurrentTimeline`);
      const currentStart = document.getElementById(`${key}CurrentStart`);
      const currentEnd = document.getElementById(`${key}CurrentEnd`);

      if (startInput && start) {
        startInput.value = new Date(start).toISOString().slice(0, 16);
      } else if (startInput) {
        startInput.value = "";
      }

      if (deadlineInput && deadline) {
        deadlineInput.value = new Date(deadline).toISOString().slice(0, 16);
      } else if (deadlineInput) {
        deadlineInput.value = "";
      }

      if (start || deadline) {
        if (currentTimeline) currentTimeline.classList.remove("hidden");
        if (currentStart) currentStart.textContent = start ? new Date(start).toLocaleString() : "-";
        if (currentEnd) currentEnd.textContent = deadline ? new Date(deadline).toLocaleString() : "-";
      } else {
        if (currentTimeline) currentTimeline.classList.add("hidden");
      }
    } catch (err) {
      console.error(`Failed to load ${key} deadline:`, err);
    }
  }
}

// Bulk save all timelines
async function bulkSaveTimelines() {
  const token = localStorage.getItem("token");
  const timelines = [];
  let hasEmptyFields = false;

  stages.forEach(({ key }) => {
    const startDate = document.getElementById(`${key}Start`).value;
    const deadline = document.getElementById(`${key}Deadline`).value;

    if (startDate && deadline) {
      timelines.push({
        stage: key,
        start: startDate,
        deadline: deadline
      });
    } else if (startDate || deadline) {
      hasEmptyFields = true;
    }
  });

  if (timelines.length === 0) {
    alert("Please fill in at least one timeline with both start and deadline.");
    return;
  }

  if (hasEmptyFields) {
    if (!confirm("Some timelines have only start OR deadline filled. They will be skipped. Continue?")) {
      return;
    }
  }

  try {
    await axios.post(`/rubrics/batch-timelines/bulk`,
      { batch: currentTimelineBatch, timelines },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert(`✅ ${timelines.length} timelines saved successfully for batch ${currentTimelineBatch}!`);
    loadAllTimelineDates(); // refresh
  } catch (err) {
    console.error("Failed to bulk save timelines:", err);
    alert("❌ Failed to save timelines. Please try again.");
  }
}

// Clear all timeline fields
function clearAllTimelines() {
  if (!confirm(`Clear all timeline entries for batch ${currentTimelineBatch}? This will only clear the form fields, not delete saved data.`)) {
    return;
  }

  stages.forEach(({ key }) => {
    const startInput = document.getElementById(`${key}Start`);
    const deadlineInput = document.getElementById(`${key}Deadline`);
    if (startInput) startInput.value = "";
    if (deadlineInput) deadlineInput.value = "";
  });
}


async function submitAdminComment(uploadId) {
  const textarea = document.getElementById(`admin-comment-${uploadId}`);
  const comment = textarea.value.trim();

  if (!comment) {
    alert("Please enter a comment before sending.");
    return;
  }

  try {
    const response = await fetch(`/admin/uploads/${uploadId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ review_comment: comment })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to send comment");
    }

    // Save comment in localStorage
    localStorage.setItem("adminComment-" + uploadId, comment);

    alert("Comment mailed successfully ✅");

    // Re-render so "Reviewed by Admin" shows
    fetchAllTeamHistories() // re-fetch and re-render
  } catch (error) {
    console.error(error);
    alert("Error sending comment ❌");
  }
}


// Initialize timelines on page load
renderTimelineSections();
loadAllTimelineDates();
