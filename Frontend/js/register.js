document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    // Prevent double submissions
    const submitBtn = event.target.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    // Detect environment dynamically (uses Render in production, localhost in development)
    // REPLACE 'YOUR-ACTUAL-RENDER-BACKEND-NAME' with your real backend service link on Render
    const BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://chatbox-jibs.onrender.com";

    const user = {
        name: document.getElementById("name").value.trim(),
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };

    try {
        // Verify whether your backend route is '/register' or '/api/register'
        const response = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Account created successfully! 🎉");
            window.location.href = "login.html";
        } else {
            alert(data.message || "Registration failed. Please try again.");
        }

        console.log(data);

    } catch (error) {
        console.error("Registration Error:", error);
        alert("Unable to connect to the server. Please check your internet connection or server status.");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});