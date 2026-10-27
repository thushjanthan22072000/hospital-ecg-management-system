const bcrypt = require("bcryptjs");
const db = require("./db");

const username = "Thushy07";
const password = "abc@123";

async function changeLogin() {

    const passwordHash = await bcrypt.hash(password, 10);

    const sql = `
        UPDATE users
        SET
            username = ?,
            password_hash = ?
        WHERE user_id = 1
    `;

    db.query(
        sql,
        [username, passwordHash],
        (err, result) => {

            if (err) {
                console.error("Failed to change login:");
                console.error(err.message);
                process.exit(1);
            }

            if (result.affectedRows === 0) {
                console.log("User ID 1 was not found.");
            } else {
                console.log("");
                console.log("LOGIN DETAILS CHANGED SUCCESSFULLY");
                console.log("-----------------------------------");
                console.log("Username:", username);
                console.log("Password:", password);
                console.log("-----------------------------------");
            }

            process.exit(0);
        }
    );
}

changeLogin();