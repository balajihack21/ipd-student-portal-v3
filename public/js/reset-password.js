document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const userId = localStorage.getItem("userId");
  const resetMessage = document.getElementById("resetMessage");

  if (!newPassword || !confirmPassword) {
    resetMessage.textContent = "Please fill in all fields.";
    resetMessage.classList.remove("text-green-600");
    resetMessage.classList.add("text-red-600");
    return;
  }

  if (newPassword !== confirmPassword) {
    resetMessage.textContent = "Passwords do not match.";
    resetMessage.classList.remove("text-green-600");
    resetMessage.classList.add("text-red-600");
    return;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = localStorage.getItem("userId"); // only for first login flow

    let response;

    if (token) {
      // Forgot password flow
      response = await axios.post(`/api/auth/reset-password/${token}`, {
        newPassword,
      });
    } else if (userId) {
      // First login flow
      response = await axios.post("/api/auth/reset-password", {
        userId,
        newPassword,
      });
    } else {
      resetMessage.textContent = "Invalid reset request.";
      resetMessage.className = "text-red-600";
      return;
    }

    resetMessage.textContent = "Password updated successfully. Redirecting...";
    resetMessage.className = "text-green-600";

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);

  } catch (err) {
    resetMessage.textContent = err.response?.data?.message || "Reset failed";
    resetMessage.className = "text-red-600";
  }
});


function setupPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);

  toggle.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggle.textContent = isPassword ? "🙈" : "👁️";
  });
}

// Apply to both fields
setupPasswordToggle("toggleNewPassword", "newPassword");
setupPasswordToggle("toggleConfirmPassword", "confirmPassword");
