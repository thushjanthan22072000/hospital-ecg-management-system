const form =
    document.getElementById("loginForm");

const username =
    document.getElementById("username");

const password =
    document.getElementById("password");

const button =
    document.getElementById("loginButton");

const message =
    document.getElementById("loginMessage");

const showPassword =
    document.getElementById("showPassword");


/* =========================================================
   CLEAR LOGIN FIELDS WHEN PAGE OPENS
========================================================= */

window.addEventListener(
    "pageshow",
    () => {

        username.value = "";
        password.value = "";

        password.type = "password";

        if (showPassword) {
            showPassword.textContent = "👁";
        }

        message.textContent = "";
        message.className = "message";

        button.disabled = false;

        button.textContent =
            "Sign In to ECG Room";

    }
);


/* =========================================================
   SHOW / HIDE PASSWORD
========================================================= */

if (showPassword) {

    showPassword.addEventListener(
        "click",
        () => {

            if (
                password.type === "password"
            ) {

                password.type = "text";

                showPassword.textContent =
                    "🙈";

            } else {

                password.type = "password";

                showPassword.textContent =
                    "👁";
            }

        }
    );

}


/* =========================================================
   LOGIN
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        message.textContent = "";

        message.className =
            "message";


        const enteredUsername =
            username.value.trim();

        const enteredPassword =
            password.value;


        if (
            !enteredUsername ||
            !enteredPassword
        ) {

            message.textContent =
                "Please enter username and password.";

            message.className =
                "message error";

            return;
        }


        button.disabled = true;

        button.textContent =
            "Signing in...";


        try {

            const response =
                await fetch(
                    "/api/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify({

                                username:
                                    enteredUsername,

                                password:
                                    enteredPassword

                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );

            }


            message.textContent =
                "Login successful.";

            message.className =
                "message success";


            /*
             * Clear password after successful login
             */

            password.value = "";


            setTimeout(
                () => {

                    window.location.href =
                        "/dashboard.html";

                },
                400
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            message.textContent =
                error.message ||
                "Unable to login.";

            message.className =
                "message error";


            button.disabled =
                false;

            button.textContent =
                "Sign In to ECG Room";

        }

    }
);