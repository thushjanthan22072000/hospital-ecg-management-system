/* =========================================================
   GET PATIENT ID FROM URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const patientCode =
    params.get("id");


const container =
    document.getElementById(
        "patientContainer"
    );


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutButton")
    .addEventListener(
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


/* =========================================================
   LOAD PATIENT
========================================================= */

async function loadPatient() {

    if (!patientCode) {

        container.innerHTML = `
            <div class="message error">
                Patient ID is missing.
            </div>
        `;

        return;
    }


    try {

        const response =
            await fetch(
                `/api/patients/${encodeURIComponent(
                    patientCode
                )}`,
                {
                    credentials: "include"
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


        renderPatient(data);

    } catch (error) {

        console.error(
            "Patient loading error:",
            error
        );


        container.innerHTML = `
            <div class="message error">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;
    }
}


/* =========================================================
   RENDER PATIENT
========================================================= */

function renderPatient(data) {

    const p =
        data.patient;


    /* =====================================================
       VISIT HISTORY
    ====================================================== */

    let visitsHTML = "";


    if (
        !data.visits ||
        data.visits.length === 0
    ) {

        visitsHTML = `
            <div class="empty-state">
                No visits found.
            </div>
        `;

    } else {

        visitsHTML = `

            <div class="table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Reference
                            </th>

                            <th>
                                Source
                            </th>

                            <th>
                                Destination
                            </th>

                            <th>
                                Visit Date
                            </th>

                            <th>
                                Created
                            </th>

                        </tr>

                    </thead>


                    <tbody>

        `;


        data.visits.forEach(
            visit => {

                visitsHTML += `

                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    visit.reference_number
                                )}
                            </strong>

                        </td>


                        <td>

                            <span class="badge opd">
                                ${escapeHTML(
                                    visit.visit_type ||
                                    "OPD"
                                )}
                            </span>

                        </td>


                        <td>

                            ${
                                visit.destination_type
                                ? `
                                    <span class="badge destination">
                                        ${escapeHTML(
                                            visit.destination_type
                                        )}
                                    </span>
                                `
                                : `
                                    <span class="pending-text">
                                        Pending
                                    </span>
                                `
                            }

                        </td>


                        <td>
                            ${formatDate(
                                visit.visit_date
                            )}
                        </td>


                        <td>
                            ${formatDateTime(
                                visit.created_at
                            )}
                        </td>

                    </tr>

                `;
            }
        );


        visitsHTML += `

                    </tbody>

                </table>

            </div>

        `;
    }


    /* =====================================================
       ECG HISTORY
    ====================================================== */

    let ecgHTML = "";


    if (
        !data.ecgs ||
        data.ecgs.length === 0
    ) {

        ecgHTML = `

            <div class="empty-ecg">

                <div class="empty-ecg-icon">
                    ♥
                </div>

                <h3>
                    No ECG Records
                </h3>

                <p>
                    No ECG recordings have been
                    saved for this patient yet.
                </p>

            </div>

        `;

    } else {

        ecgHTML = `

            <div class="ecg-history-list">

        `;


        data.ecgs.forEach(
            (ecg, index) => {

                const destination =
                    ecg.destination_type ||
                    "Not assigned";


                const result =
                    ecg.result ||
                    "No result recorded.";


                const notes =
                    ecg.notes ||
                    "No additional notes.";


                ecgHTML += `

                    <article class="ecg-history-card">


                        <!-- =================================
                             ECG HEADER
                        ================================== -->

                        <div class="ecg-history-header">

                            <div>

                                <span class="ecg-record-label">
                                    ECG RECORD
                                    ${data.ecgs.length - index}
                                </span>


                                <h3 class="ecg-record-date">

                                    ${formatDate(
                                        ecg.ecg_date
                                    )}

                                    <span>•</span>

                                    ${formatTime(
                                        ecg.ecg_time
                                    )}

                                </h3>

                            </div>


                            <div class="ecg-destination-badge">

                                ${escapeHTML(
                                    destination
                                )}

                            </div>

                        </div>


                        <!-- =================================
                             ECG BASIC INFORMATION
                        ================================== -->

                        <div class="ecg-meta-grid">


                            <div class="ecg-meta-item">

                                <span>
                                    REFERENCE
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        ecg.reference_number
                                    )}
                                </strong>

                            </div>


                            <div class="ecg-meta-item">

                                <span>
                                    VISIT SOURCE
                                </span>

                                <strong>
                                    OPD
                                </strong>

                            </div>


                            <div class="ecg-meta-item">

                                <span>
                                    DESTINATION
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        destination
                                    )}
                                </strong>

                            </div>


                        </div>


                        <!-- =================================
                             ECG RESULT
                        ================================== -->

                        <div class="ecg-detail-box">

                            <div class="ecg-detail-title">

                                <span class="detail-icon">
                                    ♥
                                </span>

                                ECG RESULT

                            </div>


                            <div class="ecg-detail-text">

                                ${formatMultiline(
                                    result
                                )}

                            </div>

                        </div>


                        <!-- =================================
                             NOTES
                        ================================== -->

                        <div class="ecg-detail-box notes-box">

                            <div class="ecg-detail-title">

                                <span class="detail-icon">
                                    ▤
                                </span>

                                NOTES

                            </div>


                            <div class="ecg-detail-text">

                                ${formatMultiline(
                                    notes
                                )}

                            </div>

                        </div>


                    </article>

                `;
            }
        );


        ecgHTML += `

            </div>

        `;
    }


    /* =====================================================
       COMPLETE PATIENT PAGE
    ====================================================== */

    container.innerHTML = `

        <!-- ===============================================
             PATIENT HEADER
        ================================================ -->

        <section class="patient-header-card">


            <div class="patient-avatar">
                ♥
            </div>


            <div class="patient-header-info">

                <span class="eyebrow">
                    PERMANENT PATIENT ID
                </span>


                <h2>
                    ${escapeHTML(
                        p.patient_code
                    )}
                </h2>


                <h3>
                    ${escapeHTML(
                        p.name
                    )}
                </h3>

            </div>


            <a
                class="primary-button small-button"
                href="/ecg.html?patient=${encodeURIComponent(
                    p.patient_code
                )}"
            >
                ♥ Record ECG
            </a>


        </section>


        <!-- ===============================================
             PERSONAL INFORMATION
        ================================================ -->

        <section class="content-card">

            <div class="card-title">

                <div>

                    <span class="eyebrow">
                        PERSONAL INFORMATION
                    </span>

                    <h2>
                        Patient Details
                    </h2>

                </div>

            </div>


            <div class="details-grid">


                <div>

                    <small>
                        Patient ID
                    </small>

                    <strong>
                        ${escapeHTML(
                            p.patient_code
                        )}
                    </strong>

                </div>


                <div>

                    <small>
                        Full Name
                    </small>

                    <strong>
                        ${escapeHTML(
                            p.name
                        )}
                    </strong>

                </div>


                <div>

                    <small>
                        Date of Birth
                    </small>

                    <strong>
                        ${formatDate(
                            p.dob
                        )}
                    </strong>

                </div>


                <div>

                    <small>
                        Age
                    </small>

                    <strong>
                        ${escapeHTML(
                            String(p.age)
                        )} years
                    </strong>

                </div>


                <div>

                    <small>
                        Sex
                    </small>

                    <strong>
                        ${escapeHTML(
                            p.sex
                        )}
                    </strong>

                </div>


                <div>

                    <small>
                        NIC
                    </small>

                    <strong>

                        ${
                            p.nic
                                ? escapeHTML(
                                    p.nic
                                )
                                : "Not available"
                        }

                    </strong>

                </div>


                <div class="full">

                    <small>
                        Address
                    </small>

                    <strong>

                        ${
                            p.address
                                ? escapeHTML(
                                    p.address
                                )
                                : "Not available"
                        }

                    </strong>

                </div>


            </div>

        </section>


        <!-- ===============================================
             VISIT HISTORY
        ================================================ -->

        <section class="content-card">

            <div class="card-title">

                <div>

                    <span class="eyebrow">
                        VISIT HISTORY
                    </span>

                    <h2>
                        Patient Visits
                    </h2>

                </div>

            </div>


            ${visitsHTML}

        </section>


        <!-- ===============================================
             ECG HISTORY
        ================================================ -->

        <section class="content-card patient-ecg-section">

            <div class="card-title">

                <div>

                    <span class="eyebrow">
                        ECG HISTORY
                    </span>

                    <h2>
                        ECG Records
                    </h2>

                    <p>
                        Previous ECG recordings
                        for this patient.
                    </p>

                </div>

            </div>


            ${ecgHTML}

        </section>

    `;
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    return new Date(
        value
    ).toLocaleDateString(
        "en-GB"
    );
}


/* =========================================================
   DATE + TIME
========================================================= */

function formatDateTime(value) {

    if (!value) {
        return "—";
    }


    return new Date(
        value
    ).toLocaleString(
        "en-GB"
    );
}


/* =========================================================
   TIME
========================================================= */

function formatTime(value) {

    if (!value) {
        return "—";
    }


    const text =
        String(value);


    const match =
        text.match(
            /^(\d{2}):(\d{2})(?::(\d{2}))?/
        );


    if (!match) {
        return text;
    }


    const hours =
        Number(match[1]);


    const minutes =
        match[2];


    const seconds =
        match[3] || "00";


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    const displayHour =
        hours % 12 || 12;


    return `
        ${String(
            displayHour
        ).padStart(2, "0")}:${minutes}:${seconds} ${period}
    `;
}


/* =========================================================
   MULTILINE TEXT
========================================================= */

function formatMultiline(value) {

    return escapeHTML(
        String(
            value || ""
        )
    ).replace(
        /\r?\n/g,
        "<br>"
    );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value)

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
   START
========================================================= */

loadPatient();