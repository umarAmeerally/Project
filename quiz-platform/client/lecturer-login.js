const loginForm = document.getElementById("loginForm");
const messageDiv = document.getElementById("message");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

function setMessage(text, type = "") {
  messageDiv.textContent = text;
  messageDiv.className = type
    ? `status-message ${type}`
    : "status-message";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setMessage("Please enter both email and password.", "error");
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("lecturerLoggedIn", "true");
      localStorage.setItem("lecturerName", data.lecturer.name);
      localStorage.setItem("lecturerEmail", data.lecturer.email);

      setMessage("Login successful. Redirecting to dashboard...", "success");

      setTimeout(() => {
        window.location.href = "lecturer-dashboard.html";
      }, 500);
    } else {
      setMessage(data.message || "Login failed", "error");
    }
  } catch (error) {
    console.error("Lecturer login error:", error);
    setMessage("Server error during login", "error");
  }
});