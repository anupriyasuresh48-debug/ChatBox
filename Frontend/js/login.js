document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    // Prevent double submissions
    const submitBtn = event.target.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    // Detect environment dynamically (uses Render in production, localhost in development)
    const BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://chatbox-jibs.onrender.com";

    const user = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Save user profile details to localStorage
            localStorage.setItem("user", JSON.stringify(data.user));

            alert(data.message || "Login Successful 🎉");
            window.location.href = "chat.html";
        } else {
            // Handle credentials error or invalid inputs
            alert(data.message || "Login failed. Please check your email and password.");
        }

    } catch (error) {
        console.error("Login Error:", error);
        alert("Unable to connect to the server. Please check your internet connection or server status.");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});