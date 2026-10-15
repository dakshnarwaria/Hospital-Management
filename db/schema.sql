DROP DATABASE IF EXISTS hospital_db;

CREATE DATABASE hospital_db;

USE hospital_db;



-- ---------- TABLES ----------

CREATE TABLE departments (

    dept_id INT AUTO_INCREMENT PRIMARY KEY,

    dept_name VARCHAR(50) UNIQUE NOT NULL,

    location VARCHAR(50)

);



CREATE TABLE doctors (

    doctor_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    phone VARCHAR(15),

    specialization VARCHAR(50),

    dept_id INT NOT NULL,

    consultation_fee DECIMAL(10,2) NOT NULL CHECK (consultation_fee >= 0),

    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)

);



CREATE TABLE patients (

    patient_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    phone VARCHAR(15),

    gender ENUM('Male','Female','Other') NOT NULL,

    dob DATE NOT NULL,

    blood_group VARCHAR(5),

    address VARCHAR(150)

);



CREATE TABLE rooms (

    room_id INT AUTO_INCREMENT PRIMARY KEY,

    room_number VARCHAR(10) UNIQUE NOT NULL,

    room_type ENUM('General','Private','ICU') NOT NULL,

    capacity INT NOT NULL CHECK (capacity > 0),

    occupied INT NOT NULL DEFAULT 0 CHECK (occupied >= 0),

    daily_charge DECIMAL(10,2) NOT NULL

);



CREATE TABLE appointments (

    appointment_id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    doctor_id INT NOT NULL,

    appointment_date DATE NOT NULL,

    appointment_time TIME NOT NULL,

    status ENUM('Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',

    reason VARCHAR(200),

    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),

    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),

    UNIQUE (doctor_id, appointment_date, appointment_time)

);



CREATE TABLE admissions (

    admission_id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    room_id INT NOT NULL,

    doctor_id INT NOT NULL,

    admit_date DATE NOT NULL,

    discharge_date DATE,

    diagnosis VARCHAR(200),

    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),

    FOREIGN KEY (room_id) REFERENCES rooms(room_id),

    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)

);



CREATE TABLE prescriptions (

    prescription_id INT AUTO_INCREMENT PRIMARY KEY,

    appointment_id INT NOT NULL,

    medicine VARCHAR(100) NOT NULL,

    dosage VARCHAR(50),

    duration_days INT CHECK (duration_days > 0),

    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)

);



CREATE TABLE bills (

    bill_id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),

    bill_date DATE NOT NULL,

    bill_type ENUM('Consultation','Admission','Medicine','Lab') NOT NULL,

    status ENUM('Paid','Pending') NOT NULL DEFAULT 'Pending',

    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)

);



-- ---------- INDEX ----------

CREATE INDEX idx_patient_name ON patients(name);

CREATE INDEX idx_appointment_date ON appointments(appointment_date);



-- ---------- TRIGGERS ----------

DELIMITER //



CREATE TRIGGER before_admission

BEFORE INSERT ON admissions

FOR EACH ROW

BEGIN

    DECLARE cap INT;

    DECLARE occ INT;

    SELECT capacity, occupied INTO cap, occ

    FROM rooms WHERE room_id = NEW.room_id;

    IF occ >= cap THEN

        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is full';

    END IF;

END//



CREATE TRIGGER after_admission

AFTER INSERT ON admissions

FOR EACH ROW

BEGIN

    UPDATE rooms SET occupied = occupied + 1

    WHERE room_id = NEW.room_id;

END//



CREATE TRIGGER after_discharge

AFTER UPDATE ON admissions

FOR EACH ROW

BEGIN

    IF OLD.discharge_date IS NULL AND NEW.discharge_date IS NOT NULL THEN

        UPDATE rooms SET occupied = occupied - 1

        WHERE room_id = NEW.room_id;

    END IF;

END//



-- ---------- STORED PROCEDURES ----------

CREATE PROCEDURE admit_patient(IN p_patient INT, IN p_room INT, IN p_doctor INT, IN p_diagnosis VARCHAR(200))

BEGIN

    INSERT INTO admissions (patient_id, room_id, doctor_id, admit_date, diagnosis)

    VALUES (p_patient, p_room, p_doctor, CURDATE(), p_diagnosis);

END//



