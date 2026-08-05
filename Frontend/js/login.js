document.getElementById("loginForm").addEventListener("submit", async function(event){

    event.preventDefault();

    const user={

        email:document.getElementById("email").value,

        password:document.getElementById("password").value

    };

    try{

        const response=await fetch("http://localhost:3000/login",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(user)

        });

        const data=await response.json();

        alert(data.message);

        if(data.success){

            localStorage.setItem("user",JSON.stringify(data.user));

            window.location.href="chat.html";

        }

    }catch(error){

        console.log(error);

        alert("Unable to Login");

    }

});