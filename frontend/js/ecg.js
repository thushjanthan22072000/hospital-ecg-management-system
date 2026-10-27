/* =========================================================
   ECG RECORDING PAGE
   Patient Profile + Reference / Visit Based
========================================================= */


/* =========================================================
   URL PARAMETERS
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


// When coming from Patient Details:
// /ecg.html?patient=P007

const initialPatient =
    params.get("patient");


// When directly searching a reference:
// /ecg.html?reference=000039

const initialReference =
    params.get("reference");


/* =========================================================
   ELEMENTS
========================================================= */

const searchForm =
    document.getElementById(
        "ecgSearchForm"
    );


const patientInfo =
    document.getElementById(
        "patientInfo"
    );


const formCard =
    document.getElementById(
        "ecgFormCard"
    );


const visitSelect =
    document.getElementById(
        "visitSelect"
    );


const patientMessage =
    document.getElementById(
        "ecgPatientMessage"
    );


const ecgMessage =
    document.getElementById(
        "ecgMessage"
    );


/*
   This stores the currently loaded
   patient + visit information.
*/

let currentPatient = null;


/* =========================================================
   LOGOUT
========================================================= */

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


/* =========================================================
   LIVE DATE AND TIME
========================================================= */

function updateClock() {

    const now =
        new Date();


    const timeElement =
        document.getElementById(
            "liveTime"
        );


    const dateElement =
        document.getElementById(
            "liveDate"
        );


    if (timeElement) {

        timeElement.textContent =
            now.toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );

    }


    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
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
   DIRECT SEARCH BY REFERENCE NUMBER
========================================================= */

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const referenceInput =
                document.getElementById(
                    "ecgReference"
                );


            const reference =
                referenceInput
                    ? referenceInput.value.trim()
                    : "";


            if (!reference) {

                showPatientMessage(
                    "Please enter a Reference / Visit Number.",
                    "error"
                );

                return;

            }


            await loadReference(
                reference
            );

        }
    );

}


/* =========================================================
   LOAD VISIT BY REFERENCE NUMBER
========================================================= */

