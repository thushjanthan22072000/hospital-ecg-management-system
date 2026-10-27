// ===============================
// LOGOUT
// ===============================

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
                console.error("Logout error:", error);
            }

            window.location.href =
                "/login.html";
        }
    );


// ===============================
// HISTORY SEARCH
// ===============================

document
    .getElementById("historyForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            // Get Reference / Visit Number
            const reference =
                document.getElementById(
                    "historyReference"
                ).value.trim();


            const message =
                document.getElementById(
                    "historyMessage"
                );


            const container =
                document.getElementById(
                    "historyContainer"
                );


            // Clear previous result
            container.innerHTML = "";


            if (!reference) {

                message.textContent =
                    "Please enter a reference number.";

                message.className =
                    "message error";

                message.style.display =
                    "block";

                return;
            }


            try {

                message.textContent =
                    "Searching ECG history...";

                message.className =
                    "message";

                message.style.display =
                    "block";


                // Search by Reference Number
                const response =
                    await fetch(
                        `/api/ecg/history/${encodeURIComponent(
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
                        "Unable to load ECG history."
                    );
                }


                message.textContent =
                    "ECG history loaded successfully.";

                message.className =
                    "message success";

                message.style.display =
                    "block";


                renderHistory(data);


            } catch (error) {

                console.error(
                    "History search error:",
                    error
                );


                message.textContent =
                    error.message ||
                    "Unable to load ECG history.";

                message.className =
                    "message error";

                message.style.display =
                    "block";


                container.innerHTML = "";
            }
        }
    );


// ===============================
// RENDER HISTORY
// ===============================

function renderHistory(data) {

    const p =
        data.patient;

    const visit =
        data.visit;

    const ecgs =
        data.ecgs || [];


    let ecgRows = "";


    ecgs.forEach(
        ecg => {

            ecgRows += `

                <tr>

                    <td>
                        ${formatDate(
                            ecg.ecg_date
                        )}
                    </td>

                    <td>
                        <strong>
                            ${formatTime(
                                ecg.ecg_time
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            visit.reference_number
                        )}
                    </td>

                    <td>
                        ${
                            ecg.result
                                ? escapeHTML(
                                    ecg.result
                                  )
                                : "—"
                        }
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
                                : "—"
                        }
                    </td>

                    <td>
                        ${
                            ecg.notes
                                ? escapeHTML(
                                    ecg.notes
                                  )
                                : "—"
                        }
                    </td>

                </tr>
            `;
        }
    );


    if (!ecgRows) {

        ecgRows = `
            <tr>
                <td
                    colspan="6"
                    class="table-empty"
                >
                    No ECG records found for this visit.
                </td>
            </tr>
        `;
    }


    document.getElementById(
        "historyContainer"
    ).innerHTML = `

        <!-- PATIENT INFORMATION -->

        <section class="patient-header-card">

            <div class="patient-avatar">
                ♥
            </div>


            <div class="patient-header-info">

                <span class="eyebrow">
                    PATIENT
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

        </section>


        <!-- VISIT INFORMATION -->

        <section class="content-card">

            <div class="card-title">

                <div>

                    <span class="eyebrow">
                        VISIT INFORMATION
                    </span>

                    <h2>
                        Reference Details
                    </h2>

                </div>

            </div>


            <div class="reference-details">

                <div>
                    <span>
                        Reference Number
                    </span>

                    <strong>
                        ${escapeHTML(
                            visit.reference_number
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        Visit Type
                    </span>

                    <strong>
                        ${escapeHTML(
                            visit.visit_type
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        Visit Date
                    </span>

                    <strong>
                        ${formatDate(
                            visit.visit_date
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        Destination
                    </span>

                    <strong>
                        ${
                            visit.destination_type
                                ? escapeHTML(
                                    visit.destination_type
                                  )
                                : "Not assigned"
                        }
                    </strong>
                </div>

            </div>

        </section>


        <!-- ECG HISTORY -->

        <section class="content-card">

            <div class="card-title">

                <div>

                    <span class="eyebrow">
                        ECG HISTORY
                    </span>

                    <h2>
                        ECG Records
                    </h2>

                    <p>
                        All ECG recordings for this
                        reference / visit number.
                    </p>

                </div>

            </div>


            <div class="table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Date
                            </th>

                            <th>
                                Time
                            </th>

                            <th>
                                Reference
                            </th>

                            <th>
                                ECG Result
                            </th>

                            <th>
                                Destination
                            </th>

                            <th>
                                Notes
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${ecgRows}

                    </tbody>

                </table>

            </div>

        </section>
    `;
}


// ===============================
// DATE FORMAT
// ===============================

function formatDate(value) {

    if (!value) {
        return "—";
    }


    // Handle YYYY-MM-DD safely
    const dateString =
        String(value).substring(0, 10);


    const parts =
        dateString.split("-");


    if (parts.length === 3) {

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }


    return new Date(
        value
    ).toLocaleDateString(
        "en-GB"
    );
}


// ===============================
// TIME FORMAT
// ===============================

function formatTime(value) {

    if (!value) {
        return "—";
    }


    return String(
        value
    ).substring(0, 8);
}


// ===============================
// HTML SECURITY
// ===============================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


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