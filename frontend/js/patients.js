/* =========================================================
   HOSPITAL ECG SYSTEM - PATIENTS
========================================================= */

const logoutButton = document.getElementById("logoutButton");
const referenceForm = document.getElementById("referenceForm");
const referenceSearch = document.getElementById("referenceSearch");
const referenceMessage = document.getElementById("referenceMessage");
const referenceResult = document.getElementById("referenceResult");
const viewAllPatientsButton =
    document.getElementById("viewAllPatientsButton");


/* =========================================================
   LOGIN / USER
========================================================= */

async function loadCurrentUser() {

    try {

        const response = await fetch("/api/me", {
            credentials: "include",
            cache: "no-store"
        });

        if (!response.ok) {
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();

        const userName =
            document.getElementById("userName");

        if (userName && data.user) {
            userName.textContent =
                data.user.username;
        }

    } catch (error) {

        console.error(
            "User loading error:",
            error
        );

        window.location.href =
            "/login.html";
    }
}

loadCurrentUser();


/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

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


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const now = new Date();

    const currentTime =
        document.getElementById("currentTime");

    const currentDate =
        document.getElementById("currentDate");

    if (currentTime) {

        currentTime.textContent =
            now.toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );
    }

    if (currentDate) {

        currentDate.textContent =
            now.toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            );
    }
}

updateClock();

setInterval(
    updateClock,
    1000
);


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "") {

    const element =
        document.getElementById("referenceMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className = "message";

    if (type) {
        element.classList.add(type);
    }

    element.style.display = "block";
}


/* =========================================================
   CLEAR MESSAGE
========================================================= */

function clearMessage() {

    const message =
        document.getElementById("referenceMessage");

    if (!message) {
        return;
    }

    message.textContent = "";
    message.className = "message";
    message.style.display = "none";
}


/* =========================================================
   SEARCH REFERENCE
========================================================= */

if (referenceForm) {

    referenceForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const reference =
                referenceSearch.value.trim();

            referenceResult.innerHTML = "";

            clearMessage();

            if (!reference) {

                showMessage(
                    "Please enter a reference number.",
                    "error"
                );

                return;
            }

            showMessage(
                "Checking reference...",
                "info"
            );

            try {

                const response =
                    await fetch(
                        `/api/patients/reference/${encodeURIComponent(reference)}`,
                        {
                            credentials: "include",
                            cache: "no-store"
                        }
                    );

                const data =
                    await response.json();

                /* =========================================
                   EXISTING PATIENT
                ========================================= */

                if (
                    response.ok &&
                    data.exists
                ) {

                    showExistingPatient(data);

                    return;
                }


                /* =========================================
                   NEW REFERENCE
                ========================================= */

                if (
                    response.status === 404
                ) {

                    showMessage(
                        "Reference not found. Opening registration...",
                        "info"
                    );

                    setTimeout(
                        function () {

                            window.location.href =
                                `/register-patient.html?reference=${encodeURIComponent(reference)}`;

                        },
                        500
                    );

                    return;
                }


                throw new Error(
                    data.message ||
                    "Unable to check reference."
                );

            } catch (error) {

                console.error(
                    "Reference search error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to check reference.",
                    "error"
                );
            }

        }
    );
}


/* =========================================================
   VIEW ALL PATIENTS
========================================================= */

if (viewAllPatientsButton) {

    viewAllPatientsButton.addEventListener(
        "click",
        function () {

            loadAllPatients();

        }
    );
}


/* =========================================================
   LOAD ALL PATIENTS
========================================================= */

async function loadAllPatients() {

    /*
       IMPORTANT:
       Clear the old message first.
    */

    clearMessage();

    referenceResult.innerHTML = "";

    if (referenceSearch) {
        referenceSearch.value = "";
    }

    showMessage(
        "Loading all registered patients...",
        "info"
    );

    try {

        const response =
            await fetch(
                "/api/patients/all",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        console.log(
            "All patients response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load patients."
            );
        }

        if (
            !data.patients ||
            data.patients.length === 0
        ) {

            clearMessage();

            referenceResult.innerHTML = `

                <div class="reference-result-card">

                    <div class="no-results">

                        <strong>
                            No patients registered
                        </strong>

                        <p>
                            There are currently no patients
                            in the system.
                        </p>

                    </div>

                </div>

            `;

            return;
        }

        renderAllPatients(
            data.patients
        );

        showMessage(
            `${data.patients.length} patient(s) found.`,
            "success"
        );

    } catch (error) {

        console.error(
            "Load all patients error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load patients.",
            "error"
        );
    }
}