async function loadReference(
    reference
) {

    try {

        showPatientMessage(
            "Loading visit...",
            "info"
        );


        /*
           Hide the ECG form until the
           reference is successfully loaded.
        */

        formCard.classList.add(
            "hidden"
        );


        patientInfo.classList.add(
            "hidden"
        );


        const response =
            await fetch(
                `/api/patients/reference/${encodeURIComponent(
                    reference
                )}`,
                {
                    credentials:
                        "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Reference number not found."
            );

        }


        currentPatient =
            data;


        displayPatient(
            data,
            reference
        );


    } catch (error) {

        console.error(
            "Load reference error:",
            error
        );


        showPatientMessage(
            error.message ||
            "Reference number not found.",
            "error"
        );


        patientInfo.classList.add(
            "hidden"
        );


        /*
           IMPORTANT:
           Keep the search card visible
           so the user can enter another
           reference number.
        */

        formCard.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   LOAD PATIENT FROM PATIENT PROFILE
========================================================= */

async function loadPatientForECG(
    patientCode
) {

    try {

        showPatientMessage(
            "Loading patient visits...",
            "info"
        );


        const response =
            await fetch(
                `/api/patients/${encodeURIComponent(
                    patientCode
                )}`,
                {
                    credentials:
                        "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load patient."
            );

        }


        currentPatient =
            data;


        displayPatientVisits(
            data
        );


    } catch (error) {

        console.error(
            "Patient loading error:",
            error
        );


        showPatientMessage(
            error.message ||
            "Unable to load patient.",
            "error"
        );

    }

}


/* =========================================================
   DISPLAY PATIENT + EXISTING VISITS
========================================================= */

function displayPatientVisits(
    data
) {

    const p =
        data.patient;


    /*
       Backend should return:

       data.visits

       But this also safely supports
       a single data.visit.
    */

    let visits = [];


    if (
        data.visits &&
        Array.isArray(
            data.visits
        )
    ) {

        visits =
            data.visits;

    }
    else if (
        data.visit
    ) {

        visits = [
            data.visit
        ];

    }


    /* =====================================================
       CHECK PATIENT
    ===================================================== */

    if (!p) {

        showPatientMessage(
            "Patient information could not be loaded.",
            "error"
        );

        return;

    }


    /* =====================================================
       DISPLAY PATIENT INFORMATION
    ===================================================== */

    patientInfo.innerHTML = `

        <div class="patient-summary-avatar">
            ♥
        </div>

        <div>

            <span class="eyebrow">
                PATIENT
            </span>

            <h3>
                ${escapeHTML(
                    p.patient_code
                )}
                ·
                ${escapeHTML(
                    p.name
                )}
            </h3>

            <p>

                DOB:
                ${formatDate(
                    p.dob
                )}

                &nbsp; | &nbsp;

                Age:
                ${escapeHTML(
                    p.age
                )}

                &nbsp; | &nbsp;

                Sex:
                ${escapeHTML(
                    p.sex
                )}

            </p>

        </div>

    `;


    patientInfo.classList.remove(
        "hidden"
    );


    /* =====================================================
       NO VISITS
    ===================================================== */

    if (
        visits.length === 0
    ) {

        showPatientMessage(
            "This patient has no visits available.",
            "error"
        );


        formCard.classList.add(
            "hidden"
        );


        return;

    }


    /* =====================================================
       CLEAR OLD VISITS
    ===================================================== */

    visitSelect.innerHTML = "";


    /* =====================================================
       ADD EXISTING VISITS
    ===================================================== */

    visits.forEach(
        visit => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                visit.visit_id;


            const destination =
                visit.destination_type ||
                "Pending";


            const visitType =
                visit.visit_type ||
                "OPD";


            option.textContent =
                `${visit.reference_number} — ${visitType} — ${formatDate(
                    visit.visit_date
                )} — ${destination}`;


            visitSelect.appendChild(
                option
            );

        }
    );


    /* =====================================================
       SHOW ECG FORM
    ===================================================== */

    formCard.classList.remove(
        "hidden"
    );


    showPatientMessage(
        "Patient loaded. Select the visit and record the ECG.",
        "success"
    );

}


/* =========================================================
   DISPLAY PATIENT + VISIT FROM REFERENCE SEARCH
========================================================= */

function displayPatient(
    data,
    reference
) {

    const p =
        data.patient;


    showPatientMessage(
        "Visit loaded successfully.",
        "success"
    );


    /* =====================================================
       PATIENT INFORMATION
    ===================================================== */

    patientInfo.innerHTML = `

        <div class="patient-summary-avatar">
            ♥
        </div>

        <div>

            <span class="eyebrow">
                PATIENT
            </span>

            <h3>
                ${escapeHTML(
                    p.patient_code
                )}
                ·
                ${escapeHTML(
                    p.name
                )}
            </h3>

            <p>

                DOB:
                ${formatDate(
                    p.dob
                )}

                &nbsp; | &nbsp;

                Age:
                ${escapeHTML(
                    p.age
                )}

                &nbsp; | &nbsp;

                Sex:
                ${escapeHTML(
                    p.sex
                )}

            </p>

        </div>

    `;


    patientInfo.classList.remove(
        "hidden"
    );


    /* =====================================================
       CLEAR OLD VISITS
    ===================================================== */

    visitSelect.innerHTML = "";


    let visits = [];


    /*
       Reference endpoint may return:

       data.visit

       OR

       data.visits
    */

    if (
        data.visits &&
        Array.isArray(
            data.visits
        )
    ) {

        visits =
            data.visits;

    }
    else if (
        data.visit
    ) {

        visits = [
            data.visit
        ];

    }


    /* =====================================================
       NO VISIT
    ===================================================== */

    if (
        visits.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            "";


        option.textContent =
            "No visit available";


        visitSelect.appendChild(
            option
        );


        formCard.classList.add(
            "hidden"
        );


        return;

    }


    /* =====================================================
       ADD MATCHING VISIT
    ===================================================== */

    visits.forEach(
        visit => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                visit.visit_id;


            const destination =
                visit.destination_type ||
                "Pending";


            option.textContent =
                `${visit.reference_number} — ${visit.visit_type || "OPD"} — ${formatDate(
                    visit.visit_date
                )} — ${destination}`;


            /*
               Automatically select the
               searched reference.
            */

            if (
                String(
                    visit.reference_number
                ) ===
                String(
                    reference
                )
            ) {

                option.selected =
                    true;

            }


            visitSelect.appendChild(
                option
            );

        }
    );


    formCard.classList.remove(
        "hidden"
    );

}


/* =========================================================
   SAVE ECG
========================================================= */

