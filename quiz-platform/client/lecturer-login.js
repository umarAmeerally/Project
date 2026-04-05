const loginForm = document.getElementById("loginForm");
const messageDiv = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

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

      window.location.href = "lecturer-dashboard.html";
    } else {
      messageDiv.textContent = data.message || "Login failed";
      messageDiv.style.color = "red";
    }
  } catch (error) {
    messageDiv.textContent = "Server error during login";
    messageDiv.style.color = "red";
    console.error(error);
  }
});