/* =========================================================
   RENDER PATIENT TABLE
========================================================= */

function renderAllPatients(
    patients
) {

    let html = `

        <div class="reference-result-card all-patients-card">

            <div class="reference-result-header">

                <div>

                    <span class="eyebrow">
                        PATIENT LIST
                    </span>

                    <h3>
                        All Registered Patients
                    </h3>

                </div>

                <span class="status-badge opd">
                    ${patients.length} PATIENTS
                </span>

            </div>


            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>
                                Patient ID
                            </th>

                            <th>
                                Patient Name
                            </th>

                            <th>
                                Date of Birth
                            </th>

                            <th>
                                Age
                            </th>

                            <th>
                                Sex
                            </th>

                            <th>
                                NIC
                            </th>

                            <th>
                                Address
                            </th>

                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>
    `;


    patients.forEach(
        function (patient) {

            html += `

                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                patient.patient_code
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            patient.name
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            patient.dob
                        )}
                    </td>

                    <td>
                        ${
                            patient.age !== null &&
                            patient.age !== undefined
                                ? escapeHTML(patient.age)
                                : "-"
                        }
                    </td>

                    <td>
                        ${escapeHTML(
                            patient.sex
                        )}
                    </td>

                    <td>
                        ${
                            patient.nic
                                ? escapeHTML(patient.nic)
                                : "-"
                        }
                    </td>

                    <td>
                        ${
                            patient.address
                                ? escapeHTML(patient.address)
                                : "-"
                        }
                    </td>

                    <td>

                        <button
                            type="button"
                            class="table-view-button"
                            onclick="viewPatient('${escapeAttribute(patient.patient_code)}')"
                        >
                            👤 View
                        </button>

                    </td>

                </tr>

            `;

        }
    );


    html += `

                    </tbody>

                </table>

            </div>

        </div>

    `;

    referenceResult.innerHTML =
        html;

}


/* =========================================================
   VIEW PATIENT
========================================================= */

function viewPatient(
    patientCode
) {

    window.location.href =
        `/patient.html?id=${encodeURIComponent(patientCode)}`;

}


/* =========================================================
   EXISTING PATIENT
========================================================= */

function showExistingPatient(
    data
) {

    const patient =
        data.patient;

    const visit =
        data.visit;

    let location =
        visit.destination_type;

    if (!location) {

        location =
            visit.visit_type ||
            "OPD";
    }

    showMessage(
        "This reference already exists. This patient should not be registered again.",
        "info"
    );

    referenceResult.innerHTML = `

        <div class="reference-result-card">

            <div class="reference-result-header">

                <div>

                    <span class="eyebrow">
                        REFERENCE FOUND
                    </span>

                    <h3>
                        This Patient Already Exists
                    </h3>

                </div>

                <span class="status-badge ${getLocationClass(location)}">
                    ${escapeHTML(location)}
                </span>

            </div>


            <div class="reference-details">

                <div class="reference-detail">

                    <span>
                        Patient ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            patient.patient_code
                        )}
                    </strong>

                </div>


                <div class="reference-detail">

                    <span>
                        Patient Name
                    </span>

                    <strong>
                        ${escapeHTML(
                            patient.name
                        )}
                    </strong>

                </div>


                <div class="reference-detail">

                    <span>
                        Reference Number
                    </span>

                    <strong>
                        ${escapeHTML(
                            visit.reference_number
                        )}
                    </strong>

                </div>


                <div class="reference-detail">

                    <span>
                        Current Location
                    </span>

                    <strong>
                        ${escapeHTML(location)}
                    </strong>

                </div>

            </div>


            <div class="patient-action-area">

                <button
                    type="button"
                    class="primary-button"
                    onclick="viewPatient('${escapeAttribute(patient.patient_code)}')"
                >
                    👤 View Patient Details
                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   LOCATION CLASS
========================================================= */

function getLocationClass(
    location
) {

    const value =
        String(location || "")
            .toLowerCase();

    if (value === "ward") {
        return "ward";
    }

    if (value === "clinic") {
        return "clinic";
    }

    if (value === "home") {
        return "home";
    }

    return "opd";
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(value);
    }

    return date.toLocaleDateString(
        "en-GB"
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );
}