const ecgForm =
    document.getElementById(
        "ecgForm"
    );


if (ecgForm) {

    ecgForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /* =============================================
               CHECK PATIENT
            ============================================= */

            if (
                !currentPatient ||
                !currentPatient.patient
            ) {

                showECGMessage(
                    "Please load a patient or visit first.",
                    "error"
                );

                return;

            }


            /* =============================================
               GET SELECTED VISIT
            ============================================= */

            const selectedVisitId =
                Number(
                    visitSelect.value
                );


            if (!selectedVisitId) {

                showECGMessage(
                    "Please select a patient visit.",
                    "error"
                );

                return;

            }


            /* =============================================
               ECG RESULT
            ============================================= */

            const result =
                document
                    .getElementById(
                        "ecgResult"
                    )
                    .value
                    .trim();


            /* =============================================
               NOTES
            ============================================= */

            const notes =
                document
                    .getElementById(
                        "ecgNotes"
                    )
                    .value
                    .trim();


            /* =============================================
               DESTINATION
            ============================================= */

            const destination =
                document
                    .getElementById(
                        "destination"
                    )
                    .value;


            /* =============================================
               VALIDATE RESULT
            ============================================= */

            if (!result) {

                showECGMessage(
                    "Please enter the ECG result.",
                    "error"
                );

                return;

            }


            /* =============================================
               VALIDATE DESTINATION
            ============================================= */

            if (
                destination !== "WARD" &&
                destination !== "CLINIC" &&
                destination !== "HOME"
            ) {

                showECGMessage(
                    "Please select a valid destination.",
                    "error"
                );

                return;

            }


            /* =============================================
               DATA
            ============================================= */

            const data = {

                patientCode:
                    currentPatient
                        .patient
                        .patient_code,

                visitId:
                    selectedVisitId,

                result,

                notes,

                destination

            };


            try {

                showECGMessage(
                    "Saving ECG record...",
                    "info"
                );


                const response =
                    await fetch(
                        "/api/ecg",
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify(
                                    data
                                )
                        }
                    );


                const responseData =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        responseData.message ||
                        "Unable to save ECG."
                    );

                }


                /* =========================================
                   SUCCESS
                ========================================= */

                showECGMessage(
                    "ECG saved successfully.",
                    "success"
                );


                /*
                   Keep the same patient and
                   visit selected.

                   This allows multiple ECG
                   records for the same visit.
                */

                document
                    .getElementById(
                        "ecgResult"
                    )
                    .value = "";


                document
                    .getElementById(
                        "ecgNotes"
                    )
                    .value = "";


                document
                    .getElementById(
                        "destination"
                    )
                    .value = "";


            } catch (error) {

                console.error(
                    "Save ECG error:",
                    error
                );


                showECGMessage(
                    error.message ||
                    "Unable to save ECG.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   AUTO LOAD PATIENT OR REFERENCE
========================================================= */

if (initialPatient) {

    /*
       Patient came from Patient Details.

       Example:

       /ecg.html?patient=P007

       Since the patient is already known,
       hide the reference search box.
    */

    const searchCard =
        searchForm
            ? searchForm.closest(
                ".content-card"
            )
            : null;


    if (searchCard) {

        searchCard.style.display =
            "none";

    }


    loadPatientForECG(
        initialPatient
    );


}
else if (initialReference) {

    /*
       Direct reference workflow.

       Example:

       /ecg.html?reference=000039
    */

    const referenceInput =
        document.getElementById(
            "ecgReference"
        );


    if (referenceInput) {

        referenceInput.value =
            initialReference;

    }


    loadReference(
        initialReference
    );

}


/* =========================================================
   PATIENT MESSAGE
========================================================= */

function showPatientMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "ecgPatientMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "message";


    if (type) {

        element.classList.add(
            type
        );

    }


    element.style.display =
        "block";

}


/* =========================================================
   ECG MESSAGE
========================================================= */

function showECGMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "ecgMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "message";


    if (type) {

        element.classList.add(
            type
        );

    }


    element.style.display =
        "block";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const text =
        String(value);


    /*
       Handle MySQL DATE safely:

       2026-09-27
    */

    const match =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    if (match) {

        const year =
            match[1];

        const month =
            match[2];

        const day =
            match[3];


        return `${day}/${month}/${year}`;

    }


    return new Date(
        value
    ).toLocaleDateString(
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