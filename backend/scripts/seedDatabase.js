// scripts/seedDatabase.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ngohub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import Models (same as in server.js)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  profileImage: String,
  createdAt: { type: Date, default: Date.now }
});

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  story: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  raisedAmount: { type: Number, default: 0 },
  category: { type: String, required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  beneficiary: String,
  patientInfo: {
    name: String,
    age: String,
    condition: String,
    hospital: String,
    city: String
  },
  images: [String],
  documents: [String],
  status: { type: String, enum: ['draft', 'pending', 'active', 'completed', 'suspended'], default: 'active' },
  duration: { type: Number, default: 30 },
  endDate: Date,
  location: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const donationSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentId: String,
  paymentMethod: String,
  paymentStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'completed' },
  transactionId: String,
  isAnonymous: { type: Boolean, default: false },
  message: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  type: String,
  description: String,
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  contact: {
    phone: [String],
    email: String,
    website: String
  },
  specializations: [String],
  facilities: [String],
  workingHours: String,
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const Donation = mongoose.model('Donation', donationSchema);
const Resource = mongoose.model('Resource', resourceSchema);

// Seed Data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Donation.deleteMany({});
    await Resource.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@ngohub.org',
        password: adminPassword,
        phone: '+91-9876543210',
        role: 'admin',
        isVerified: true
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        password: hashedPassword,
        phone: '+91-9876543211',
        isVerified: true
      },
      {
        name: 'Sunita Sharma',
        email: 'sunita@example.com', 
        password: hashedPassword,
        phone: '+91-9876543212',
        isVerified: true
      },
      {
        name: 'Arjun Patel',
        email: 'arjun@example.com',
        password: hashedPassword,
        phone: '+91-9876543213',
        isVerified: true
      },
      {
        name: 'Priya Singh',
        email: 'priya@example.com',
        password: hashedPassword,
        phone: '+91-9876543214',
        isVerified: true
      }
    ]);
    console.log('✅ Created users');

    // Create Campaigns
    const campaigns = await Campaign.insertMany([
      {
        title: "Support My Daughter Preethi to Recover from Blood Clot in Brain",
        description: "My daughter needs urgent medical attention for blood clot treatment in her brain. The surgery is critical and time-sensitive.",
        story: "My daughter Preethi, just 8 years old, was playing in the garden when she suddenly collapsed. After rushing to the hospital, doctors discovered a severe blood clot in her brain that requires immediate surgical intervention. The estimated cost for the surgery and subsequent treatment is ₹5,00,000. As a daily wage worker, I cannot afford this amount. Please help save my daughter's life.",
        targetAmount: 500000,
        raisedAmount: 124178,
        category: "Medical",
        creatorId: users[1]._id,
        beneficiary: "Family Member",
        patientInfo: {
          name: "Preethi Kumar",
          age: "8 years",
          condition: "Blood clot in brain",
          hospital: "Apollo Hospital, Chennai",
          city: "Chennai"
        },
        status: "active",
        location: "Chennai",
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Help Rahul Fight Cancer and Live His Dreams", 
        description: "Young Rahul needs chemotherapy and ongoing cancer treatment to beat leukemia and pursue his dream of becoming a doctor.",
        story: "Rahul is a bright 12-year-old who was diagnosed with acute lymphoblastic leukemia 6 months ago. Despite the devastating news, his spirit remains unbroken. He dreams of becoming a doctor to help other children like him. The treatment requires intensive chemotherapy sessions costing ₹8,00,000. His father, a small shopkeeper, has already spent his savings on initial treatment. Rahul needs our support to complete his treatment and live his dreams.",
        targetAmount: 800000,
        raisedAmount: 256300,
        category: "Medical", 
        creatorId: users[2]._id,
        beneficiary: "Family Member",
        patientInfo: {
          name: "Rahul Sharma",
          age: "12 years", 
          condition: "Acute Lymphoblastic Leukemia",
          hospital: "Tata Memorial Hospital, Mumbai",
          city: "Mumbai"
        },
        status: "active",
        location: "Mumbai",
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Support Education for Underprivileged Children",
        description: "Providing quality education and resources to children in rural areas who lack access to proper schooling facilities.",
        story: "In the remote village of Dharampur, 150 children walk 5 kilometers daily to attend school in a dilapidated building with no proper facilities. Our NGO wants to build a new school building, provide learning materials, and arrange transportation for these children. Quality education can break the cycle of poverty and give these children a chance at a better future. Your support can transform 150 young lives.",
        targetAmount: 200000,
        raisedAmount: 89450,
        category: "Education",
        creatorId: users[3]._id,
        beneficiary: "Community", 
        status: "active",
        location: "Dharampur Village, Bihar",
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Clean Water Initiative for Rural Communities",
        description: "Installing water purification systems and building wells in villages without access to clean drinking water.",
        story: "Water-borne diseases are claiming lives in rural Maharashtra. Five villages with over 2000 residents rely on contaminated water sources, leading to frequent illness and death, especially among children. Our initiative aims to install solar-powered water purification systems and dig deep wells to provide clean, safe drinking water. This project will directly impact 2000+ lives and prevent countless waterborne diseases.",
        targetAmount: 150000,
        raisedAmount: 67890,
        category: "Community",
        creatorId: users[4]._id,
        beneficiary: "Community",
        status: "active", 
        location: "Maharashtra",
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Emergency Heart Surgery for Baby Aarav",
        description: "6-month-old Aarav needs urgent heart surgery to repair a congenital heart defect.",
        story: "Baby Aarav was born with a complex congenital heart defect called Tetralogy of Fallot. Without immediate surgery, his condition will become life-threatening. The pediatric cardiac surgery costs ₹6,00,000, which is beyond our family's means. Aarav's parents are daily wage laborers who have already borrowed money for initial tests and medications. Every day of delay puts Aarav's life at greater risk. Please help save this innocent life.",
        targetAmount: 600000,
        raisedAmount: 345670,
        category: "Medical",
        creatorId: users[1]._id,
        beneficiary: "Family Member",
        patientInfo: {
          name: "Aarav Kumar",
          age: "6 months",
          condition: "Tetralogy of Fallot (Congenital Heart Defect)", 
          hospital: "Fortis Hospital, Delhi",
          city: "Delhi"
        },
        status: "active",
        location: "Delhi",
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Flood Relief and Rehabilitation Program",
        description: "Providing immediate relief and long-term rehabilitation support to flood-affected families in Kerala.",
        story: "The recent floods in Kerala have displaced over 500 families in our district. Many have lost their homes, belongings, and livelihoods. Our organization is working around the clock to provide immediate relief including food, clothing, and temporary shelter. Additionally, we're planning long-term rehabilitation programs to help families rebuild their lives. The affected families need our urgent support to get back on their feet.",
        targetAmount: 300000,
        raisedAmount: 178900,
        category: "Emergency Relief",
        creatorId: users[2]._id,
        beneficiary: "Community",
        status: "active",
        location: "Kerala", 
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('✅ Created campaigns');

    // Create Donations
    const donations = [];
    const donorNames = ['Amit Shah', 'Riya Gupta', 'Vikash Yadav', 'Anjali Mehta', 'Rohit Singh', 'Kavita Sharma', 'Anonymous', 'Deepak Kumar', 'Neha Agarwal', 'Sanjay Patel'];
    const donorEmails = ['amit@email.com', 'riya@email.com', 'vikash@email.com', 'anjali@email.com', 'rohit@email.com', 'kavita@email.com', 'anonymous@email.com', 'deepak@email.com', 'neha@email.com', 'sanjay@email.com'];

    for (let campaign of campaigns) {
      const numDonations = Math.floor(Math.random() * 8) + 3; // 3-10 donations per campaign
      let totalRaised = 0;

      for (let i = 0; i < numDonations; i++) {
        const amount = Math.floor(Math.random() * 10000) + 500; // ₹500 - ₹10,500
        totalRaised += amount;
        
        const donorIndex = Math.floor(Math.random() * donorNames.length);
        const isAnonymous = Math.random() > 0.7; // 30% anonymous donations

        donations.push({
          campaignId: campaign._id,
          donorName: isAnonymous ? 'Anonymous' : donorNames[donorIndex],
          donorEmail: donorEmails[donorIndex],
          amount: amount,
          paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentMethod: ['card', 'upi', 'netbanking'][Math.floor(Math.random() * 3)],
          paymentStatus: 'completed',
          isAnonymous: isAnonymous,
          message: isAnonymous ? '' : ['God bless!', 'Hope this helps', 'Prayers for recovery', 'Stay strong!', ''][Math.floor(Math.random() * 5)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
          completedAt: new Date()
        });
      }

      // Update campaign raised amount to match donations
      await Campaign.findByIdAndUpdate(campaign._id, { raisedAmount: Math.min(totalRaised, campaign.raisedAmount) });
    }

    await Donation.insertMany(donations);
    console.log('✅ Created donations');

    // Create Resources
    await Resource.insertMany([
      {
        name: "Institute of Child Health and Hospital for Children",
        category: "Tertiary Care Hospitals in Chennai",
        type: "Government",
        description: "Specialized pediatric care with advanced medical facilities",
        location: {
          address: "Egmore",
          city: "Chennai", 
          state: "Tamil Nadu",
          pincode: "600008"
        },
        contact: {
          phone: ["+91-44-28194500", "+91-44-28194501"],
          email: "info@ich.gov.in",
          website: "www.ich.gov.in"
        },
        specializations: ["General Pediatrics", "Obstetrics", "Gynecology", "Gastroenterology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics"],
        facilities: ["Patient and Medical Emergency Department", "X-ray Complex", "24/7 Emergency Services", "ICU", "Blood Bank"],
        workingHours: "24/7",
        isVerified: true
      },
      {
        name: "Royapettah Government Hospital",
        category: "Tertiary Care Hospitals in Chennai", 
        type: "Government",
        description: "Multi-specialty government hospital with comprehensive medical services",
        location: {
          address: "Royapettah",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600014"
        },
        contact: {
          phone: ["+91-44-28331234", "+91-44-28335678"],
          email: "rgh@tnhealth.org"
        },
        specializations: ["General Medicine", "General Surgery", "Orthopedics", "Neurology", "Oncology", "Nephrology"],
        facilities: ["ICU", "Radiant Emergency Ward", "OPD Services", "Blood Bank", "Diagnostic Services"],
        workingHours: "24/7",
        isVerified: true
      },
      {
        name: "Kilpauk Medical College Hospital", 
        category: "Tertiary Care Hospitals in Chennai",
        type: "Government",
        description: "Premier medical college hospital with super specialty services",
        location: {
          address: "Kilpauk",
          city: "Chennai",
          state: "Tamil Nadu", 
          pincode: "600010"
        },
        contact: {
          phone: ["+91-44-26642424"],
          email: "kmc@tnmgrmu.ac.in"
        },
        specializations: ["Cardiac Surgery", "Neurology", "Orthopedic Surgery", "Urological Surgery", "Gastroenterology Surgery"],
        facilities: ["AC Rooms", "Canteen", "Different Ward Facilities", "Advanced Operation Theaters", "ICU"],
        workingHours: "24/7",
        isVerified: true
      },
      {
        name: "Apollo Hospital",
        category: "Tertiary Care Hospitals in Chennai",
        type: "Private", 
        description: "Leading private hospital with world-class medical facilities",
        location: {
          address: "Greams Road",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600006"
        },
        contact: {
          phone: ["+91-44-28291200"],
          email: "chennai@apollohospitals.com",
          website: "www.apollohospitals.com"
        },
        specializations: ["Cardiology", "Oncology", "Neurology", "Orthopedics", "Transplant Surgery", "Emergency Medicine"],
        facilities: ["24/7 Emergency", "Advanced ICU", "Cath Lab", "MRI/CT Scan", "Blood Bank", "Pharmacy"],
        workingHours: "24/7",
        isVerified: true
      }
    ]);
    console.log('✅ Created resources');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users created: ${users.length}`);
    console.log(`🎯 Campaigns created: ${campaigns.length}`);  
    console.log(`💰 Donations created: ${donations.length}`);
    console.log(`🏥 Resources created: 4`);
    console.log('\n🔑 Login credentials:');
    console.log('Admin: admin@ngohub.org / admin123');
    console.log('User: rajesh@example.com / password123'); 
    console.log('User: sunita@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run seeding
seedData();