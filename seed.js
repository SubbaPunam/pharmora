require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, getPool } = require('../config/db');

const medicines = [
  { name: 'Paracetamol 500mg', description: 'Fast-acting pain relief and fever reducer', price: 25, mrp: 30, category: 'pain', manufacturer: 'GSK', dosage: '500mg', stock: 200, badge: 'Popular', image: '../images/paracetamol.jpg', tags: JSON.stringify(['fever', 'pain', 'headache']) },
  { name: 'Aspirin 75mg', description: 'Antiplatelet agent for heart health', price: 18, mrp: 22, category: 'cardiac', manufacturer: 'Bayer', dosage: '75mg', stock: 150, badge: 'Popular', image: '../images/aspirine.jpg', tags: JSON.stringify(['heart', 'blood thinner']) },
  { name: 'Metformin 500mg', description: 'Oral diabetes medicine for type 2 diabetes', price: 45, mrp: 55, category: 'diabetes', manufacturer: 'Sun Pharma', dosage: '500mg', stock: 120, badge: '', image: '../images/axi.jpg', tags: JSON.stringify(['diabetes', 'blood sugar']) },
  { name: 'Vitamin C 500mg', description: 'Immunity booster and antioxidant', price: 60, mrp: 75, category: 'vitamins', manufacturer: 'Himalaya', dosage: '500mg', stock: 300, badge: 'Popular', image: '../images/med 5.webp', tags: JSON.stringify(['immunity', 'vitamin']) },
  { name: 'Cetirizine 10mg', description: 'Antihistamine for allergies and hay fever', price: 12, mrp: 15, category: 'allergy', manufacturer: 'Cipla', dosage: '10mg', stock: 180, badge: '', image: '../images/fluca.jpg', tags: JSON.stringify(['allergy', 'antihistamine']) },
  { name: 'Amoxicillin 500mg', description: 'Broad-spectrum antibiotic for infections', price: 85, mrp: 100, category: 'antibiotics', manufacturer: 'Pfizer', dosage: '500mg', stock: 90, badge: 'Rx', image: '../images/med2.jpg', requires_prescription: 1, tags: JSON.stringify(['antibiotic', 'infection']) },
  { name: 'ORS Powder', description: 'Oral rehydration salts for dehydration', price: 15, mrp: 18, category: 'digestive', manufacturer: 'Electral', dosage: 'Sachet', stock: 250, badge: 'Popular', image: '../images/ors.jpeg', tags: JSON.stringify(['dehydration', 'electrolytes']) },
  { name: 'Domperidone 10mg', description: 'Anti-nausea and vomiting medication', price: 32, mrp: 40, category: 'digestive', manufacturer: 'Cipla', dosage: '10mg', stock: 140, badge: '', image: '../images/domperidone.jpg', tags: JSON.stringify(['nausea', 'vomiting']) },
  { name: 'Clopidogrel 75mg', description: 'Antiplatelet medication for heart attack prevention', price: 95, mrp: 115, category: 'cardiac', manufacturer: 'Sanofi', dosage: '75mg', stock: 80, badge: 'Rx', image: '../images/clopidogrel.jpg', requires_prescription: 1, tags: JSON.stringify(['cardiac', 'antiplatelet']) },
  { name: 'Insulin Injection', description: 'Rapid-acting insulin for diabetes management', price: 280, mrp: 320, category: 'injection', manufacturer: 'Novo Nordisk', dosage: '100IU/ml', stock: 60, badge: 'Rx', image: '../images/insulin injection.jpg', requires_prescription: 1, tags: JSON.stringify(['insulin', 'diabetes', 'injection']) },
  { name: 'Azithromycin 500mg', description: 'Antibiotic for respiratory and skin infections', price: 110, mrp: 130, category: 'antibiotics', manufacturer: 'Abbott', dosage: '500mg', stock: 100, badge: 'Rx', image: '../images/med3.jpg', requires_prescription: 1, tags: JSON.stringify(['antibiotic', 'respiratory']) },
  { name: 'Multivitamin Tablet', description: 'Complete daily nutrition with vitamins and minerals', price: 120, mrp: 150, category: 'vitamins', manufacturer: 'HealthVit', dosage: 'Daily', stock: 200, badge: 'New', image: '../images/med6.jpg', tags: JSON.stringify(['vitamins', 'nutrition', 'daily']) },
];

async function seed() {
  await connectDB();
  const pool = getPool();

  console.log('🌱 Seeding MySQL database...');

  // Admin user
  const salt = await bcrypt.genSalt(12);
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@1234', salt);
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [process.env.ADMIN_EMAIL || 'admin@pharmora.com']);

  if (existing.length === 0) {
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
      ['Admin', process.env.ADMIN_EMAIL || 'admin@pharmora.com', hashed, 'admin']
    );
    console.log('✅ Admin user created:', process.env.ADMIN_EMAIL || 'admin@pharmora.com');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Medicines
  for (const med of medicines) {
    const [ex] = await pool.query('SELECT id FROM medicines WHERE name = ?', [med.name]);
    if (ex.length === 0) {
      await pool.query(
        `INSERT INTO medicines (name, description, price, mrp, category, manufacturer, dosage, stock, badge, image, requires_prescription, tags)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [med.name, med.description, med.price, med.mrp, med.category, med.manufacturer,
         med.dosage, med.stock, med.badge, med.image, med.requires_prescription || 0, med.tags]
      );
      console.log(`  💊 ${med.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('─────────────────────────────────');
  console.log('Admin login:');
  console.log('  Email:   ', process.env.ADMIN_EMAIL || 'admin@pharmora.com');
  console.log('  Password:', process.env.ADMIN_PASSWORD || 'Admin@1234');
  process.exit(0);
}

seed().catch((err) => { console.error('Seed error:', err); process.exit(1); });
