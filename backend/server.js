
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ngohub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Models
// User Schema
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

const User = mongoose.model('User', userSchema);

// Campaign Schema
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
  status: { type: String, enum: ['draft', 'pending', 'active', 'completed', 'suspended'], default: 'pending' },
  duration: { type: Number, default: 30 }, // days
  endDate: Date,
  location: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

campaignSchema.virtual('progress').get(function() {
  return (this.raisedAmount / this.targetAmount) * 100;
});

campaignSchema.virtual('daysLeft').get(function() {
  const now = new Date();
  const end = this.endDate || new Date(this.createdAt.getTime() + (this.duration * 24 * 60 * 60 * 1000));
  const diffTime = Math.abs(end - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

const Campaign = mongoose.model('Campaign', campaignSchema);

// Donation Schema
const donationSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentId: String,
  paymentMethod: String,
  paymentStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
  transactionId: String,
  isAnonymous: { type: Boolean, default: false },
  message: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const Donation = mongoose.model('Donation', donationSchema);

// Resource Schema
const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  type: String, // Government, Private, NGO
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

const Resource = mongoose.model('Resource', resourceSchema);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents allowed'));
    }
  }
});

// Email configuration (Mock)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ngohub@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

// Mock email sender
const sendEmail = async (to, subject, html) => {
  try {
    // In real implementation, uncomment below:
    // await emailTransporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
    console.log(`📧 Mock Email Sent to: ${to}, Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Mock Payment Service
class MockPaymentService {
  static generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  static async processPayment(paymentData) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 90% success rate for demo purposes
    const isSuccess = Math.random() > 0.1;
    const transactionId = this.generateTransactionId();
    
    if (isSuccess) {
      return {
        success: true,
        transactionId,
        paymentId: 'PAY' + transactionId,
        status: 'completed',
        message: 'Payment processed successfully'
      };
    } else {
      return {
        success: false,
        transactionId,
        status: 'failed',
        message: 'Payment failed. Please try again.'
      };
    }
  }

  static async refundPayment(transactionId, amount) {
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      refundId: 'REF' + Date.now(),
      amount,
      status: 'refunded',
      message: 'Refund processed successfully'
    };
  }
}

// Routes

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Send welcome email
    await sendEmail(
      email,
      'Welcome to NGOHub!',
      `<h1>Welcome ${name}!</h1><p>Thank you for joining NGOHub. Start making a difference today!</p>`
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Campaign Routes
app.get('/api/campaigns', async (req, res) => {
  try {
    const { category, status, limit = 10, page = 1, search } = req.query;
    
    let query = {};
    if (category && category !== 'All') query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const campaigns = await Campaign.find(query)
      .populate('creatorId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Add virtual fields
    const campaignsWithVirtuals = campaigns.map(campaign => ({
      ...campaign.toObject(),
      progress: campaign.progress,
      daysLeft: campaign.daysLeft
    }));

    // Get donor counts for each campaign
    for (let campaign of campaignsWithVirtuals) {
      const donorCount = await Donation.countDocuments({ 
        campaignId: campaign._id, 
        paymentStatus: 'completed' 
      });
      campaign.donorCount = donorCount;
    }

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns: campaignsWithVirtuals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('creatorId', 'name email');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get recent donations
    const donations = await Donation.find({ 
      campaignId: campaign._id, 
      paymentStatus: 'completed' 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('donorName amount isAnonymous createdAt message');

    const donorCount = await Donation.countDocuments({ 
      campaignId: campaign._id, 
      paymentStatus: 'completed' 
    });

    res.json({
      ...campaign.toObject(),
      progress: campaign.progress,
      daysLeft: campaign.daysLeft,
      donorCount,
      recentDonations: donations
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns', authenticateToken, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'documents', maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      title, description, story, targetAmount, category, beneficiary,
      patientName, patientAge, patientCondition, hospital, city, duration
    } = req.body;

    // Process uploaded files
    const images = req.files.images ? req.files.images.map(file => file.filename) : [];
    const documents = req.files.documents ? req.files.documents.map(file => file.filename) : [];

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(duration || 30));

    const campaign = new Campaign({
      title,
      description,
      story,
      targetAmount: parseFloat(targetAmount),
      category,
      creatorId: req.user.userId,
      beneficiary,
      patientInfo: {
        name: patientName,
        age: patientAge,
        condition: patientCondition,
        hospital,
        city
      },
      images,
      documents,
      duration: parseInt(duration || 30),
      endDate,
      location: city
    });

    await campaign.save();

    // Send email notification
    const user = await User.findById(req.user.userId);
    await sendEmail(
      user.email,
      'Campaign Created Successfully',
      `<h1>Your campaign "${title}" has been submitted!</h1>
       <p>Our team will review and approve your campaign within 24-48 hours.</p>`
    );

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: {
        ...campaign.toObject(),
        progress: campaign.progress,
        daysLeft: campaign.daysLeft
      }
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Donation Routes
app.post('/api/donations', async (req, res) => {
  try {
    const { campaignId, donorName, donorEmail, amount, paymentMethod, message, isAnonymous } = req.body;

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Create donation record
    const donation = new Donation({
      campaignId,
      donorName,
      donorEmail,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'card',
      message,
      isAnonymous: isAnonymous || false,
      paymentStatus: 'processing'
    });

    await donation.save();

    // Process payment (mock)
    const paymentResult = await MockPaymentService.processPayment({
      amount: parseFloat(amount),
      donorEmail,
      campaignId
    });

    // Update donation with payment result
    donation.paymentId = paymentResult.paymentId;
    donation.transactionId = paymentResult.transactionId;
    donation.paymentStatus = paymentResult.status;
    
    if (paymentResult.success) {
      donation.completedAt = new Date();
      
      // Update campaign raised amount
      campaign.raisedAmount += parseFloat(amount);
      await campaign.save();
      
      // Send confirmation emails
      await sendEmail(
        donorEmail,
        'Donation Confirmation - NGOHub',
        `<h1>Thank you for your donation!</h1>
         <p>Your donation of ₹${amount} to "${campaign.title}" has been processed successfully.</p>
         <p>Transaction ID: ${paymentResult.transactionId}</p>`
      );

      // Notify campaign creator
      const creator = await User.findById(campaign.creatorId);
      if (creator) {
        await sendEmail(
          creator.email,
          'New Donation Received!',
          `<h1>Great news!</h1>
           <p>Your campaign "${campaign.title}" just received a donation of ₹${amount}!</p>
           <p>Donor: ${isAnonymous ? 'Anonymous' : donorName}</p>`
        );
      }
    }

    await donation.save();

    res.json({
      success: paymentResult.success,
      message: paymentResult.message,
      donation: {
        id: donation._id,
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        amount: donation.amount
      }
    });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/donations/user/:userId', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.params.userId })
      .populate('campaignId', 'title images')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resource Routes
// Resource Routes
app.get('/api/resources/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { city, type, limit = 10, page = 1 } = req.query;

    // Map frontend category names to database category names
    const categoryMap = {
      'hospitals': 'Tertiary Care Hospitals in Chennai',
      'accommodations': 'Accommodations',
      'medicines': 'Medicine and Drugs',
      'blood-banks': 'Blood Banks', 
      'ambulance': 'Ambulance Services'
    };
    
    const actualCategory = categoryMap[category] || category.replace('-', ' ');
    console.log('Frontend requested:', category, '-> Searching for:', actualCategory);

    let query = { category: actualCategory };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (type) query.type = type;

    const resources = await Resource.find(query)
      .sort({ isVerified: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Resource.countDocuments(query);

    console.log('Found', resources.length, 'resources for category:', actualCategory);

    res.json({
      resources,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Routes
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    // Verify admin role
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get dashboard statistics
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const totalDonations = await Donation.countDocuments({ paymentStatus: 'completed' });
    const totalUsers = await User.countDocuments();

    const totalAmountRaised = await Donation.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Recent activities
    const recentCampaigns = await Campaign.find({ status: 'pending' })
      .populate('creatorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentDonations = await Donation.find({ paymentStatus: 'completed' })
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalCampaigns,
        activeCampaigns,
        totalDonations,
        totalUsers,
        totalAmountRaised: totalAmountRaised[0]?.total || 0
      },
      recentCampaigns,
      recentDonations
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/campaigns/:id/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('creatorId', 'name email');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Notify campaign creator
    await sendEmail(
      campaign.creatorId.email,
      `Campaign ${status === 'active' ? 'Approved' : 'Status Updated'}`,
      `<h1>Campaign Status Update</h1>
       <p>Your campaign "${campaign.title}" status has been updated to: ${status}</p>
       ${status === 'active' ? '<p>Your campaign is now live and accepting donations!</p>' : ''}`
    );

    res.json({ message: 'Campaign status updated', campaign });
  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NGOHub Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;