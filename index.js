const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

// โหลด SSL Certificate
const certPath = path.join(__dirname, "isrgrootx1.pem");

// เชื่อมต่อฐานข้อมูล TiDB Cloud
const connection = mysql.createConnection({
    host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    user: '4J1xAuev9TES1RL.root',
    password: '7I5ifqsmmC2XnAaS',
    database: 'medRights_manage',
    port: 4000,
    ssl: {
        ca: fs.readFileSync(certPath)
    }
});

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to database successfully');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({
        Name: "Miniproject",
        Author: "Sirinart and Jureerat",
        APIs: [
            { "api_name": "/getUsers/", "method": "get" },
            { "api_name": "/getUser/:id", "method": "get" },
            { "api_name": "/addUser/", "method": "post" },
            { "api_name": "/editUser/", "method": "put" },
            { "api_name": "/deleteUser/", "method": "delete" },
            { "api_name": "/getPatients/", "method": "get" },
            { "api_name": "/getPatient/:id", "method": "get" },
            { "api_name": "/editPatient/", "method": "put" },
            { "api_name": "/deletePatient/:id", "method": "delete" },
            { "api_name": "/getAppointments/", "method": "get" },
            { "api_name": "/addAppointment/", "method": "post" },
            { "api_name": "/editAppointment/:appointmentId", "method": "put" },
            { "api_name": "/deleteAppointment/:appointmentId", "method": "delete" },
            { "api_name": "/api/allpatients", "method": "get" },
            { "api_name": "/api/patients/today", "method": "get" },
            { "api_name": "/api/patients/search", "method": "get" },
            { "api_name": "/api/patients/status/1", "method": "get" },
            { "api_name": "/api/top-diseases", "method": "get" },
            { "api_name": "/api/patients/age-range", "method": "get" },
            { "api_name": "/api/latest-hn", "method": "get" },
            { "api_name": "/api/patients", "method": "post" },  // Add new patient
            { "api_name": "/api/patients/edit", "method": "put" }, // Edit existing patient
            { "api_name": "/api/patients/status/1", "method": "get" },
            { "api_name": "/api/patients/age-range", "method": "get" },
            { "api_name": "/api/patients/status/1", "method": "get" },
            { "api_name": "/api/top-diseases", "method": "get" }
        ]
    });
});

app.listen(port, hostname, () => {
    console.log(`✅ Server is running at http://${hostname}:${port}/`);
});



app.get('/getUsers', (req, res) => {
    connection.query('SELECT user_id, fullname_user, email, role, status FROM users', (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: true, msg: err.message });
        }
        res.json({ error: false, data: results });
    });
});

app.get('/getUser/:id', (req, res) => {
    connection.query('SELECT * FROM users WHERE user_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: true, msg: err.message });
        res.json({ error: false, data: results.length ? results[0] : null });
    });
});

