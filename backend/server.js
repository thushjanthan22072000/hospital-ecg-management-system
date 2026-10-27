const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 5000;

const FRONTEND = path.resolve(__dirname, "..", "frontend");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "hospital-ecg-system-secret-2026",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 8 * 60 * 60 * 1000
        }
    })
);

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    if (
        req.session.user.role !== "ECG_DOCTOR" &&
        req.session.user.role !== "ECG_STAFF"
    ) {
        return res.status(403).json({
            message: "ECG room access required."
        });
    }

    next();
}

/* =========================================================
   HTML PROTECTION
========================================================= */

app.use((req, res, next) => {

    if (!req.path.endsWith(".html")) {
        return next();
    }

    if (
        req.path === "/" ||
        req.path === "/login.html"
    ) {
        return next();
    }

    if (!req.session.user) {
        return res.redirect("/login.html");
    }

    next();
});

/* =========================================================
   STATIC FILES
========================================================= */

app.use(express.static(FRONTEND, {
    index: false,
    maxAge: 0
}));

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {

    if (req.session.user) {
        return res.sendFile(
            path.join(FRONTEND, "dashboard.html")
        );
    }

    res.sendFile(
        path.join(FRONTEND, "login.html")
    );
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", (req, res) => {

    const username =
        String(req.body.username || "").trim();

    const password =
        String(req.body.password || "");

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    const sql = `
        SELECT user_id, username, password_hash, role
        FROM users
        WHERE username = ?
        LIMIT 1
    `;

    db.query(sql, [username], async (err, rows) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error."
            });
        }

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        const user = rows[0];

        if (
            user.role !== "ECG_DOCTOR" &&
            user.role !== "ECG_STAFF"
        ) {
            return res.status(403).json({
                message: "This account is not authorized for the ECG room."
            });
        }

        const valid =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!valid) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        req.session.user = {
            user_id: user.user_id,
            username: user.username,
            role: user.role
        };

        res.json({
            message: "Login successful.",
            user: req.session.user
        });
    });
});

/* =========================================================
   CURRENT USER
========================================================= */

app.get("/api/me", requireLogin, (req, res) => {

    res.json({
        loggedIn: true,
        user: req.session.user
    });

});

/* =========================================================
   LOGOUT
========================================================= */

app.post("/api/logout", requireLogin, (req, res) => {

    req.session.destroy(err => {

        if (err) {
            return res.status(500).json({
                message: "Logout failed."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            message: "Logged out successfully."
        });

    });

});

/* =========================================================
   DASHBOARD
========================================================= */

app.get("/api/dashboard", requireLogin, (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM patients) AS patients,
            (SELECT COUNT(*) FROM patient_visits) AS visits,
            (SELECT COUNT(*) FROM ecg_records) AS ecgs,
            (SELECT COUNT(*) FROM ecg_records
             WHERE ecg_date = CURDATE()) AS today
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error."
            });
        }

        res.json(rows[0]);

    });

});

/* =========================================================
   NEXT PATIENT ID
========================================================= */

app.get(
    "/api/patients/next-id",
    requireLogin,
    (req, res) => {

        const sql = `
            SELECT COALESCE(MAX(patient_id), 0) + 1 AS nextId
            FROM patients
        `;

        db.query(sql, (err, rows) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Unable to generate next patient ID."
                });
            }

            const nextId =
                Number(rows[0].nextId);

            res.json({
                nextId,
                patientCode:
                    "P" +
                    String(nextId).padStart(3, "0")
            });

        });

    }
);

/* =========================================================
   SEARCH PATIENTS
========================================================= */

