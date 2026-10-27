# Hospital ECG Management System

A full-stack web application for managing hospital patient records and ECG recordings. Built with HTML, CSS, JavaScript, Node.js, Express, and MySQL.

## Features

- User authentication for ECG room access
- Patient registration and patient directory
- Patient reference search
- ECG recording entry and patient-linked records
- ECG history view
- Dashboard overview
- MySQL database setup script
- Responsive, refreshed medical dashboard interface

## Technology stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Authentication:** Existing project authentication implementation

## Project structure

```text
hospital-ecg-system/
├── backend/             # Express API and database connection
├── Database/            # MySQL setup script
├── frontend/            # HTML pages, CSS and browser JavaScript
│   ├── css/
│   └── js/
├── start-hospital-ecg.bat
├── .gitignore
└── README.md
```

## Requirements

- Node.js (LTS recommended)
- MySQL Server
- npm

## Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/hospital-ecg-system.git
   cd hospital-ecg-system
   ```
2. Create the database and tables by running `Database/hospital_ecg_setup.sql` in MySQL.
3. Open `backend/db.js` and configure your local MySQL connection values. Do not commit passwords or credentials.
4. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
5. Start the server using the project's configured start command or run:
   ```bash
   node server.js
   ```
6. Open the frontend using the URL/port configured in `backend/server.js`.

> The exact local database credentials and port depend on your environment. Keep secrets in environment variables or local-only configuration and never publish them to GitHub.

## Screenshots

Add screenshots of the login, dashboard, patient management, ECG recording, and history pages here before publishing the repository.


## Notes

- This project is intended as an academic/portfolio project and is not a certified clinical medical device.
- Use synthetic/demo data in public screenshots and demonstrations. Do not publish real patient information.
- Review the authentication, access control, and database configuration before deploying to a public server.

## License

Add a license if you intend to distribute or reuse this project under specific terms.
