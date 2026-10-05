document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const loginBtn = document.getElementById("loginBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");

  loginBtn.disabled = true;
  btnText.textContent = "Logging in...";
  btnSpinner.classList.remove("hidden");

  try {
    const response = await axios.post("/api/auth/login", { email, password });
    const { role, token, firstLogin, userId } = response.data;

    if (firstLogin) {
      localStorage.setItem("userId", userId);
      window.location.href = "/reset-password.html";
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
    }

    // Redirect based on role
   if (role === "admin") {
  window.location.href = "/admin-dashboard.html";
} else if (role === "mentor") {
  window.location.href = "/mentor-dashboard.html";
} else {
  window.location.href = "/dashboard.html";
}


  } catch (error) {
    const errorMsg = error.response?.data?.message || "Login failed";
    document.getElementById("error").innerText = errorMsg;
  } finally {
    loginBtn.disabled = false;
    btnText.textContent = "Login";
    btnSpinner.classList.add("hidden");
  }
});


const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";

  // Toggle icon (👁️ / 🙈) 
  togglePassword.textContent = isPassword ? "🙈" : "👁️";
});


document.getElementById("forgotPassword").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  if (!email) {
    alert("Please enter your email first");
    return;
  }

  try {
    const res = await axios.post("/api/auth/forgot-password", { email });
    alert(res.data.message);
  } catch (err) {
    alert(err.response?.data?.message || "Error sending reset email");
  }
});