app.post('/addUser', async (req, res) => {
    const { user_id, fullname_user, email, password, role, chronic_disease, status, patient_id } = req.body;

    console.log("📥 ข้อมูลที่ได้รับจาก Frontend:", req.body);

    if (!user_id || !fullname_user || !email || !password || !role) {
        console.error("❌ ข้อมูลไม่ครบ:", req.body);
        return res.status(400).json({ error: true, msg: "❌ กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
        const checkEmailQuery = "SELECT email FROM users WHERE email = ?";
        connection.query(checkEmailQuery, [email], async (err, results) => {
            if (err) {
                console.error("❌ ตรวจสอบอีเมลล้มเหลว:", err);
                return res.status(500).json({ error: true, msg: "❌ Database error" });
            }
            if (results.length > 0) {
                return res.status(400).json({ error: true, msg: "❌ อีเมลนี้ถูกใช้แล้ว" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const patient_id_value = patient_id ? patient_id : null; 

const sql = `INSERT INTO users (user_id, fullname_user, email, password, role, chronic_disease, status, patient_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

const values = [user_id, fullname_user, email, hashedPassword, role, chronic_disease || "", status || "active", patient_id_value];

connection.query(sql, values, (err, results) => {
    if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ error: true, msg: "Cannot Insert", details: err.sqlMessage });
    }
    console.log("เพิ่มผู้ใช้สำเร็จ:", results);
    res.json({ error: false, data: results, msg: "Inserted successfully" });
});

        });

    } catch (error) {
        console.error("❌ Error:", error);
        return res.status(500).json({ error: true, msg: "❌ ระบบเกิดข้อผิดพลาด" });
    }
});


app.put('/editUser/:id', (req, res) => {
    const { fullname_user, email, password, role, chronic_disease, status, patient_id } = req.body;
    const user_id = req.params.id;

    const sql = 'UPDATE users SET fullname_user = ?, email = ?, password = ?, role = ?, chronic_disease = ?, status = ?, patient_id = ? WHERE user_id = ?';
    const values = [fullname_user, email, password, role, chronic_disease, status, patient_id, user_id];

    connection.query(sql, values, (err, results) => {
        if (err) return res.status(500).json({ error: true, msg: err.message });
        res.json({ error: false, msg: results.affectedRows ? "User Updated" : "User Not Found" });
    });
});

app.delete('/deleteUser/:id', (req, res) => {
    const userId = req.params.id;
    connection.query('DELETE FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: true, msg: err.message });
        res.json({ error: false, message: "User deleted successfully" });
    });
});

app.get('/getPatients', (req, res) => {
    connection.query('SELECT patient_id, first_name, last_name FROM patients', (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: true, msg: "Database error", details: err.message });
        }
        res.json({ error: false, data: results });
    });
});

app.get('/getPatient/:id', (req, res) => {
    connection.query('SELECT patient_id, first_name, last_name FROM patients WHERE patient_id = ?', [req.params.id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: true, msg: "Database error", details: err.message });
        }
        res.json({ error: false, data: results.length ? results[0] : null });
    });
});

app.post('/addAppointment', (req, res) => {
    const { patient_id, user_id, appointment_date, clinic } = req.body;

    if (!patient_id || !user_id || !appointment_date || !clinic) {
        return res.status(400).json({ error: true, msg: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const sql = `INSERT INTO appointments (patient_id, user_id, appointment_date, clinic, created_at) 
                 VALUES (?, ?, ?, ?, NOW())`;

    connection.query(sql, [patient_id, user_id, appointment_date, clinic], (err, results) => {
        if (err) {
            console.error("Database Insert Error:", err);
            return res.status(500).json({ error: true, msg: "ไม่สามารถเพิ่มนัดหมายได้", details: err.sqlMessage });
        }
        res.json({ error: false, msg: "เพิ่มนัดหมายสำเร็จ!", data: results });
    });
});

app.get('/getAppointments', (req, res) => {
    connection.query('SELECT * FROM appointments ORDER BY appointment_date DESC', (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: true, msg: "Database error", details: err.message });
        }
        res.json({ error: false, data: results });
    });
});



app.put('/editAppointment/:appointmentId', (req, res) => {
    let { appointment_date, clinic } = req.body;
    connection.query('UPDATE appointments SET appointment_date = ?, clinic = ? WHERE appointment_id = ?', 
    [appointment_date, clinic, req.params.appointmentId], (err, results) => {
        res.json(err ? { error: "Cannot update", details: err } : { message: "Appointment updated", data: results });
    });
});

app.delete('/deleteAppointment/:appointmentId', (req, res) => {
    connection.query('DELETE FROM appointments WHERE appointment_id = ?', [req.params.appointmentId], (err, results) => {
        res.json(err ? { error: "Cannot delete", details: err } : { message: "Appointment deleted", data: results });
    });
});

// Get all patients
app.get('/api/allpatients', (req, res) => {
    connection.query('SELECT COUNT(*) AS totalPatients FROM patients', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ totalPatients: results[0].totalPatients });
    });
});

// Count patients created today
app.get('/api/patients/today', (req, res) => {
    const query = `
        SELECT COUNT(*) AS totalPatientsToday
        FROM patients
        WHERE DATE(created_at) = CURDATE()
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ totalPatientsToday: results[0].totalPatientsToday });
    });
});

// Get patient by ID
app.get('/api/patients/search', (req, res) => {
    const query = req.query.query.toUpperCase(); // Convert the query to uppercase

    const sql = `
        SELECT * FROM patients 
        WHERE UPPER(patient_id) LIKE ? 
        OR UPPER(CONCAT(first_name, ' ', last_name)) LIKE ?`;

    // Use wildcards for partial matching
    const values = [`%${query}%`, `%${query}%`];

    connection.query(sql, values, (error, results) => {
        if (error) {
            console.error('Error executing query', error.stack);
            return res.status(500).send('Server error');
        }
        res.json(results); // Send the filtered patients as a response
    });
});

// Count patients with status = 1
app.get('/api/patients/status/1', (req, res) => {
    connection.query('SELECT COUNT(*) AS totalActivePatients FROM patients WHERE status = 1', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ totalActivePatients: results[0].totalActivePatients });
    });
});

// Get top 5 diseases by patient count
app.get('/api/top-diseases', (req, res) => {
    const query = `
        SELECT disease, COUNT(*) AS patient_count 
        FROM patients 
        GROUP BY disease 
        ORDER BY patient_count DESC 
        LIMIT 5;
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Count patients by age range
app.get('/api/patients/age-range', (req, res) => {
    const query = `
        SELECT
            CASE
                WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 0 AND 20 THEN '0-20'
                WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 21 AND 40 THEN '21-40'
                WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 41 AND 60 THEN '41-60'
                ELSE '60+'
            END AS age_range,
            COUNT(*) AS patient_count
        FROM patients
        GROUP BY age_range
        ORDER BY FIELD(age_range, '0-20', '21-40', '41-60', '60+')
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get the latest patient ID (HN)
app.get('/api/latest-hn', (req, res) => {
    connection.query('SELECT patient_id FROM patients ORDER BY patient_id DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            const latestHN = results[0].patient_id; // Assuming patient_id is your HN
            res.json({ latest_hn: latestHN });
        } else {
            res.json({ latest_hn: 'HN6800001' }); // Default value if no records exist
        }
    });
});

// Add new patient
app.post('/api/patients', (req, res) => {
    const { first_name, last_name, date_of_birth, gender, phone, address, blood_group, allergy, hx_smoking, disease, status } = req.body;

    // Check for missing required fields
    if (!first_name || !last_name || !date_of_birth || !gender || !phone || !address || !blood_group) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }

    const now = new Date();

    // Get the latest patient ID
    connection.query('SELECT patient_id FROM patients ORDER BY patient_id DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        let newPatientId = 'HN6800001';

        if (results.length > 0) {
            const lastId = results[0].patient_id;
            const lastNumber = parseInt(lastId.slice(2), 10);
            newPatientId = `HN${lastNumber + 1}`;
        }

        const patient = {
            patient_id: newPatientId,
            first_name,
            last_name,
            date_of_birth,
            gender,
            phone,
            address,
            blood_group,
            allergy: allergy || null,
            hx_smoking: hx_smoking || 0,
            disease: disease || null,
            status: status || 0,
            created_at: now,
            updated_at: now
        };

        // Insert patient data into the database
        connection.query('INSERT INTO patients SET ?', patient, (err, result) => {
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({ error: 'Failed to create patient' });
            }

            res.status(201).json({ 
                message: 'Patient created successfully',
                patient_id: patient.patient_id
            });
        });
    });
});

// Edit patient information
app.put('/api/patients/edit', (req, res) => {
    const { patient_id, first_name, last_name, date_of_birth, blood_group, gender, hx_smoking } = req.body;

    // Validate input
    if (!patient_id || !first_name || !last_name || !date_of_birth || !blood_group || !gender) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }

    // Update patient data in the database
    const query = `
        UPDATE patients 
        SET first_name = ?, last_name = ?, date_of_birth = ?, blood_group = ?, gender = ?, hx_smoking = ? 
        WHERE patient_id = ?
    `;

    connection.query(query, [first_name, last_name, date_of_birth, blood_group, gender, hx_smoking, patient_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Patient data updated successfully' });
    });
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    const hashedPassword = hashFunction(password); // ตรวจสอบว่ามีการแปลงค่ารหัสผ่านหรือไม่

    db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
    [name, email, hashedPassword], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: "User registered successfully" });
    });
});