app.get(
    "/api/patients/search",
    requireLogin,
    (req, res) => {

        const patientId =
            String(req.query.patientId || "").trim();

        const name =
            String(req.query.name || "").trim();

        const dob =
            String(req.query.dob || "").trim();

        const nic =
            String(req.query.nic || "").trim();

        let sql = `
            SELECT
                patient_id,
                patient_code,
                name,
                dob,
                nic,
                age,
                sex,
                address,
                created_at
            FROM patients
            WHERE 1 = 1
        `;

        const params = [];

        if (patientId) {
            sql += " AND patient_code = ?";
            params.push(patientId);
        }

        if (name) {
            sql += " AND name LIKE ?";
            params.push(`%${name}%`);
        }

        if (dob) {
            sql += " AND dob = ?";
            params.push(dob);
        }

        if (nic) {
            sql += " AND nic = ?";
            params.push(nic);
        }

        sql += `
            ORDER BY name ASC
            LIMIT 50
        `;

        db.query(sql, params, (err, rows) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Database error."
                });
            }

            res.json(rows);

        });

    }
);

/* =========================================================
   CHECK REFERENCE
========================================================= */

app.get(
    "/api/patients/reference/:reference",
    requireLogin,
    (req, res) => {

        const reference =
            String(req.params.reference || "").trim();

        if (!reference) {
            return res.status(400).json({
                exists: false,
                message: "Reference number is required."
            });
        }

        const sql = `
            SELECT
                pv.visit_id,
                pv.patient_id,
                pv.visit_type,
                pv.reference_number,
                pv.destination_type,
                pv.visit_date,
                pv.created_at,

                p.patient_code,
                p.name,
                p.dob,
                p.age,
                p.sex,
                p.nic,
                p.address

            FROM patient_visits pv

            INNER JOIN patients p
                ON p.patient_id = pv.patient_id

            WHERE pv.reference_number = ?

            LIMIT 1
        `;

        db.query(sql, [reference], (err, rows) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    exists: false,
                    message: "Database error while checking reference."
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    exists: false,
                    reference,
                    message: "Reference number does not exist."
                });
            }

            const row = rows[0];

            res.json({
                exists: true,

                patient: {
                    patient_id: row.patient_id,
                    patient_code: row.patient_code,
                    name: row.name,
                    dob: row.dob,
                    age: row.age,
                    sex: row.sex,
                    nic: row.nic,
                    address: row.address
                },

                visit: {
                    visit_id: row.visit_id,
                    visit_type: row.visit_type,
                    reference_number: row.reference_number,
                    destination_type: row.destination_type,
                    visit_date: row.visit_date,
                    created_at: row.created_at
                }
            });

        });

    }
);

/* =========================================================
   GET ALL PATIENTS
========================================================= */

app.get(
    "/api/patients/all",
    requireLogin,
    (req, res) => {

        const sql = `
            SELECT
                patient_id,
                patient_code,
                name,
                dob,
                age,
                sex,
                nic,
                address
            FROM patients
            ORDER BY patient_id ASC
        `;

        db.query(sql, (err, rows) => {

            if (err) {
                console.error(
                    "Get all patients error:",
                    err
                );

                return res.status(500).json({
                    message: "Unable to load patients."
                });
            }

            res.json({
                patients: rows
            });

        });

    }
);

/* =========================================================
   GET PATIENT PROFILE
========================================================= */

