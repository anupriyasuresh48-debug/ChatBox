document.getElementById("registerForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const user = {
        name: document.getElementById("name").value,
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    try {

        const response = await fetch("http://localhost:3000/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(user)

        });

        const data = await response.json();

        alert(data.message);

        console.log(data);

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }

});