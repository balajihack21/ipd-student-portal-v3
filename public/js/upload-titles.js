// Shared naming and semester grouping for team uploads (week_number -> deliverable).
const UPLOAD_TITLES = {
  1: "Problem Statement Canvas",
  2: "Affinity Diagram",
  3: "Idea Generation Canvas",
  4: "SWOT Analysis",
  5: "Value Proposition",
  6: "User Requirements",
  7: "Product Dimensions",
  8: "Performance Requirement",
  9: "Bill Of Materials",
  10: "2D Modelling",
  11: "3D Modelling",
  12: "DB Schema",
  13: "HLD",
  14: "Tech Stack Architecture",
  15: "User Flow Diagram",
  16: "Mock Up / Wireframe",
  17: "BMC Template",
  18: "Prototype Planning Canvas"
};

const UPLOAD_SEMESTERS = [
  { key: "sem1", label: "Semester 1", weeks: [1, 2, 3, 4, 5] },
  { key: "sem2", label: "Semester 2", weeks: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
  { key: "other", label: "Additional Submissions", weeks: [17, 18] }
];

function getUploadTitle(week) {
  return UPLOAD_TITLES[Number(week)] || `File ${week}`;
}

function getUploadSemester(week) {
  return UPLOAD_SEMESTERS.find(sem => sem.weeks.includes(Number(week))) ||
    UPLOAD_SEMESTERS[UPLOAD_SEMESTERS.length - 1];
}

// Returns [{ key, label, uploads }] for the semesters that actually have uploads.
function groupUploadsBySemester(uploads = []) {
  return UPLOAD_SEMESTERS
    .map(sem => ({
      key: sem.key,
      label: sem.label,
      uploads: uploads
        .filter(u => getUploadSemester(u.week_number).key === sem.key)
        .sort((a, b) => Number(a.week_number) - Number(b.week_number))
    }))
    .filter(group => group.uploads.length > 0);
}

// Delegated semester-group toggle handler (CSP-friendly: no inline handlers)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sem-btn]");
  if (!btn) return;
  // Content div is the next sibling element after the button
  let content = btn.nextElementSibling;
  // Fallback: find the first div sibling that isn't the button itself
  if (!content || content === btn) {
    const siblings = Array.from(btn.parentElement.children);
    content = siblings.find(el => el !== btn && el.tagName === "DIV");
  }
  if (content) content.classList.toggle("hidden");
});

window.UPLOAD_TITLES = UPLOAD_TITLES;
window.UPLOAD_SEMESTERS = UPLOAD_SEMESTERS;
window.getUploadTitle = getUploadTitle;
window.getUploadSemester = getUploadSemester;
window.groupUploadsBySemester = groupUploadsBySemester;