CREATE PROCEDURE book_appointment(IN p_patient INT, IN p_doctor INT, IN p_date DATE, IN p_time TIME, IN p_reason VARCHAR(200))

BEGIN

    INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason)

    VALUES (p_patient, p_doctor, p_date, p_time, p_reason);

END//



CREATE PROCEDURE discharge_patient(IN p_admission INT)

BEGIN

    UPDATE admissions SET discharge_date = CURDATE()

    WHERE admission_id = p_admission AND discharge_date IS NULL;

END//



DELIMITER ;



-- ---------- SAMPLE DATA ----------

INSERT INTO departments (dept_name, location) VALUES

('Cardiology', 'Block A'),

('Orthopedics', 'Block B'),

('Pediatrics', 'Block C');



INSERT INTO doctors (name, email, phone, specialization, dept_id, consultation_fee) VALUES

('Dr. Ramesh Iyer', 'ramesh@hospital.com', '9811111111', 'Cardiologist', 1, 800),

('Dr. Sunita Rao', 'sunita@hospital.com', '9822222222', 'Orthopedic Surgeon', 2, 700),

('Dr. Vikram Singh', 'vikram@hospital.com', '9833333333', 'Pediatrician', 3, 500);



INSERT INTO patients (name, email, phone, gender, dob, blood_group, address) VALUES

('Aarav Sharma', 'aarav@example.com', '9876543210', 'Male', '1998-04-12', 'B+', 'Jaipur'),

('Priya Verma', 'priya@example.com', '9123456780', 'Female', '2001-09-25', 'O+', 'Jaipur'),

('Rohan Meena', 'rohan@example.com', '9988776655', 'Male', '1985-01-30', 'A+', 'Ajmer'),

('Neha Gupta', 'neha@example.com', '9090909090', 'Female', '2015-06-18', 'AB+', 'Kota');



INSERT INTO rooms (room_number, room_type, capacity, daily_charge) VALUES

('G101', 'General', 2, 1000),

('P201', 'Private', 1, 3000),

('I301', 'ICU', 1, 8000);



INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, reason) VALUES

(1, 1, CURDATE(), '10:00:00', 'Scheduled', 'Chest pain'),

(2, 2, CURDATE(), '11:00:00', 'Scheduled', 'Knee pain'),

(4, 3, CURDATE(), '12:00:00', 'Completed', 'Fever');



INSERT INTO prescriptions (appointment_id, medicine, dosage, duration_days) VALUES

(3, 'Paracetamol', '5 ml twice a day', 3);



-- Triggers update rooms.occupied automatically

INSERT INTO admissions (patient_id, room_id, doctor_id, admit_date, diagnosis) VALUES

(1, 1, 1, CURDATE(), 'Cardiac observation'),

(3, 1, 2, CURDATE(), 'Fracture'),

(2, 2, 2, CURDATE(), 'Ligament injury');



INSERT INTO bills (patient_id, amount, bill_date, bill_type, status) VALUES

(1, 800, CURDATE(), 'Consultation', 'Paid'),

(3, 5000, CURDATE(), 'Admission', 'Pending'),

(4, 500, CURDATE(), 'Consultation', 'Paid');



-- ---------- VIEW ----------

CREATE VIEW current_admissions AS

SELECT a.admission_id, p.name AS patient, d.name AS doctor,

       r.room_number, r.room_type, a.admit_date, a.diagnosis

FROM admissions a

JOIN patients p ON a.patient_id = p.patient_id

JOIN doctors d ON a.doctor_id = d.doctor_id

JOIN rooms r ON a.room_id = r.room_id

WHERE a.discharge_date IS NULL;



-- ---------- TEST QUERIES ----------

-- SELECT * FROM current_admissions;

-- SELECT * FROM rooms;                                -- check occupied counts

-- CALL admit_patient(4, 1, 3, 'Observation');         -- fails: Room is full

-- CALL discharge_patient(1);                          -- frees a bed in room G101

-- SELECT d.dept_name, COUNT(*) AS total_doctors FROM doctors doc JOIN departments d ON doc.dept_id = d.dept_id GROUP BY d.dept_name;

-- SELECT p.name, SUM(b.amount) AS pending FROM bills b JOIN patients p ON b.patient_id = p.patient_id WHERE b.status = 'Pending' GROUP BY p.name;
