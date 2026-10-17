/* eslint-disable @typescript-eslint/no-require-imports */
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const mysql = require('mysql2/promise');

async function seedRealisticData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_db',
    multipleStatements: true,
  });

  console.log('Connected to MySQL. Preparing realistic hospital dataset (500 patients, 50 doctors, rooms, medicines, bills in ₹)...');

  // Safely truncate data
  await conn.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE prescriptions;
    TRUNCATE TABLE bills;
    TRUNCATE TABLE appointments;
    TRUNCATE TABLE admissions;
    TRUNCATE TABLE rooms;
    TRUNCATE TABLE doctors;
    TRUNCATE TABLE patients;
    TRUNCATE TABLE departments;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  console.log('Tables cleared. Seeding 15 medical departments...');

  const departmentsData = [
    ['Cardiology', 'Block A, 1st Floor'],
    ['Orthopedics & Joint Replacement', 'Block B, Ground Floor'],
    ['Pediatrics & Neonatology', 'Block C, 2nd Floor'],
    ['Neurology & Neurosurgery', 'Block D, 3rd Floor'],
    ['Medical & Surgical Oncology', 'Block E, Specialized Cancer Wing'],
    ['Gastroenterology & Hepatology', 'Block B, 2nd Floor'],
    ['Dermatology & Cosmetology', 'OPD Block, Ground Floor'],
    ['Nephrology & Urology', 'Dialysis Unit, Block C'],
    ['Pulmonology & Chest Medicine', 'Chest Clinic, Block A'],
    ['Obstetrics & Gynecology', 'Maternity Wing, Block F'],
    ['General & Laparoscopic Surgery', 'Surgical Complex, Block D'],
    ['ENT (Otolaryngology)', 'OPD Block, 1st Floor'],
    ['Ophthalmology', 'Eye Care Center, Block E'],
    ['Psychiatry & Behavioral Health', 'Wellness Wing, Block G'],
    ['Emergency Medicine & Critical Care', 'Emergency Block, Ground Floor'],
  ];

  for (const [name, loc] of departmentsData) {
    await conn.query('INSERT INTO departments (dept_name, location) VALUES (?, ?)', [name, loc]);
  }

  console.log('Seeding 50 specialist doctors...');

  const doctorSpecialties = [
    { name: 'Dr. Ramesh Iyer', spec: 'Senior Interventional Cardiologist', dept: 1, fee: 1200 },
    { name: 'Dr. Arvind Swaminathan', spec: 'Cardiothoracic Surgeon', dept: 1, fee: 1500 },
    { name: 'Dr. Neha Bhasin', spec: 'Non-Invasive Cardiologist', dept: 1, fee: 1000 },
    { name: 'Dr. Rajesh Deshmukh', spec: 'Pediatric Cardiologist', dept: 1, fee: 1100 },

    { name: 'Dr. Sunita Rao', spec: 'Chief Orthopedic Surgeon', dept: 2, fee: 1100 },
    { name: 'Dr. Alok Verma', spec: 'Joint Replacement Specialist', dept: 2, fee: 1300 },
    { name: 'Dr. Rohan Mathur', spec: 'Spine & Trauma Surgeon', dept: 2, fee: 1400 },
    { name: 'Dr. Kavit Patel', spec: 'Arthroscopy & Sports Medicine', dept: 2, fee: 1000 },

    { name: 'Dr. Vikram Singh', spec: 'Senior Pediatrician', dept: 3, fee: 800 },
    { name: 'Dr. Ananya Mukherjee', spec: 'Neonatologist', dept: 3, fee: 900 },
    { name: 'Dr. Divya Nambiar', spec: 'Pediatric Pulmonologist', dept: 3, fee: 850 },
    { name: 'Dr. Tarun Mittal', spec: 'Adolescent Medicine Specialist', dept: 3, fee: 750 },

    { name: 'Dr. Siddharth Sen', spec: 'Senior Neurologist', dept: 4, fee: 1400 },
    { name: 'Dr. Meera Nambiar', spec: 'Consultant Neurosurgeon', dept: 4, fee: 1600 },
    { name: 'Dr. Harish Kulkarni', spec: 'Epilepsy & Stroke Specialist', dept: 4, fee: 1300 },
    { name: 'Dr. Bhavna Joshi', spec: 'Movement Disorder Specialist', dept: 4, fee: 1200 },

    { name: 'Dr. Sanjay Bhattacharya', spec: 'Chief Medical Oncologist', dept: 5, fee: 1500 },
    { name: 'Dr. Radhika Pillai', spec: 'Surgical Oncologist', dept: 5, fee: 1700 },
    { name: 'Dr. Manoj Saxena', spec: 'Radiation Oncologist', dept: 5, fee: 1400 },
    { name: 'Dr. Shalini Aggarwal', spec: 'Hematology-Oncology Specialist', dept: 5, fee: 1500 },

    { name: 'Dr. Pradeep Bansal', spec: 'Gastroenterologist & Hepatologist', dept: 6, fee: 1200 },
    { name: 'Dr. Nandita Roy', spec: 'Therapeutic Endoscopist', dept: 6, fee: 1300 },
    { name: 'Dr. Deepak Chhabra', spec: 'GI Motility Specialist', dept: 6, fee: 1000 },

    { name: 'Dr. Kavita Shenoy', spec: 'Consultant Dermatologist', dept: 7, fee: 900 },
    { name: 'Dr. Rohit Khatri', spec: 'Dermatosurgeon', dept: 7, fee: 1000 },
    { name: 'Dr. Pooja Hegde', spec: 'Pediatric Dermatologist', dept: 7, fee: 850 },

    { name: 'Dr. Manjunath Reddy', spec: 'Chief Nephrologist', dept: 8, fee: 1300 },
    { name: 'Dr. Vineet Malhotra', spec: 'Senior Consultant Urologist', dept: 8, fee: 1400 },
    { name: 'Dr. Geeta Subramanian', spec: 'Renal Transplant Physician', dept: 8, fee: 1500 },

    { name: 'Dr. Ashok Singhal', spec: 'Pulmonologist & Sleep Specialist', dept: 9, fee: 1000 },
    { name: 'Dr. Ritu Bhardwaj', spec: 'Critical Care Pulmonologist', dept: 9, fee: 1200 },
    { name: 'Dr. Kunal Wadhwa', spec: 'Interventional Pulmonologist', dept: 9, fee: 1100 },

    { name: 'Dr. Shobha Nambisan', spec: 'Senior Obstetrician & Gynecologist', dept: 10, fee: 1100 },
    { name: 'Dr. Pallavi Dixit', spec: 'High-Risk Pregnancy Specialist', dept: 10, fee: 1300 },
    { name: 'Dr. Swati Ghosh', spec: 'Gynaecological Laparoscopy Surgeon', dept: 10, fee: 1200 },
    { name: 'Dr. Archana Menon', spec: 'Fetal Medicine Specialist', dept: 10, fee: 1400 },

    { name: 'Dr. Vijay Khurana', spec: 'Chief General Surgeon', dept: 11, fee: 1200 },
    { name: 'Dr. Hemant Chauhan', spec: 'Minimal Access Surgeon', dept: 11, fee: 1300 },
    { name: 'Dr. Sameer Dalvi', spec: 'Colorectal & Hernia Specialist', dept: 11, fee: 1100 },

    { name: 'Dr. Bipin Sethi', spec: 'Senior ENT Surgeon', dept: 12, fee: 950 },
    { name: 'Dr. Madhuri Parikh', spec: 'Rhinology & Skull Base Surgeon', dept: 12, fee: 1100 },
    { name: 'Dr. Chetan Varma', spec: 'Head & Neck Oncosurgeon', dept: 12, fee: 1300 },

    { name: 'Dr. Abhiram Vasisht', spec: 'Ophthalmic Surgeon & Vitreo-Retina', dept: 13, fee: 1000 },
    { name: 'Dr. Aparna Shastri', spec: 'Cornea & Refractive Surgeon', dept: 13, fee: 1100 },
    { name: 'Dr. Nipun Tandon', spec: 'Glaucoma & Pediatric Ophthalmology', dept: 13, fee: 950 },

    { name: 'Dr. Devashish Sen', spec: 'Senior Neuropsychiatrist', dept: 14, fee: 1100 },
    { name: 'Dr. Nalini George', spec: 'Consultant Clinical Psychiatrist', dept: 14, fee: 1000 },
    { name: 'Dr. Yashowardhan Roy', spec: 'Addiction & Cognitive Specialist', dept: 14, fee: 1200 },

    { name: 'Dr. Kartik Raman', spec: 'Head of Emergency Medicine', dept: 15, fee: 1000 },
    { name: 'Dr. Tanvi Parekh', spec: 'Trauma & Resuscitation Specialist', dept: 15, fee: 1100 },
  ];

  for (let i = 0; i < doctorSpecialties.length; i++) {
    const doc = doctorSpecialties[i];
    const emailPrefix = doc.name.toLowerCase().replace(/[^a-z]/g, '');
    const email = `${emailPrefix}@medicore.org`;
    const phone = `98${String(10000000 + i * 137).slice(0, 8)}`;
    await conn.query(
      `INSERT INTO doctors (name, email, phone, specialization, dept_id, consultation_fee)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [doc.name, email, phone, doc.spec, doc.dept, doc.fee]
    );
  }

  console.log('Seeding 35 hospital rooms (General, Private, ICU)...');

  const roomsList = [
    // General wards
    ['G101', 'General', 2, 1000],
    ['G102', 'General', 3, 1000],
    ['G103', 'General', 3, 1000],
    ['G104', 'General', 4, 900],
    ['G105', 'General', 4, 900],
    ['G106', 'General', 2, 1200],
    ['G107', 'General', 3, 1100],
    ['G108', 'General', 4, 900],
    ['G109', 'General', 3, 1000],
    ['G110', 'General', 2, 1200],
    ['G111', 'General', 3, 1000],
    ['G112', 'General', 4, 900],
    ['G113', 'General', 2, 1100],
    ['G114', 'General', 3, 1000],
    ['G115', 'General', 2, 1200],

    // Private rooms
    ['P201', 'Private', 1, 3000],
    ['P202', 'Private', 1, 3000],
    ['P203', 'Private', 1, 3200],
    ['P204', 'Private', 1, 3200],
    ['P205', 'Private', 1, 3500],
    ['P206', 'Private', 1, 3500],
    ['P207', 'Private', 1, 4000],
    ['P208', 'Private', 1, 4000],
    ['P209', 'Private', 1, 3800],
    ['P210', 'Private', 1, 3800],
    ['P211', 'Private', 1, 4500],
    ['P212', 'Private', 1, 4500],

    // ICU / CCU rooms
    ['I301', 'ICU', 1, 8000],
    ['I302', 'ICU', 1, 8500],
    ['I303', 'ICU', 1, 9000],
    ['I304', 'ICU', 1, 9000],
    ['I305', 'ICU', 2, 10000],
    ['I306', 'ICU', 2, 10000],
    ['I307', 'ICU', 1, 12000],
    ['I308', 'ICU', 2, 11000],
  ];

  for (const [rNum, rType, cap, charge] of roomsList) {
    await conn.query(
      'INSERT INTO rooms (room_number, room_type, capacity, occupied, daily_charge) VALUES (?, ?, ?, 0, ?)',
      [rNum, rType, cap, charge]
    );
  }

  console.log('Seeding 500 realistic patients across India...');

  const firstNamesMale = [
    'Aarav', 'Rohan', 'Kabir', 'Aditya', 'Vihaan', 'Arjun', 'Vivaan', 'Sai', 'Reyansh', 'Ayaan',
    'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aayush', 'Dhruv', 'Kian',
    'Raghav', 'Abhimanyu', 'Devansh', 'Kunal', 'Manish', 'Nikhil', 'Ankit', 'Gaurav', 'Suresh', 'Ramesh',
    'Dinesh', 'Deepak', 'Alok', 'Sachin', 'Rahul', 'Vikas', 'Amit', 'Sunil', 'Rajesh', 'Prakash',
    'Pradeep', 'Sanjay', 'Hemant', 'Vinay', 'Ashok', 'Anil', 'Kamal', 'Mahesh', 'Mukesh', 'Harish'
  ];

  const firstNamesFemale = [
    'Priya', 'Neha', 'Ananya', 'Aadhya', 'Diya', 'Saanvi', 'Kiara', 'Myra', 'Ira', 'Navya',
    'Riya', 'Avni', 'Vanya', 'Aditi', 'Kavya', 'Ahana', 'Meera', 'Pari', 'Anvi', 'Prisha',
    'Shreya', 'Siddhi', 'Tanvi', 'Disha', 'Pooja', 'Sunita', 'Rekha', 'Kiran', 'Anita', 'Swati',
    'Preeti', 'Suman', 'Geeta', 'Seema', 'Meenakshi', 'Archana', 'Shweta', 'Monika', 'Madhuri', 'Deepika',
    'Shilpa', 'Asha', 'Usha', 'Sushma', 'Kavita', 'Vandana', 'Rashmi', 'Nidhi', 'Shalini', 'Alka'
  ];

  const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Iyer', 'Rao', 'Meena', 'Reddy', 'Banerjee',
    'Chatterjee', 'Mukherjee', 'Deshmukh', 'Kulkarni', 'Joshi', 'Choudhury', 'Mishra', 'Pandey', 'Nair', 'Pillai',
    'Menon', 'Bhat', 'Shetty', 'Hegde', 'Gowda', 'Saxena', 'Bhardwaj', 'Malhotra', 'Kapoor', 'Khanna',
    'Aggarwal', 'Goel', 'Mittal', 'Bansal', 'Jain', 'Shah', 'Modi', 'Bhatt', 'Trivedi', 'Yadav',
    'Chauhan', 'Rathore', 'Solanki', 'Rawat', 'Negi', 'Bisht', 'Sen', 'Dutta', 'Ghosh', 'Das'
  ];

  const cities = [
    'Jaipur, Rajasthan', 'Ajmer, Rajasthan', 'Kota, Rajasthan', 'Udaipur, Rajasthan', 'Jodhpur, Rajasthan',
    'New Delhi, Delhi', 'Noida, UP', 'Gurugram, Haryana', 'Faridabad, Haryana', 'Ghaziabad, UP',
    'Mumbai, Maharashtra', 'Pune, Maharashtra', 'Nagpur, Maharashtra', 'Nashik, Maharashtra', 'Thane, Maharashtra',
    'Bengaluru, Karnataka', 'Mysuru, Karnataka', 'Mangaluru, Karnataka',
    'Hyderabad, Telangana', 'Warangal, Telangana', 'Chennai, Tamil Nadu', 'Coimbatore, Tamil Nadu',
    'Kolkata, West Bengal', 'Ahmedabad, Gujarat', 'Surat, Gujarat',
    'Lucknow, UP', 'Kanpur, UP', 'Varanasi, UP', 'Chandigarh, UT', 'Ludhiana, Punjab',
    'Bhopal, MP', 'Indore, MP', 'Patna, Bihar', 'Ranchi, Jharkhand', 'Kochi, Kerala'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const patientsList = [];
  for (let i = 1; i <= 500; i++) {
    const isFemale = i % 2 === 0;
    const isOther = i % 47 === 0;
    const gender = isOther ? 'Other' : (isFemale ? 'Female' : 'Male');

    const fName = isFemale
      ? firstNamesFemale[i % firstNamesFemale.length]
      : firstNamesMale[i % firstNamesMale.length];
    const lName = lastNames[(i * 3 + 7) % lastNames.length];
    const fullName = `${fName} ${lName}`;

    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@example.com`;
    const phone = `9${String(100000000 + i * 1793).slice(0, 9)}`;

    const birthYear = 1945 + (i * 13) % 77;
    const birthMonth = String(1 + (i % 12)).padStart(2, '0');
    const birthDay = String(1 + (i % 28)).padStart(2, '0');
    const dob = `${birthYear}-${birthMonth}-${birthDay}`;

    const blood = bloodGroups[(i * 5 + 3) % bloodGroups.length];
    const city = cities[i % cities.length];
    const address = `${100 + (i % 899)}, Sector ${1 + (i % 35)}, ${city}`;

    patientsList.push([fullName, email, phone, gender, dob, blood, address]);
  }

  for (let i = 0; i < patientsList.length; i += 50) {
    const chunk = patientsList.slice(i, i + 50);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    await conn.query(
      `INSERT INTO patients (name, email, phone, gender, dob, blood_group, address) VALUES ${placeholders}`,
      chunk.flat()
    );
  }

  console.log('Seeded 500 patients. Creating 700 clinical appointments with guaranteed unique slots...');

  const reasons = [
    'Hypertension routine review', 'Persistent lower back pain', 'Acute viral fever and chills',
    'Followup on lipid profile', 'Type 2 Diabetes glycemic check', 'Chest tightness on exertion',
    'Chronic migraine & headache evaluation', 'Knee osteoarthritis pain', 'Skin eczema & rash flare-up',
    'Shortness of breath on walking', 'Digestive acid reflux & gastritis', 'Post-operative surgical evaluation',
    'Pediatric growth assessment & immunisation', 'Routine annual executive health checkup',
    'Thyroid function test review', 'Chronic sinus congestion', 'Asthma exacerbation consultation',
    'Kidney stone follow-up', 'Pre-natal routine maternal screening', 'Eye strain & vision blur evaluation'
  ];

  const timeSlots = [
    '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
    '12:00:00', '14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00', '17:00:00'
  ];

  const today = new Date();

  // Create a pool of dates from 40 days in the past to 5 days in the future (46 days)
  const datePool = [];
  for (let offset = -40; offset <= 5; offset++) {
    const d = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    datePool.push({ offset, dateStr: d.toISOString().slice(0, 10) });
  }

  // Pre-generate all 644 possible date/time slots
  const allDoctorSlots = [];
  for (let dIdx = 0; dIdx < datePool.length; dIdx++) {
    for (let tIdx = 0; tIdx < timeSlots.length; tIdx++) {
      allDoctorSlots.push({
        dateObj: datePool[dIdx],
        time: timeSlots[tIdx],
      });
    }
  }

  const appointmentRows = [];

  // Generate randomized appointments for each doctor (varied, realistic load with both odd & even counts)
  for (let docId = 1; docId <= 50; docId++) {
    // Generate a random appointment count between 5 and 26 per doctor
    const count = Math.floor(Math.random() * 22) + 5;
    const chosenIndices = new Set();

    // Ensure roughly 15-20 doctors have appointments scheduled for today (CURDATE)
    if (docId <= 18) {
      const todaySlotIndices = [];
      for (let i = 0; i < allDoctorSlots.length; i++) {
        if (allDoctorSlots[i].dateObj.offset === 0) todaySlotIndices.push(i);
      }
      chosenIndices.add(todaySlotIndices[(docId * 3) % todaySlotIndices.length]);
    }

    // Pick remaining unique slots for this doctor to guarantee 0 collisions on (doctor_id, date, time)
    while (chosenIndices.size < count) {
      const randIdx = Math.floor(Math.random() * allDoctorSlots.length);
      chosenIndices.add(randIdx);
    }

    for (const idx of chosenIndices) {
      const slot = allDoctorSlots[idx];
      const patientId = 1 + Math.floor(Math.random() * 500);

      let status = 'Scheduled';
      if (slot.dateObj.offset < 0) {
        status = Math.random() < 0.1 ? 'Cancelled' : 'Completed';
      } else if (slot.dateObj.offset === 0) {
        status = Math.random() < 0.4 ? 'Completed' : 'Scheduled';
      }

      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      appointmentRows.push([patientId, docId, slot.dateObj.dateStr, slot.time, status, reason]);
    }
  }

  for (let i = 0; i < appointmentRows.length; i += 50) {
    const chunk = appointmentRows.slice(i, i + 50);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    await conn.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, reason)
       VALUES ${placeholders}`,
      chunk.flat()
    );
  }

  console.log(`Seeded ${appointmentRows.length} appointments with randomized doctor distribution.`);

  const medicinesList = [
    ['Paracetamol 650mg', '1 tablet thrice daily after food', 5],
    ['Amoxicillin + Clavulanate 625mg', '1 tablet twice daily after meals', 7],
    ['Metformin 500mg', '1 tablet twice daily with meals', 30],
    ['Atorvastatin 20mg', '1 tablet at bedtime', 30],
    ['Amlodipine 5mg', '1 tablet once daily in the morning', 30],
    ['Pantoprazole 40mg', '1 tablet daily before breakfast', 14],
    ['Azithromycin 500mg', '1 tablet once daily for 3 days', 3],
    ['Cetirizine 10mg', '1 tablet at bedtime', 10],
    ['Telmisartan 40mg', '1 tablet once daily in the morning', 30],
    ['Montelukast 10mg', '1 tablet at bedtime', 15],
    ['Ciprofloxacin 500mg', '1 tablet twice daily', 5],
    ['Ibuprofen 400mg', '1 tablet twice daily after meals SOS', 3],
    ['Omeprazole 20mg', '1 capsule once daily before food', 14],
    ['Levothyroxine 50mcg', '1 tablet early morning empty stomach', 30],
    ['Vitamin D3 60,000 IU', '1 capsule weekly with milk', 56],
    ['Calcium Carbonate + Vit D3', '1 tablet daily after lunch', 30],
    ['Metoprolol Tartrate 25mg', '1 tablet twice daily', 30],
    ['Rosuvastatin 10mg', '1 tablet once daily at bedtime', 30],
    ['Ondansetron 4mg', '1 tablet 30 minutes before meal', 3],
    ['Domperidone 10mg', '1 tablet twice daily before food', 5],
  ];

  const [completedAppts] = await conn.query(
    "SELECT appointment_id FROM appointments WHERE status = 'Completed' ORDER BY appointment_id ASC"
  );

  const numPrescriptions = Math.min(completedAppts.length, 450);
  console.log(`Seeding ${numPrescriptions} prescriptions on completed consultations...`);

  const prescriptionRows = [];
  for (let i = 0; i < numPrescriptions; i++) {
    const med = medicinesList[i % medicinesList.length];
    prescriptionRows.push([completedAppts[i].appointment_id, med[0], med[1], med[2]]);
  }

  for (let i = 0; i < prescriptionRows.length; i += 50) {
    const chunk = prescriptionRows.slice(i, i + 50);
    const placeholders = chunk.map(() => '(?, ?, ?, ?)').join(', ');
    await conn.query(
      `INSERT INTO prescriptions (appointment_id, medicine, dosage, duration_days) VALUES ${placeholders}`,
      chunk.flat()
    );
  }

  console.log('Seeding inpatient admissions (active + historical)...');

  const diagnoses = [
    'Acute Myocardial Infarction stabilization',
    'Severe Dengue with Thrombocytopenia',
    'Compound Right Femur Fracture Post-Fixation',
    'Acute Suppurative Appendicitis Post-Op',
    'Community Acquired Pneumonia with Hypoxia',
    'Diabetic Ketoacidosis Management',
    'Elective Laparoscopic Cholecystectomy',
    'Acute Viral Gastroenteritis with Dehydration',
    'Ischemic Cerebrovascular Stroke in ICU',
    'Acute Exacerbation of Bronchial Asthma',
    'Sepsis secondary to Urinary Tract Infection',
    'Spinal Cord Decompression Post-Trauma',
    'Uncontrolled Hypertension & Hypertensive Urgency',
    'Severe Chronic Kidney Disease with Fluid Overload',
    'Bilateral Inguinal Hernioplasty Post-Op'
  ];

  const [dbRooms] = await conn.query('SELECT room_id, room_number, capacity FROM rooms ORDER BY room_id ASC');

  // A) Seed 60 historical discharged admissions
  // To keep trigger balances: insert with NULL discharge_date, then UPDATE discharge_date
  // We use rooms that are NOT full
  for (let i = 1; i <= 60; i++) {
    const patientId = 1 + ((i * 17) % 500);
    const doctorId = 1 + ((i * 3) % 50);
    // Use room (10 + (i % 20)) which has plenty of capacity
    const room = dbRooms[10 + (i % 20)];

    const admitOffset = -1 * (15 + (i % 50));
    const stayLength = 2 + (i % 8);
    const dischargeOffset = admitOffset + stayLength;

    const admitDate = new Date(today.getTime() + admitOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dischargeDate = new Date(today.getTime() + dischargeOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const diag = diagnoses[i % diagnoses.length];

    const [res] = await conn.query(
      `INSERT INTO admissions (patient_id, room_id, doctor_id, admit_date, diagnosis)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, room.room_id, doctorId, admitDate, diag]
    );

    await conn.query(
      'UPDATE admissions SET discharge_date = ? WHERE admission_id = ?',
      [dischargeDate, res.insertId]
    );
  }

  // B) Seed active admissions (discharge_date IS NULL)
  // Ensure Room G101 (cap 2) is FULL (2 active patients) so Demo Mode Step 3 "Trigger Room is full" works immediately!
  // Ensure Room I301 (cap 1) is FULL (1 active patient)
  // Ensure other rooms have available capacity
  const roomG101 = dbRooms.find((r) => r.room_number === 'G101');
  const roomI301 = dbRooms.find((r) => r.room_number === 'I301');
  const roomP201 = dbRooms.find((r) => r.room_number === 'P201');
  const roomG102 = dbRooms.find((r) => r.room_number === 'G102');
  const roomG103 = dbRooms.find((r) => r.room_number === 'G103');
  const roomG104 = dbRooms.find((r) => r.room_number === 'G104');
  const roomP203 = dbRooms.find((r) => r.room_number === 'P203');
  const roomI305 = dbRooms.find((r) => r.room_number === 'I305');

  const activeAdmitRooms = [
    roomG101, roomG101, // G101 is 2/2 (FULL)
    roomI301,           // I301 is 1/1 (FULL)
    roomP201,           // P201 is 1/1 (FULL)
    roomG102,           // G102 has 1/3
    roomG103, roomG103, // G103 has 2/3
    roomG104,           // G104 has 1/4
    roomP203,           // P203 is 1/1 (FULL)
    roomI305,           // I305 has 1/2
  ].filter(Boolean);

  for (let i = 0; i < activeAdmitRooms.length; i++) {
    const room = activeAdmitRooms[i];
    const patientId = 1 + ((i * 37 + 11) % 500);
    const doctorId = 1 + ((i * 7) % 50);
    const daysAgo = 1 + (i % 5);
    const admitDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const diag = diagnoses[(i * 3 + 1) % diagnoses.length];

    await conn.query(
      `INSERT INTO admissions (patient_id, room_id, doctor_id, admit_date, diagnosis)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, room.room_id, doctorId, admitDate, diag]
    );
  }

  console.log('Seeded admissions. Seeding 750 billing statements in INR (₹)...');

  const billTypes = ['Consultation', 'Admission', 'Medicine', 'Lab'];
  const billRows = [];

  for (let i = 1; i <= 750; i++) {
    const patientId = 1 + (i % 500);
    const bType = billTypes[i % billTypes.length];

    let amount = 800;
    if (bType === 'Consultation') {
      amount = 500 + ((i * 100) % 1000); // ₹500 - ₹1400
    } else if (bType === 'Admission') {
      amount = 4500 + ((i * 1500) % 35000); // ₹4,500 - ₹38,000
    } else if (bType === 'Medicine') {
      amount = 350 + ((i * 150) % 4500); // ₹350 - ₹4,700
    } else if (bType === 'Lab') {
      amount = 400 + ((i * 250) % 5500); // ₹400 - ₹5,650
    }

    const daysAgo = (i % 75);
    const billDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const status = i % 4 === 0 ? 'Pending' : 'Paid'; // 25% Pending, 75% Paid

    billRows.push([patientId, amount, billDate, bType, status]);
  }

  for (let i = 0; i < billRows.length; i += 50) {
    const chunk = billRows.slice(i, i + 50);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?)').join(', ');
    await conn.query(
      `INSERT INTO bills (patient_id, amount, bill_date, bill_type, status) VALUES ${placeholders}`,
      chunk.flat()
    );
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');

  const [pCount] = await conn.query('SELECT COUNT(*) as c FROM patients');
  const [dCount] = await conn.query('SELECT COUNT(*) as c FROM doctors');
  const [deptCount] = await conn.query('SELECT COUNT(*) as c FROM departments');
  const [rCount] = await conn.query('SELECT COUNT(*) as c FROM rooms');
  const [aCount] = await conn.query('SELECT COUNT(*) as c FROM appointments');
  const [admCount] = await conn.query('SELECT COUNT(*) as c FROM admissions');
  const [currAdm] = await conn.query('SELECT COUNT(*) as c FROM current_admissions');
  const [prCount] = await conn.query('SELECT COUNT(*) as c FROM prescriptions');
  const [bCount] = await conn.query('SELECT COUNT(*) as c FROM bills');
  const [occRooms] = await conn.query('SELECT room_number, room_type, capacity, occupied FROM rooms WHERE occupied > 0');

  console.log('\nFinal Table Verification:');
  console.log({
    patients: pCount[0].c,
    doctors: dCount[0].c,
    departments: deptCount[0].c,
    rooms: rCount[0].c,
    appointments: aCount[0].c,
    prescriptions: prCount[0].c,
    total_admissions: admCount[0].c,
    active_inpatients: currAdm[0].c,
    bills: bCount[0].c,
  });

  console.log('\nCurrently Occupied Rooms (auto-managed by MySQL Triggers):');
  console.table(occRooms);

  await conn.end();
}

seedRealisticData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
