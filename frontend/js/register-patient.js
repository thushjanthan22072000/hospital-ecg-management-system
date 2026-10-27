/* =========================================================
   REGISTER PATIENT
========================================================= */


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

                console.error(error);

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

    const now =
        new Date();


    const time =
        document.getElementById(
            "currentTime"
        );


    const date =
        document.getElementById(
            "currentDate"
        );


    if (time) {

        time.textContent =
            now.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );

    }


    if (date) {

        date.textContent =
            now.toLocaleDateString(
                [],
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
   GET REFERENCE FROM URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const reference =
    params.get(
        "reference"
    );


if (!reference) {

    window.location.href =
        "/patients.html";

}



/* =========================================================
   SET REFERENCE
========================================================= */

document
    .getElementById(
        "referenceNumber"
    )
    .value =
        reference;



/* =========================================================
   LOAD NEXT PATIENT ID
========================================================= */

async function loadNextPatientId() {

    try {

        const response =
            await fetch(
                "/api/patients/next-id",
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
                "Unable to generate Patient ID."
            );

        }


        document
            .getElementById(
                "newPatientCode"
            )
            .value =
                data.patientCode;


    } catch (error) {

        console.error(error);


        showMessage(
            error.message,
            "error"
        );

    }

}


loadNextPatientId();



/* =========================================================
   AGE CALCULATION
========================================================= */

function calculateAge(dob) {

    if (!dob) {
        return "";
    }

    const birth =
        new Date(dob + "T00:00:00");

    const today =
        new Date();

    let age =
        today.getFullYear() -
        birth.getFullYear();

    const monthDifference =
        today.getMonth() -
        birth.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birth.getDate()
        )
    ) {
        age--;
    }

    return age;
}


/* =========================================================
   DOB CHANGE
========================================================= */

const patientDob =
    document.getElementById(
        "patientDob"
    );

const patientAge =
    document.getElementById(
        "patientAge"
    );

const patientNic =
    document.getElementById(
        "patientNic"
    );

const nicHelp =
    document.getElementById(
        "nicHelp"
    );


patientDob.addEventListener(
    "change",
    () => {

        const dob =
            patientDob.value;


        const age =
            calculateAge(
                dob
            );


        /* =========================
           SHOW AGE AUTOMATICALLY
        ========================= */

        patientAge.value =
            age;


        /* =========================
           NIC RULE
        ========================= */

        if (
            age !== "" &&
            age < 16
        ) {

            patientNic.required =
                false;

            patientNic.placeholder =
                "Not required for under 16";


            if (nicHelp) {

                nicHelp.textContent =
                    "NIC is optional for patients under 16.";
            }

        } else {

            patientNic.required =
                false;

            patientNic.placeholder =
                "NIC if available";


            if (nicHelp) {

                nicHelp.textContent =
                    "NIC is optional.";
            }
        }

    }
);



/* =========================================================
   REGISTER
========================================================= */

document
    .getElementById(
        "registerForm"
    )
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const patientData = {

                name:
                    document
                        .getElementById(
                            "patientName"
                        )
                        .value
                        .trim(),

                dob:
                    document
                        .getElementById(
                            "patientDob"
                        )
                        .value,

                nic:
                    document
                        .getElementById(
                            "patientNic"
                        )
                        .value
                        .trim(),

                sex:
                    document
                        .getElementById(
                            "patientSex"
                        )
                        .value,

                address:
                    document
                        .getElementById(
                            "patientAddress"
                        )
                        .value
                        .trim(),

                reference_number:
                    reference

            };


            try {

                const response =
                    await fetch(
                        "/api/patients",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify(
                                    patientData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Registration failed."
                    );

                }


                showMessage(
                    `Patient registered successfully. Patient ID: ${data.patientCode}`,
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            `/patient.html?id=${encodeURIComponent(data.patientCode)}`;

                    },
                    800
                );


            } catch (error) {

                console.error(
                    error
                );


                showMessage(
                    error.message,
                    "error"
                );

            }

        }
    );



/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    type
) {

    const message =
        document.getElementById(
            "registerMessage"
        );


    message.textContent =
        text;


    message.className =
        `message ${type}`;

}