app.get(
    "/api/patients/:patientCode",
    requireLogin,
    (req, res) => {

        const patientCode =
            String(req.params.patientCode || "").trim();

        const patientSQL = `
            SELECT
                patient_id,
                patient_code,
                name,
                dob,
                nic,
                age,
                sex,
                address,
                created_at
            FROM patients
            WHERE patient_code = ?
            LIMIT 1
        `;

        db.query(
            patientSQL,
            [patientCode],
            (err, patients) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (patients.length === 0) {
                    return res.status(404).json({
                        message: "Patient not found."
                    });
                }

                const patient = patients[0];

                const visitsSQL = `
                    SELECT
                        visit_id,
                        patient_id,
                        visit_type,
                        destination_type,
                        reference_number,
                        visit_date,
                        created_at
                    FROM patient_visits
                    WHERE patient_id = ?
                    ORDER BY visit_date DESC, created_at DESC
                `;

                db.query(
                    visitsSQL,
                    [patient.patient_id],
                    (err, visits) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Unable to load visits."
                            });
                        }

                        const ecgSQL = `
                            SELECT
                                e.ecg_id,
                                e.patient_id,
                                e.visit_id,
                                e.ecg_date,
                                e.ecg_time,
                                e.result,
                                e.notes,
                                e.created_at,
                                v.reference_number,
                                v.destination_type
                            FROM ecg_records e
                            INNER JOIN patient_visits v
                                ON v.visit_id = e.visit_id
                            WHERE e.patient_id = ?
                            ORDER BY e.ecg_date DESC, e.ecg_time DESC
                        `;

                        db.query(
                            ecgSQL,
                            [patient.patient_id],
                            (err, ecgs) => {

                                if (err) {
                                    return res.status(500).json({
                                        message:
                                            "Unable to load ECG history."
                                    });
                                }

                                res.json({
                                    patient,
                                    visits,
                                    ecgs
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);

/* =========================================================
   CREATE PATIENT
========================================================= */

app.post(
    "/api/patients",
    requireLogin,
    (req, res) => {

        const name =
            String(req.body.name || "").trim();

        const dob =
            String(req.body.dob || "").trim();

        const nic =
            String(req.body.nic || "").trim();

        const sex =
            String(req.body.sex || "").trim();

        const address =
            String(req.body.address || "").trim();

        const reference =
            String(
                req.body.reference_number || ""
            ).trim();

        if (!name || !dob || !sex || !reference) {
            return res.status(400).json({
                message:
                    "Name, DOB, sex and reference number are required."
            });
        }

        const referenceSQL = `
            SELECT visit_id, patient_id
            FROM patient_visits
            WHERE reference_number = ?
            LIMIT 1
        `;

        db.query(
            referenceSQL,
            [reference],
            (err, rows) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (rows.length > 0) {
                    return res.status(409).json({
                        message:
                            "This reference number already exists."
                    });
                }

                function createPatient() {

                    db.getConnection(
                        (connectionError, connection) => {

                            if (connectionError) {
                                return res.status(500).json({
                                    message:
                                        "Database connection error."
                                });
                            }

                            connection.beginTransaction(
                                transactionError => {

                                    if (transactionError) {
                                        connection.release();
                                        return res.status(500).json({
                                            message:
                                                "Transaction error."
                                        });
                                    }

                                    const now = new Date();

const visitDate =
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

                                    const insertSQL = `
                                        INSERT INTO patients
                                        (
                                            patient_code,
                                            name,
                                            dob,
                                            nic,
                                            age,
                                            sex,
                                            address
                                        )
                                        VALUES
                                        (
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            TIMESTAMPDIFF(
                                                YEAR,
                                                ?,
                                                CURDATE()
                                            ),
                                            ?,
                                            ?
                                        )
                                    `;

                                    connection.query(
                                        insertSQL,
                                        [
                                            temporaryCode,
                                            name,
                                            dob,
                                            nic || null,
                                            dob,
                                            sex,
                                            address || null
                                        ],
                                        (err, result) => {

                                            if (err) {
                                                return connection.rollback(
                                                    () => {
                                                        connection.release();

                                                        res.status(500).json({
                                                            message:
                                                                "Unable to create patient."
                                                        });
                                                    }
                                                );
                                            }

                                            const patientId =
                                                result.insertId;

                                            const patientCode =
                                                "P" +
                                                String(patientId)
                                                    .padStart(3, "0");

                                            const updateSQL = `
                                                UPDATE patients
                                                SET patient_code = ?
                                                WHERE patient_id = ?
                                            `;

                                            connection.query(
                                                updateSQL,
                                                [
                                                    patientCode,
                                                    patientId
                                                ],
                                                err => {

                                                    if (err) {
                                                        return connection.rollback(
                                                            () => {
                                                                connection.release();

                                                                res.status(500).json({
                                                                    message:
                                                                        "Unable to create patient ID."
                                                                });
                                                            }
                                                        );
                                                    }

                                                    const visitSQL = `
                                                        INSERT INTO patient_visits
                                                        (
                                                            patient_id,
                                                            visit_type,
                                                            destination_type,
                                                            reference_number,
                                                            visit_date
                                                        )
                                                        VALUES
                                                        (
                                                            ?,
                                                            'OPD',
                                                            NULL,
                                                            ?,
                                                            ?
                                                        )
                                                    `;

                                                    connection.query(
                                                        visitSQL,
                                                        [
                                                            patientId,
                                                            reference
                                                        ],
                                                        (err, visitResult) => {

                                                            if (err) {
                                                                return connection.rollback(
                                                                    () => {
                                                                        connection.release();

                                                                        res.status(500).json({
                                                                            message:
                                                                                "Unable to create visit."
                                                                        });
                                                                    }
                                                                );
                                                            }

                                                            connection.commit(
                                                                err => {

                                                                    if (err) {
                                                                        return connection.rollback(
                                                                            () => {
                                                                                connection.release();

                                                                                res.status(500).json({
                                                                                    message:
                                                                                        "Unable to save patient."
                                                                                });
                                                                            }
                                                                        );
                                                                    }

                                                                    connection.release();

                                                                    res.status(201).json({
                                                                        message:
                                                                            "Patient registered successfully.",
                                                                        patientId,
                                                                        patientCode,
                                                                        visitId:
                                                                            visitResult.insertId,
                                                                        referenceNumber:
                                                                            reference
                                                                    });

                                                                }
                                                            );

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }

                if (nic) {

                    const nicSQL = `
                        SELECT patient_code, name
                        FROM patients
                        WHERE nic = ?
                        LIMIT 1
                    `;

                    db.query(
                        nicSQL,
                        [nic],
                        (err, rows) => {

                            if (err) {
                                return res.status(500).json({
                                    message: "Database error."
                                });
                            }

                            if (rows.length > 0) {
                                return res.status(409).json({
                                    message:
                                        "A patient with this NIC already exists.",
                                    patientCode:
                                        rows[0].patient_code,
                                    patientName:
                                        rows[0].name
                                });
                            }

                            createPatient();

                        }
                    );

                } else {

                    createPatient();

                }

            }
        );

    }
);

/* =========================================================
   CREATE NEW VISIT
========================================================= */

app.post(
    "/api/patients/:patientCode/visits",
    requireLogin,
    (req, res) => {

        const patientCode =
            String(req.params.patientCode || "").trim();

        const reference =
            String(
                req.body.reference_number || ""
            ).trim();

        if (!reference) {
            return res.status(400).json({
                message: "Reference number is required."
            });
        }

        const patientSQL = `
            SELECT patient_id
            FROM patients
            WHERE patient_code = ?
            LIMIT 1
        `;

        db.query(
            patientSQL,
            [patientCode],
            (err, patients) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (patients.length === 0) {
                    return res.status(404).json({
                        message: "Patient not found."
                    });
                }

                const patientId =
                    patients[0].patient_id;

                const referenceSQL = `
                    SELECT visit_id
                    FROM patient_visits
                    WHERE reference_number = ?
                    LIMIT 1
                `;

                db.query(
                    referenceSQL,
                    [reference],
                    (err, rows) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Database error."
                            });
                        }

                        if (rows.length > 0) {
                            return res.status(409).json({
                                message:
                                    "This reference number already exists.",
                                visitId:
                                    rows[0].visit_id
                            });
                        }

                        const visitSQL = `
                            INSERT INTO patient_visits
                            (
                                patient_id,
                                visit_type,
                                destination_type,
                                reference_number,
                                visit_date
                            )
                            VALUES
                            (
                                ?,
                                'OPD',
                                NULL,
                                ?,
                                CURDATE()
                            )
                        `;

                        db.query(
                            visitSQL,
                            [
                                patientId,
                                reference
                            ],
                            (err, result) => {

                                if (err) {
                                    return res.status(500).json({
                                        message:
                                            "Unable to create visit."
                                    });
                                }

                                res.status(201).json({
                                    message:
                                        "New OPD visit created successfully.",
                                    patientCode,
                                    patientId,
                                    visitId:
                                        result.insertId,
                                    referenceNumber:
                                        reference
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);

/* =========================================================
   SAVE ECG
========================================================= */

app.post(
    "/api/ecg",
    requireLogin,
    (req, res) => {

        const patientCode =
            String(req.body.patientCode || "").trim();

        const visitId =
            Number(req.body.visitId);

        const result =
            String(req.body.result || "").trim();

        const notes =
            String(req.body.notes || "").trim();

        const destination =
            String(req.body.destination || "").trim();

        if (!patientCode || !visitId || !result) {
            return res.status(400).json({
                message:
                    "Patient, visit and ECG result are required."
            });
        }

        if (
            destination !== "WARD" &&
            destination !== "CLINIC" &&
            destination !== "HOME"
        ) {
            return res.status(400).json({
                message:
                    "Please select a valid destination."
            });
        }

        const patientSQL = `
            SELECT patient_id
            FROM patients
            WHERE patient_code = ?
            LIMIT 1
        `;

        db.query(
            patientSQL,
            [patientCode],
            (err, patients) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (patients.length === 0) {
                    return res.status(404).json({
                        message: "Patient not found."
                    });
                }

                const patientId =
                    patients[0].patient_id;

                const visitSQL = `
                    SELECT visit_id, reference_number
                    FROM patient_visits
                    WHERE visit_id = ?
                    AND patient_id = ?
                    LIMIT 1
                `;

                db.query(
                    visitSQL,
                    [
                        visitId,
                        patientId
                    ],
                    (err, visits) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Database error."
                            });
                        }

                        if (visits.length === 0) {
                            return res.status(404).json({
                                message:
                                    "Patient visit not found."
                            });
                        }

                        db.getConnection(
                            (connectionError, connection) => {

                                if (connectionError) {
                                    return res.status(500).json({
                                        message:
                                            "Database connection error."
                                    });
                                }

                                connection.beginTransaction(
                                    transactionError => {

                                        if (transactionError) {
                                            connection.release();

                                            return res.status(500).json({
                                                message:
                                                    "Transaction error."
                                            });
                                        }

                                        const ecgSQL = `
                                            INSERT INTO ecg_records
                                            (
                                                patient_id,
                                                visit_id,
                                                ecg_date,
                                                ecg_time,
                                                result,
                                                notes
                                            )
                                            VALUES
                                            (
                                                ?,
                                                ?,
                                                CURDATE(),
                                                CURTIME(),
                                                ?,
                                                ?
                                            )
                                        `;

                                        connection.query(
                                            ecgSQL,
                                            [
                                                patientId,
                                                visitId,
                                                result,
                                                notes || null
                                            ],
                                            (err, ecgResult) => {

                                                if (err) {
                                                    return connection.rollback(
                                                        () => {
                                                            connection.release();

                                                            res.status(500).json({
                                                                message:
                                                                    "Unable to save ECG."
                                                            });
                                                        }
                                                    );
                                                }

                                                const destinationSQL = `
                                                    UPDATE patient_visits
                                                    SET destination_type = ?
                                                    WHERE visit_id = ?
                                                    AND patient_id = ?
                                                `;

                                                connection.query(
                                                    destinationSQL,
                                                    [
                                                        destination,
                                                        visitId,
                                                        patientId
                                                    ],
                                                    err => {

                                                        if (err) {
                                                            return connection.rollback(
                                                                () => {
                                                                    connection.release();

                                                                    res.status(500).json({
                                                                        message:
                                                                            "Unable to save destination."
                                                                    });
                                                                }
                                                            );
                                                        }

                                                        connection.commit(
                                                            err => {

                                                                if (err) {
                                                                    return connection.rollback(
                                                                        () => {
                                                                            connection.release();

                                                                            res.status(500).json({
                                                                                message:
                                                                                    "Unable to save ECG."
                                                                            });
                                                                        }
                                                                    );
                                                                }

                                                                connection.release();

                                                                res.status(201).json({
                                                                    message:
                                                                        "ECG record saved successfully.",
                                                                    ecgId:
                                                                        ecgResult.insertId,
                                                                    patientCode,
                                                                    visitId,
                                                                    referenceNumber:
                                                                        visits[0].reference_number,
                                                                    destination
                                                                });

                                                            }
                                                        );

                                                    }
                                                );

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    }
);

/* =========================================================
   DATABASE TEST
========================================================= */

app.get(
    "/api/test-db",
    requireLogin,
    (req, res) => {

        db.query(
            "SELECT 1 AS test",
            (err, rows) => {

                if (err) {
                    return res.status(500).json({
                        message:
                            "MySQL connection failed."
                    });
                }

                res.json({
                    message:
                        "MySQL is working.",
                    result:
                        rows[0]
                });

            }
        );

    }
);
// ==========================================
// ECG HISTORY BY REFERENCE NUMBER
// ==========================================

app.get(
    "/api/ecg/history/:reference",
    requireLogin,
    (req, res) => {

        const reference =
            String(req.params.reference || "").trim();

        if (!reference) {
            return res.status(400).json({
                message: "Reference number is required."
            });
        }

        const sql = `
            SELECT
                pv.visit_id,
                pv.reference_number,
                pv.visit_type,
                pv.visit_date,
                pv.destination_type,

                p.patient_code,
                p.name,
                p.dob,
                p.age,
                p.sex,
                p.nic,

                e.ecg_id,
                e.ecg_date,
                e.ecg_time,
                e.result,
                e.notes,
                e.created_at

            FROM patient_visits pv

            INNER JOIN patients p
                ON p.patient_id = pv.patient_id

            LEFT JOIN ecg_records e
                ON e.visit_id = pv.visit_id

            WHERE pv.reference_number = ?

            ORDER BY
                e.ecg_date DESC,
                e.ecg_time DESC
        `;

        db.query(
            sql,
            [reference],
            (err, rows) => {

                if (err) {
                    console.error(
                        "ECG history error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load ECG history."
                    });
                }

                if (rows.length === 0) {
                    return res.status(404).json({
                        message:
                            "Reference number not found."
                    });
                }

                const firstRow = rows[0];

                const patient = {
                    patient_code:
                        firstRow.patient_code,

                    name:
                        firstRow.name,

                    dob:
                        firstRow.dob,

                    age:
                        firstRow.age,

                    sex:
                        firstRow.sex,

                    nic:
                        firstRow.nic
                };

                const visit = {
                    visit_id:
                        firstRow.visit_id,

                    reference_number:
                        firstRow.reference_number,

                    visit_type:
                        firstRow.visit_type,

                    visit_date:
                        firstRow.visit_date,

                    destination_type:
                        firstRow.destination_type
                };

                const ecgs =
                    rows
                        .filter(
                            row =>
                                row.ecg_id !== null
                        )
                        .map(
                            row => ({
                                ecg_id:
                                    row.ecg_id,

                                ecg_date:
                                    row.ecg_date,

                                ecg_time:
                                    row.ecg_time,

                                result:
                                    row.result,

                                notes:
                                    row.notes,

                                created_at:
                                    row.created_at
                            })
                        );

                res.json({
                    patient,
                    visit,
                    ecgs
                });
            }
        );
    }
);
/* =========================================================
   404
========================================================= */

app.use("/api", (req, res) => {

    res.status(404).json({
        message: "API endpoint not found."
    });

});

/* =========================================================
   START
========================================================= */

app.listen(PORT, () => {

    console.log("");
    console.log("==========================================");
    console.log("       HOSPITAL ECG SYSTEM");
    console.log("==========================================");
    console.log(
        `Server running at: http://localhost:${PORT}`
    );
    console.log("Authentication: ENABLED");
    console.log("MySQL database: hospital_ecg");
    console.log("==========================================");
    console.log("");

});