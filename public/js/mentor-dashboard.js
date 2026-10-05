// Sidebar toggle for mobile
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('-translate-x-full');
});

// Toggle uploads view
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('toggleUploads')) {
    const uploadsDiv = e.target.closest('.border').querySelector('.uploads');
    uploadsDiv.classList.toggle('hidden');
  }
});

document.getElementById("logout").addEventListener("click", (e) => {
  e.preventDefault()
  localStorage.removeItem('token');
  window.location.href = "/login.html";
})

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('submitReviewBtn')) {
    const btn = e.target;
    const uploadId = btn.getAttribute('data-upload-id');
    const reviewText = btn.closest('.p-3').querySelector('.review-text').value.trim();

    if (!reviewText) {
      alert('Please write a review before submitting.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/mentor/uploads/${uploadId}/review`, {
        review_comment: reviewText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Review submitted successfully!');
      btn.disabled = true; // optional: prevent re-submission
      btn.textContent = 'Reviewed'; // optional: change button text
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review.');
    }
  }
});


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
  // Fetch timelines - /api/deadlines returns batch-specific timelines
  try {
    const res = await axios.get('/api/deadlines', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Build timeline map by stage key
    const timelineMap = {};

    if (res.data && res.data.timelines) {
      res.data.timelines.forEach(t => {
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

    // Convert stage key to element ID (sem1_review1 -> sem1Review1TeamSelect)
    const selectId = `${stageKey.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')}TeamSelect`;
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
  const containerId = `${stageKey.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')}TableContainer`;
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
          <th class="border p-2">Marks (out of 30)</th>
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

  // Show submit button
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

    const selectId = `${stageKey.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')}TeamSelect`;
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
      const selectId = `${key.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')}TeamSelect`;
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
      const selectId = `${key.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')}TeamSelect`;
      const inputId = `${key.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('')}ScoreInput`;

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



// async function loadRubricsTeams() {
//   try {
//     const token = localStorage.getItem('token');

//     // Get deadlines
//     const res = await axios.get('/rubrics/deadline/review1', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     const { start, deadline } = res.data;

//     const now = new Date();
//     const startDate = new Date(start);
//     const deadlineDate = new Date(deadline);
//     console.log(startDate, deadlineDate)

//     // Only show section if in window
//     if (now >= startDate && now <= deadlineDate) {
//       document.getElementById("rubricsSection").style.display = "block";
//       try {
//         const token = localStorage.getItem('token');
//         const mentorRes = await axios.get('/mentor/details', {
//           headers: { Authorization: `Bearer ${token}` }
//         });

//         const mentor = mentorRes.data;
//         if (!mentor.is_coordinator) return; // only coordinators see rubrics

//         //here
//         document.getElementById('rubricsSection').classList.remove('hidden');

//         // Fetch teams in mentor department
//         const teamRes = await axios.get(`/mentor/teams?reviewType=review1`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });

//         const teamSelect = document.getElementById('teamSelect');
//         teamRes.data.forEach(team => {
//           const option = document.createElement('option');
//           option.value = team.UserId;
//           option.textContent = `${team.team_name} (${team.email})`;
//           teamSelect.appendChild(option);
//         });

//         // When team is selected → load rubrics
//         teamSelect.addEventListener('change', () => {
//           const teamId = teamSelect.value;
//           console.log(teamId)
//           if (!teamId) {
//             document.getElementById('rubricsForm').classList.add('hidden');
//             return;
//           }
//           renderRubricsForm(teamId);
//         });

//       } catch (err) {
//         console.error('Error loading rubrics teams:', err);
//       }


//     } else {
//       // here
//       document.getElementById("rubricsSection").style.display = "none";
//     }

//   } catch (err) {
//     console.error('Error loading rubrics teams:', err);
//   }
// }


// function renderRubricsForm(teamId) {
//   const criteria = [
//     "Problem Identification",
//     "Problem Statement Canvas",
//     "Idea Generation & Affinity diagram",
//     "Team Presentation & Clarity",
//     "Mentor Interaction & Progress Tracking"
//   ];

//   const rubricsForm = document.getElementById('rubricsForm');
//   rubricsForm.innerHTML = '';

//   criteria.forEach((criterion, index) => {
//     const row = document.createElement('div');
//     row.className = "mb-4";
//     row.innerHTML = `
//       <p class="font-semibold mb-2">${criterion}</p>
//       <div class="flex space-x-4">
//         ${[1, 2, 3, 4, 5].map(score => `
//           <label class="rubric-label">
//             <input type="radio" name="criterion_${index + 1}" value="${score}" class="rubric-score hidden">
//             <span>${score}</span>
//           </label>
//         `).join('')}
//       </div>
//     `;
//     rubricsForm.appendChild(row);
//   });

//   // Submit button
//   const submitBtn = document.createElement('button');
//   submitBtn.textContent = "Submit Rubrics";
//   submitBtn.className = "bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600";
//   submitBtn.addEventListener('click', () => submitRubrics(teamId, "review1"));
//   rubricsForm.appendChild(submitBtn);

//   rubricsForm.classList.remove('hidden');

//   // 🔥 Add event listener to toggle highlight
//   rubricsForm.querySelectorAll('.rubric-score').forEach(input => {
//     input.addEventListener('change', () => {
//       const group = rubricsForm.querySelectorAll(`input[name="${input.name}"]`);
//       group.forEach(r => r.parentElement.classList.remove('selected'));
//       input.parentElement.classList.add('selected');
//     });
//   });
// }


// async function submitRubrics(teamId, stage) {
//   const scores = {};
//   document.querySelectorAll('.rubric-score:checked').forEach(input => {
//     const critIndex = input.name.split('_')[1]; // e.g. "1"
//     scores[`rubric${critIndex}`] = parseInt(input.value, 10);
//   });

//   const token = localStorage.getItem('token');
//   try {
//     await axios.post(`/mentor/teams/${teamId}/rubrics/${stage}`, { scores }, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     console.log(scores);
//     alert(`Rubrics for ${stage} submitted successfully!`);

//     // ✅ Reset radio buttons
//     document.querySelectorAll('.rubric-score').forEach(input => {
//       input.checked = false;
//     });

//     // ✅ Re-fetch teams to update dropdown
//     loadRubricsTeams();

//     // ✅ Hide form after submission
//     document.getElementById('rubricsForm').classList.add('hidden');

//   } catch (err) {
//     console.error('Error submitting rubrics:', err);
//     alert('Failed to submit rubrics.');
//   }
// }





// Fetch assigned teams & uploads (replace with API)
// Fetch assigned teams & uploads (replace with API)
// Fetch assigned teams & uploads (replace with API)
// async function loadTeams() {
//   try {
//     const token = localStorage.getItem('token');
//     const res = await axios.get('/mentor/my-teams', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     console.log(res.data);

//     const teamList = document.getElementById('teamList');
//     teamList.innerHTML = '';

//     res.data.forEach(team => {
//       const teamCard = document.createElement('div');
//       teamCard.className = 'border rounded-lg p-4 shadow-sm';

//       // Check if uploads exist
//       let uploadsContent = '';
//       if (team.TeamUploads && team.TeamUploads.length > 0) {
//         uploadsContent = team.TeamUploads.map(upload => {
//           const alreadyReviewed = !!upload.review_comment;
//           const stat = upload.status;

//           let dataType = "upload"; // default

// if (upload.week_number === 3) dataType = "idea";
// else if (upload.week_number === 4) dataType = "swot";
// else if (upload.week_number === 5) dataType = "value";

// let viewLink = upload.file_url
//   ? `<a href="${upload.file_url}" class="text-blue-600 underline" target="_blank">Download</a>`
//   : `<a href="#" class="text-blue-600 underline view-link" data-week="${upload.week_number}" data-type="${dataType}">View</a>`;

//           return `
//             <div class="p-3 border rounded bg-gray-50">
//               <p class="font-semibold">File - ${upload.week_number}</p>
//               ${viewLink}
//               ${alreadyReviewed && stat === "REVIEWED"
//                 ? `<textarea class="w-full mt-2 p-2 border rounded bg-gray-100" readonly>${upload.review_comment}</textarea>
//                    <button class="mt-2 bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed" disabled>Reviewed</button>`
//                 : `<textarea placeholder="Write your review..." class="w-full mt-2 p-2 border rounded review-text"></textarea>
//                    <button 
//                      class="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 submitReviewBtn"
//                      data-team-id="${team.id}" 
//                      data-upload-id="${upload.id}">
//                      Submit Review
//                    </button>`
//               }
//             </div>
//           `;
//         }).join('');
//       } else {
//         let fallbackLinks = '';

//         if (team.IdeaSelection) {
//           fallbackLinks += `<a href="#" class="text-blue-600 underline view-link" data-type="idea">View Idea Generation</a>`;
//         }

//         if (team.SwotAnalysis) {
//           fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-type="swot">View SWOT Analysis</a>`;
//         }

//         if (team.ValueProposition) {
//           fallbackLinks += `<a href="#" class="ml-4 text-blue-600 underline view-link" data-type="value">View Value Proposition</a>`;
//         }

//         if (!fallbackLinks) {
//           fallbackLinks = `<span class="text-gray-600 italic">No data available yet</span>`;
//         }

//         uploadsContent = `<div class="p-3 border rounded bg-gray-50">${fallbackLinks}</div>`;
//       }

//       teamCard.innerHTML = `
//         <div class="flex justify-between items-center">
//           <div>
//             <h3 class="font-bold text-lg">${team.team_name}</h3>
//             <p class="text-gray-600">Leader: ${team.email}</p>
//           </div>
//           <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 toggleUploads">View Uploads</button>
//         </div>
//         <div class="uploads mt-4 hidden space-y-3">
//           ${uploadsContent}
//         </div>
//       `;

//       teamList.appendChild(teamCard);

// // Attach modal logic for "view-link"
// const viewLinks = teamCard.querySelectorAll(".view-link");
// viewLinks.forEach(link => {
//   link.addEventListener("click", (e) => {
//     e.preventDefault();
//     const type = link.getAttribute("data-type");

//     // Update URL in current page with team id
//     const url = new URL(window.location);
//     url.searchParams.set("id", team.UserId);
//     url.searchParams.set("type", type); // optional
//     window.history.pushState({}, "", url);

//           // Handle modal rendering
//           if (type === "swot" && team.SwotAnalysis) {
//             document.getElementById("swotModal").classList.remove("hidden");
//             const swotIframe = document.getElementById("swotIframe");
//             swotIframe.src = "../swot.html";
//             // swotIframe.onload = () => {
//             //   swotIframe.contentWindow.postMessage({
//             //     type: "SWOT_DATA",
//             //     team_name: team.team_name,
//             //     swot: team.SwotAnalysis
//             //   }, "*");
//             // };
//           }

//           if (type === "idea" && team.IdeaSelection) {
//             document.getElementById("ideaModal").classList.remove("hidden");
//             const ideaIframe = document.getElementById("ideaIframe");
//             ideaIframe.src = "idea.html";
//             ideaIframe.onload = () => {
//               ideaIframe.contentWindow.postMessage({
//                 type: "IDEA_DATA",
//                 team_name: team.team_name,
//                 idea: team.IdeaSelection
//               }, "*");
//             };
//           }

//           if (type === "value" && team.ValueProposition) {
//             document.getElementById("valueModal").classList.remove("hidden");
//             const valueIframe = document.getElementById("valueIframe");
//             // valueIframe.src = "value.html";
//             valueIframe.onload = () => {
//               valueIframe.contentWindow.postMessage({
//                 type: "VALUE_DATA",
//                 team_name: team.team_name,
//                 value: team.ValueProposition
//               }, "*");
//             };
//           }
//         });
//       });
//     });

//     // Close buttons
//     document.getElementById("closeSwotModal").addEventListener("click", () => {
//       document.getElementById("swotModal").classList.add("hidden");
//     });
//     // Uncomment if you want idea/value modals closable too
//     // document.getElementById("closeIdeaModal").addEventListener("click", () => {
//     //   document.getElementById("ideaModal").classList.add("hidden");
//     // });
//     // document.getElementById("closeValueModal").addEventListener("click", () => {
//     //   document.getElementById("valueModal").classList.add("hidden");
//     // });

//   } catch (err) {
//     console.error(err);
//   }
// }

const weekTitles = UPLOAD_TITLES;

async function loadTeams(batch = "24ipd") {
  try {
    const token = localStorage.getItem('token');

    // Send selected batch to backend
    const res = await axios.get(`/mentor/my-teams?batch=${batch}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`Teams loaded for ${batch}:`, res.data);

    const teamList = document.getElementById('teamList');
    teamList.innerHTML = '';

    res.data.forEach(team => {
      const teamCard = document.createElement('div');
      teamCard.className = 'border rounded-lg p-4 shadow-sm';


      // Check if uploads exist
      let uploadsContent = '';
      if (team.TeamUploads && team.TeamUploads.length > 0) {
        const renderUpload = (upload) => {
          const alreadyReviewed = !!upload.review_comment;
          const stat = upload.status;

          // build link depending on file_url availability
          let viewLink = "";
          if (upload.file_url) {
            viewLink = `<a href="${upload.file_url}" class="text-blue-600 underline" target="_blank">Download</a>`;
          } else {
            viewLink = `<a href="#" class="text-blue-600 underline view-link" data-week="${upload.week_number}">View</a>`;
          }

          return `
            <div class="p-3 border rounded bg-gray-50">
              <p class="font-semibold">
                ${weekTitles[upload.week_number] || `Week ${upload.week_number}`}
              </p>

              ${viewLink}

              ${alreadyReviewed && stat === "REVIEWED"
              ? `
                  <textarea class="w-full mt-2 p-2 border rounded bg-gray-100" readonly>${upload.review_comment}</textarea>

                  <button
                    class="mt-2 bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed"
                    disabled>
                    Reviewed
                  </button>
                `
              : `
                  <textarea
                    placeholder="Write your review..."
                    class="w-full mt-2 p-2 border rounded review-text">
                  </textarea>

                  <button
                    class="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 submitReviewBtn"
                    data-team-id="${team.id}"
                    data-upload-id="${upload.id}">
                    Submit Review
                  </button>
                `
              }
            </div>
          `;
        };

        uploadsContent = groupUploadsBySemester(team.TeamUploads).map((group, idx) => `
          <div class="portal-upload-group mb-3 border rounded" id="sem-group-${idx}">
            <button type="button" data-sem-btn
              class="w-full flex justify-between items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-left font-semibold text-gray-800">
              <span>${group.label}</span>
              <span class="text-sm text-gray-600">▸</span>
            </button>
            <div class="space-y-3 p-3 hidden">
              ${group.uploads.map(renderUpload).join('')}
            </div>
          </div>
        `).join('');
      } else {

        let fallbackLinks = '';

        // if idea data exists
        if (team.IdeaSelection) {
          fallbackLinks += `
            <a
              href="#"
              class="text-blue-600 underline view-link"
              data-week="3">
              View Idea Generation
            </a>
          `;
        }

        // if SWOT data exists
        if (team.SwotAnalysis) {
          fallbackLinks += `
            <a
              href="#"
              class="ml-4 text-blue-600 underline view-link"
              data-week="4">
              View SWOT Analysis
            </a>
          `;
        }

        // if Value Proposition exists
        if (team.ValueProposition) {
          fallbackLinks += `
            <a
              href="#"
              class="ml-4 text-blue-600 underline view-link"
              data-week="5">
              View Value Proposition
            </a>
          `;
        }

        if (!fallbackLinks) {
          fallbackLinks = `
            <span class="text-gray-600 italic">
              No data available yet
            </span>
          `;
        }

        uploadsContent = `
          <div class="p-3 border rounded bg-gray-50">
            ${fallbackLinks}
          </div>
        `;
      }


      teamCard.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">${team.team_name}</h3>
            <p class="text-gray-600">Leader: ${team.email}</p>
          </div>

          <button
            class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 toggleUploads">
            View Uploads
          </button>
        </div>

        <div class="uploads mt-4 hidden space-y-3">
          ${uploadsContent}
        </div>
      `;

      teamList.appendChild(teamCard);

      // attach modal logic for "view-link" anchors
      const viewLinks = teamCard.querySelectorAll(".view-link");

      viewLinks.forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();

          const week = parseInt(
            link.getAttribute("data-week"),
            10
          );

          if (week === 4) {
            document.getElementById("swotModal").classList.remove("hidden");

            document.getElementById("swotIframe").src =
              `swot-mentor.html?id=${team.UserId}&type=swot`;

          } else if (week === 3) {

            document.getElementById("ideaModal").classList.remove("hidden");

            document.getElementById("ideaIframe").src =
              `idea-mentor.html?id=${team.UserId}&type=idea`;

          } else if (week === 5) {

            document.getElementById("ideaModal").classList.remove("hidden");

            document.getElementById("ideaIframe").src =
              `value-mentor.html?id=${team.UserId}&type=value`;

          }

          else if (week === 6 && team.UserRequirementCanvas) {

            const urc = team.UserRequirementCanvas;

            const headers = [
              "User Requirements",
              "Product Features"
            ];

            const userReq = urc.user_requirements || [];
            const productFeat = urc.product_features || [];

            const maxLength = Math.max(
              userReq.length,
              productFeat.length
            );

            const dataRows = [];

            for (let i = 0; i < maxLength; i++) {
              dataRows.push({
                "User Requirements": userReq[i] || "",
                "Product Features": productFeat[i] || ""
              });
            }

            openModal(
              "User Requirement Canvas",
              headers,
              "week6",
              dataRows
            );

            const moscowHTML = `
              <div class="mt-6">
                <h3 class="font-bold text-lg mb-2">
                  MoSCoW Prioritization
                </h3>

                <table class="w-full border border-collapse">
                  <tbody>
                    <tr>
                      <td class="border p-2 font-semibold bg-gray-100">
                        Must Have
                      </td>
                      <td class="border p-2">
                        ${urc.must_have || ""}
                      </td>
                    </tr>

                    <tr>
                      <td class="border p-2 font-semibold bg-gray-100">
                        Should Have
                      </td>
                      <td class="border p-2">
                        ${urc.should_have || ""}
                      </td>
                    </tr>

                    <tr>
                      <td class="border p-2 font-semibold bg-gray-100">
                        Could Have
                      </td>
                      <td class="border p-2">
                        ${urc.could_have || ""}
                      </td>
                    </tr>

                    <tr>
                      <td class="border p-2 font-semibold bg-gray-100">
                        Won't Have
                      </td>
                      <td class="border p-2">
                        ${urc.wont_have || ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;

            document.getElementById("modalTableContainer")
              .innerHTML += moscowHTML;
          }

          else if (week === 7 && team.ProductDimension) {

            const pd = team.ProductDimension;

            const headers = [
              "Dimension",
              "Parameter"
            ];

            const dataRows =
              (pd.dimensions || []).map(item => ({
                "Dimension": item.dimension || "",
                "Parameter": item.parameter || ""
              }));

            openModal(
              "Product Dimensions",
              headers,
              "week7",
              dataRows
            );
          }

          else if (week === 8 && team.PerformanceRequirement) {

            const pr = team.PerformanceRequirement;

            const headers = [
              "Parameter",
              "Justification",
              "Expected Performance"
            ];

            const dataRows =
              (pr.performance_data || []).map(item => ({
                "Parameter": item.parameter || "",
                "Justification": item.justification || "",
                "Expected Performance":
                  item.expectedPerformance || ""
              }));

            openModal(
              "Performance Requirement",
              headers,
              "week8",
              dataRows
            );
          }

          else if (week === 9 && team.BillOfMaterial) {

            const bom = team.BillOfMaterial;

            const headers = [
              "Material",
              "Quantity",
              "Component"
            ];

            const dataRows =
              (bom.bom_data || []).map(item => ({
                "Material": item.material || "",
                "Quantity": item.quantity || "",
                "Component": item.component || ""
              }));

            openModal(
              "Bill Of Materials",
              headers,
              "week9",
              dataRows
            );
          }
        });
      });
    });

    // close buttons for modals
    document.getElementById("closeSwotModal").addEventListener(
      "click",
      () => {
        document.getElementById("swotModal")
          .classList.add("hidden");
      }
    );

    document.getElementById("closeIdeaModal").addEventListener(
      "click",
      () => {
        document.getElementById("ideaModal")
          .classList.add("hidden");
      }
    );

    document.getElementById("closeValueModal").addEventListener(
      "click",
      () => {
        document.getElementById("valueModal")
          .classList.add("hidden");
      }
    );

  } catch (err) {
    console.error("Error loading mentor teams:", err);
  }
}



let currentModalType = null;

function openModal(title, headers, type, dataRows = []) {

  currentModalType = type;

  document.getElementById("modalTitle").innerText = title;

  let tableHTML = `<table class="w-full border border-collapse">`;
  tableHTML += "<thead><tr>";

  headers.forEach(h => {
    tableHTML += `<th class="border p-2 bg-gray-100">${h}</th>`;
  });

  tableHTML += "</tr></thead><tbody>";

  const totalRows = 10; // same as original structure

  for (let i = 0; i < totalRows; i++) {

    tableHTML += "<tr>";

    headers.forEach(header => {

      // If data exists for this row
      let value = "";
      if (dataRows[i] && dataRows[i][header] !== undefined) {
        value = dataRows[i][header];
      }

      tableHTML += `
        <td class="border p-1">
          <input 
            type="text" 
            value="${value}" 
            class="w-full border p-1 rounded table-input"
            ${value ? "disabled" : ""}
          />
        </td>
      `;
    });

    tableHTML += "</tr>";
  }

  tableHTML += "</tbody></table>";

  document.getElementById("modalTableContainer").innerHTML = tableHTML;

  document.getElementById("popupModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("popupModal").classList.add("hidden");
}

function renderSwotModal(team) {
  const container = document.getElementById("swotContainer");

  // Use the same HTML structure you have in swot.html, but fill values from `team.SwotAnalysis`
  const swot = team.SwotAnalysis || {};
  const teamName = team.team_name || "";
  const selectedIdea = swot.selected_idea || "";
  const strengths = swot.strengths || "";
  const weakness = swot.weakness || "";
  const opportunities = swot.opportunities || "";
  const threats = swot.threats || "";

  container.innerHTML = `
        <div>
            <p><strong>Team Name:</strong> ${teamName}</p>
            <p><strong>Selected Idea:</strong> ${selectedIdea}</p>
        </div>
        <table style="width:100%; border-collapse: collapse;">
            <tr>
                <td style="border:1px solid #000; padding:5px;"><strong>Strengths</strong><br>${strengths}</td>
                <td style="border:1px solid #000; padding:5px;"><strong>Weakness</strong><br>${weakness}</td>
            </tr>
            <tr>
                <td style="border:1px solid #000; padding:5px;"><strong>Opportunities</strong><br>${opportunities}</td>
                <td style="border:1px solid #000; padding:5px;"><strong>Threats</strong><br>${threats}</td>
            </tr>
        </table>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
    `;

  document.getElementById("swotModal").classList.remove("hidden");
}

async function loadMentorUpload() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/mentor/my-upload", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const historyDiv = document.getElementById("mentorUploadHistory");
    historyDiv.innerHTML = "";

    if (res.data.file_url) {
      historyDiv.innerHTML = `
        <div class="p-3 border rounded bg-gray-50 mb-2">
          <p class="font-semibold">${res.data.file_name}</p>
          <p class="text-sm text-gray-600">Uploaded: ${new Date(res.data.uploaded_at).toLocaleString()}</p>
          <a href="${res.data.file_url}" target="_blank" class="text-blue-600 underline">Download</a>
        </div>
      `;
    } else {
      historyDiv.innerHTML = `<p class="text-gray-500 italic">No uploads yet</p>`;
    }

  } catch (err) {
    console.error("Error loading upload:", err);
  }
}

// async function loadSem2Review2Teams() {
//   const token = localStorage.getItem("token");

//   const res = await axios.get("/mentor/teams/dropdown", {
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   const select = document.getElementById("sem2Review2TeamSelect");
//   select.innerHTML = '<option value="">-- Select Team --</option>';

//   res.data.forEach(team => {
//     const opt = document.createElement("option");
//     opt.value = team.UserId;
//     opt.textContent = team.team_name;
//     select.appendChild(opt);
//   });
// }

// document.getElementById("sem2Review2TeamSelect")
// .addEventListener("change", async (e) => {
//   const teamId = e.target.value;
//   if (!teamId) return;

//   const token = localStorage.getItem("token");

//   const res = await axios.get(`/mentor/teams/${teamId}/students`, {
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   renderStudentTableReview2(res.data);
// });

// function renderStudentTableReview2(students) {
//   const container = document.getElementById("studentTableContainer2");

//   let html = `
//     <table class="w-full border">
//       <thead>
//         <tr class="bg-gray-100">
//           <th class="border p-2">Name</th>
//           <th class="border p-2">Register No</th>
//           <th class="border p-2">Dept</th>
//           <th class="border p-2">Section</th>
//           <th class="border p-2">Review 2 Marks</th>
//         </tr>
//       </thead>
//       <tbody>
//   `;

//   students.forEach(s => {
//     html += `
//       <tr>
//         <td class="border p-2">${s.student_name}</td>
//         <td class="border p-2">${s.register_no}</td>
//         <td class="border p-2">${s.dept}</td>
//         <td class="border p-2">${s.section}</td>
//         <td class="border p-2">
//           <input 
//             type="number" 
//             class="mark-input2 border p-1 w-full"
//             data-id="${s.id}"
//             value="${s.sem2_review2 ?? ""}"
//           />
//         </td>
//       </tr>
//     `;
//   });

//   html += `</tbody></table>`;
//   container.innerHTML = html;

//   document.getElementById("submitSem2Review2Marks")
//     .classList.remove("hidden");
// }

// document.getElementById("submitSem2Review2Marks")
// .addEventListener("click", async () => {

//   const teamId = document.getElementById("sem2Review2TeamSelect").value;

//   const inputs = document.querySelectorAll(".mark-input2");

//   const students = Array.from(inputs).map(input => ({
//     id: input.dataset.id,
//     mark: input.value ? Number(input.value) : null
//   }));

//   const token = localStorage.getItem("token");

//   await axios.post(`/mentor/teams/${teamId}/sem2-review2`, {
//     students
//   }, {
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   alert("Review 2 Marks submitted successfully!");
// });

// ---- SEM 3 REVIEW 1 (legacy — elements removed in new HTML) ----
// (Disabled to prevent null-reference errors; new timeline-gated sections use STAGES_CONFIG)

// async function loadSem2Teams() {
//   const token = localStorage.getItem("token");

//   const res = await axios.get("/mentor/teams/dropdown", {
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   const select = document.getElementById("sem2TeamSelect");
//   select.innerHTML = '<option value="">-- Select Team --</option>';

//   res.data.forEach(team => {
//     const opt = document.createElement("option");
//     opt.value = team.UserId;
//     opt.textContent = team.team_name;
//     select.appendChild(opt);
//   });
// }

// document.getElementById("sem2TeamSelect").addEventListener("change", async (e) => {
//   const teamId = e.target.value;
//   if (!teamId) return;

//   const token = localStorage.getItem("token");

//   const res = await axios.get(`/mentor/teams/${teamId}/students`, {
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   renderStudentTable(res.data);
// });

// function renderStudentTable(students) {
//   const container = document.getElementById("studentTableContainer");

//   let html = `
//     <table class="w-full border">
//       <thead>
//         <tr class="bg-gray-100">
//           <th class="border p-2">Name</th>
//           <th class="border p-2">Register No</th>
//           <th class="border p-2">Dept</th>
//           <th class="border p-2">Section</th>
//           <th class="border p-2">Marks</th>
//         </tr>
//       </thead>
//       <tbody>
//   `;

//   students.forEach(s => {
//     html += `
//       <tr>
//         <td class="border p-2">${s.student_name}</td>
//         <td class="border p-2">${s.register_no}</td>
//         <td class="border p-2">${s.dept}</td>
//         <td class="border p-2">${s.section}</td>
//         <td class="border p-2">
//           <input 
//             type="number" 
//             class="mark-input border p-1 w-full"
//             data-id="${s.id}"
//             value="${s.sem2_review1 ?? ""}"
//           />
//         </td>
//       </tr>
//     `;
//   });

//   html += `</tbody></table>`;

//   container.innerHTML = html;

//   document.getElementById("submitSem2Marks").classList.remove("hidden");
// }

// document.getElementById("submitSem2Marks").addEventListener("click", async () => {
//   const teamId = document.getElementById("sem2TeamSelect").value;

//   const inputs = document.querySelectorAll(".mark-input");

//   const students = Array.from(inputs).map(input => ({
//     id: input.dataset.id,
//     mark: input.value ? Number(input.value) : null
//   }));

//   const token = localStorage.getItem("token");

//   await axios.post(`/mentor/teams/${teamId}/sem2-review1`, {
//     students
//   }, {
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   alert("Marks submitted successfully!");
// });

// async function loadWorkbookScores() {
//   try {
//     const token = localStorage.getItem('token');
//     const res = await axios.get('/mentor/workbook-scores', {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     const tableBody = document.getElementById('workbookScoreTableBody');
//     tableBody.innerHTML = '';

//     res.data.forEach(team => {
//       const leader = team.Students[0];
//       const tr = document.createElement('tr');
//       tr.innerHTML = `
//         <td class="border p-2">${team.team_name}</td>
//         <td class="border p-2">${leader.dept}</td>
//         <td class="border p-2">${leader.section}</td>
//         <td class="border p-2">${leader.sem2_workbook ?? '-'}</td>
//       `;
//       tableBody.appendChild(tr);
//     });

//   } catch (err) {
//     console.error('Error loading workbook scores:', err);
//   }
// }


// async function loadWorkbookTeams() {
//   try {
//     const token = localStorage.getItem('token');
//     const res = await axios.get('/mentor/teams', {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     const teamSelect = document.getElementById('workbookTeamSelect');
//     teamSelect.innerHTML = '<option value="">-- Select a team --</option>';

//     res.data.forEach(team => {
//       // Get leader (since include only leader details)
//       const leader = team.Students && team.Students[0];
//       const dept = leader ? leader.dept : 'N/A';
//       const section = leader ? leader.section : 'N/A';

//       const option = document.createElement('option');
//       option.value = team.UserId; // use UserId to update all students in team
//       option.textContent = `${team.team_name} - ${dept}-${section}`;
//       teamSelect.appendChild(option);
//     });

//   } catch (err) {
//     console.error('Error loading teams for workbook evaluation:', err);
//   }
// }


// Submit workbook score
// async function submitWorkbookScore() {
//   try {
//     const teamId = document.getElementById("workbookTeamSelect").value;
//     const score = document.getElementById("workbookScoreInput").value;

//     if (!teamId || !score) {
//       alert("Please select a team and enter a score.");
//       return;
//     }

//     const token = localStorage.getItem("token");
//     const res = await axios.post(
//       "/mentor/workbook-score",
//       { teamId, score },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     alert(res.data.message);
//     document.getElementById("workbookScoreInput").value = "";

//     // 🔄 Reload table after successful submission
//     await loadWorkbookScores();

//   } catch (err) {
//     console.error("Error submitting workbook score:", err);
//     alert(err.response?.data?.error || "Failed to submit workbook score");
//   }
// }

// document.getElementById("submitWorkbookScore").addEventListener("click", submitWorkbookScore);


const cancelBtn = document.getElementById("cancelPopupBtn");

if (cancelBtn) {
  cancelBtn.addEventListener("click", closeModal);
}

const batchSelect = document.getElementById("batchSelect");

if (batchSelect) {
  const label = document.getElementById("mentordept");
  const syncLabel = () => {
    if (label && batchSelect.selectedIndex >= 0) {
      label.textContent = batchSelect.options[batchSelect.selectedIndex].textContent;
    }
  };

  batchSelect.addEventListener("change", () => {
    const selectedBatch = batchSelect.value;
    syncLabel();
    console.log("Selected batch:", selectedBatch);
    loadTeams(selectedBatch);
  });

  syncLabel();
}

// Default batch
loadTeams("25ipd");
loadMentorDetails(); // gates Sem1-Sem4 review/workbook sections for coordinators
// loadSem2Teams();
// loadSem2Review2Teams();
// loadWorkbookTeams(); // load teams into workbook evaluation dropdown
// loadWorkbookScores()
// loadRubricsTeams();


const exportHistoryBtn = document.getElementById("exportHistoryExcel");

if (exportHistoryBtn) {
  exportHistoryBtn.addEventListener("click", exportReviewScoresExcel);
}

async function exportReviewScoresExcel() {
  try {
    // Fetch API data
   const token = localStorage.getItem("token");

    const res = await axios.get("/mentor/all-review-scores", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let reviewData = Array.isArray(res.data) ? res.data : [];

   // ================= TEAM ROLE LOGIC =================
// ================= TEAM ROLE LOGIC =================
const groupedByTeam = {};

reviewData.forEach((student) => {
  if (!groupedByTeam[student.teamId]) {
    groupedByTeam[student.teamId] = [];
  }

  groupedByTeam[student.teamId].push(student);
});

Object.values(groupedByTeam).forEach((members) => {
  let count = 1;

  members.forEach((m) => {
    if (!m.is_leader) {
      m.role = `Student ${count++}`;
    }
  });
});
    // ================= FORMAT DATA FOR EXCEL =================
   const excelData = reviewData.map((r, index) => {
      const r1 = r.review1score ?? 0;
      const r2 = r.review2score ?? 0;
      const wb = r.workbook_score ?? 0;

      const reviewTotal = r1 + r2;
      const total = r.total_score ?? reviewTotal + wb;

      return {
       "S No": index + 1,
        "Register No": r.register_no || "",
        "Student Name": r.name || "",
        Section: r.section || "",
        "Review 1 (30)": r1,
        "Review 2 (30)": r2,
        "Workbook (40)": wb,
        "Total (100)": total
      };
    });

    // ================= CREATE WORKBOOK =================
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Column widths
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 25 },
      { wch: 25 },
      { wch: 10 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Review Scores"
    );

    // ================= DOWNLOAD EXCEL =================
    XLSX.writeFile(workbook, "Review_Scores.xlsx");

  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export review scores");
  }
}

