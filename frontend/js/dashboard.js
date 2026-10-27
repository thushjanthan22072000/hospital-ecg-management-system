// =====================================================
// DASHBOARD JAVASCRIPT
// =====================================================


// =====================================================
// CHECK LOGIN
// =====================================================

async function checkLogin() {

    try {

        const response = await fetch(
            "/api/me",
            {
                credentials: "include",
                cache: "no-store"
            }
        );


        if (!response.ok) {

            window.location.href = "/login.html";

            return null;
        }


        const data = await response.json();


        // Show username
        const loggedUser =
            document.getElementById("loggedUser");

        if (loggedUser) {

            loggedUser.textContent =
                data.user.username;
        }


        // Show role
        const loggedRole =
            document.getElementById("loggedRole");

        if (loggedRole) {

            loggedRole.textContent =
                data.user.role === "ECG_DOCTOR"
                    ? "ECG Doctor"
                    : "ECG Staff";
        }


        return data.user;

    } catch (error) {

        console.error(
            "Login check error:",
            error
        );

        window.location.href =
            "/login.html";

        return null;
    }
}



// =====================================================
// LOAD DASHBOARD STATISTICS
// =====================================================

async function loadDashboard() {

    try {

        console.log(
            "Loading dashboard..."
        );


        const response = await fetch(
            "/api/dashboard",
            {
                credentials: "include",
                cache: "no-store"
            }
        );


        console.log(
            "Dashboard response status:",
            response.status
        );


        if (!response.ok) {

            console.error(
                "Dashboard API failed:",
                response.status
            );

            return;
        }


        const data =
            await response.json();


        console.log(
            "Dashboard data:",
            data
        );


        // =============================================
        // TOTAL PATIENTS
        // =============================================

        const totalPatients =
            document.getElementById(
                "totalPatients"
            );

        if (totalPatients) {

            totalPatients.textContent =
                data.patients;
        }


        // =============================================
        // TOTAL VISITS
        // =============================================

        const totalVisits =
            document.getElementById(
                "totalVisits"
            );

        if (totalVisits) {

            totalVisits.textContent =
                data.visits;
        }


        // =============================================
        // TOTAL ECG RECORDS
        // =============================================

        const totalECGs =
            document.getElementById(
                "totalECGs"
            );

        if (totalECGs) {

            totalECGs.textContent =
                data.ecgs;
        }


        // =============================================
        // TODAY'S ECGs
        // =============================================

        const todayECGs =
            document.getElementById(
                "todayECGs"
            );

        if (todayECGs) {

            todayECGs.textContent =
                data.today;
        }


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );
    }
}



// =====================================================
// CLOCK
// =====================================================

function updateClock() {

    const now =
        new Date();


    const currentTime =
        document.getElementById(
            "currentTime"
        );

    const currentDate =
        document.getElementById(
            "currentDate"
        );


    if (currentTime) {

        currentTime.textContent =
            now.toLocaleTimeString(
                "en-GB"
            );
    }


    if (currentDate) {

        currentDate.textContent =
            now.toLocaleDateString(
                "en-GB",
                {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
    }
}



// =====================================================
// LOGOUT
// =====================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }


            window.location.href =
                "/login.html";
        }
    );
}



// =====================================================
// START DASHBOARD
// =====================================================

async function start() {

    console.log(
        "Dashboard JavaScript started."
    );


    // Start clock immediately
    updateClock();


    // Keep clock running
    setInterval(
        updateClock,
        1000
    );


    // Check login
    const user =
        await checkLogin();


    if (!user) {

        return;
    }


    // Load statistics
    await loadDashboard();
}



// Start
start();