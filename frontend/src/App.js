import React, { useState, useContext, createContext, useEffect } from 'react';
import { Search, User, Heart, Plus, Phone, Mail, MapPin, Calendar, Users, Target, ChevronRight, X, Upload, Check, Loader2, AlertCircle } from 'lucide-react';

// API Configuration

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API Service
class ApiService {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async get(endpoint) {
    return this.request(endpoint);
  }

  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Auth methods
  static async register(userData) {
    return this.post('/auth/register', userData);
  }

  static async login(credentials) {
    return this.post('/auth/login', credentials);
  }

  // Campaign methods
  static async getCampaigns(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/campaigns${query ? `?${query}` : ''}`);
  }

  static async getCampaign(id) {
    return this.get(`/campaigns/${id}`);
  }

  static async createCampaign(formData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Campaign creation failed');
    }
    
    return response.json();
  }

  // Donation methods
  static async createDonation(donationData) {
    return this.post('/donations', donationData);
  }

  // Resource methods
  static async getResources(category, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/resources/${category}${query ? `?${query}` : ''}`);
  }
}

// Global Context for managing state
const AppContext = createContext();

// Context Provider
const AppProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('home');
  };

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      isLoggedIn, setIsLoggedIn,
      currentUser, setCurrentUser,
      showModal, setShowModal,
      selectedCampaign, setSelectedCampaign,
      campaigns, setCampaigns,
      loading, setLoading,
      error, setError,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Header Component
const Header = () => {
  const { currentPage, setCurrentPage, isLoggedIn, setShowModal, currentUser, logout } = useContext(AppContext);
  
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'donate', label: 'Donate' },
    { id: 'fundraiser', label: 'Fundraise' },
    { id: 'resources', label: 'Resources' }
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <img src="/images/logo.jpeg" alt="NGOHub" className="w-8 h-8" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">NGOHub</span>
              </div>
            </div>
            
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-green-600">
                  <User className="w-5 h-5" />
                  <span>{currentUser?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={logout}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowModal('login')}
                className="text-gray-700 hover:text-green-600 font-medium"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Hero Section with Background Image Support
const HeroSection = () => {
  const { setCurrentPage, setShowModal } = useContext(AppContext);
  
  return (
    <section 
      className="relative py-20 bg-contain bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/images/hero.jpg')`, // Placeholder image - you can replace this
      }}
    >
      {/* Green translucent overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/80 to-green-600/80"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Together, We Can Make a<br />Difference
        </h1>
        <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
          Join thousands of changemakers in driving social impact across communities
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setCurrentPage('donate')}
            className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Donate Now
          </button>
          <button 
            onClick={() => setCurrentPage('fundraiser')}
            className="bg-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
          >
            Start a Fundraiser
          </button>
          <button 
            onClick={() => setCurrentPage('resources')}
            className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
          >
            Resources
          </button>
        </div>
      </div>
    </section>
  );
};

// Campaign Card Component
const CampaignCard = ({ campaign, onClick, showDonateButton = true }) => {
  const progress = (campaign.raisedAmount / campaign.targetAmount) * 100;
  const { setCurrentPage, setSelectedCampaign } = useContext(AppContext);
  
  const handleDonateClick = (e) => {
    e.stopPropagation();
    setSelectedCampaign(campaign);
    setCurrentPage('donation');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onClick(campaign)}>
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">Campaign Image</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{campaign.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">₹{campaign.raisedAmount?.toLocaleString()}</span>
            <span className="text-gray-500">₹{campaign.targetAmount?.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{width: `${Math.min(progress, 100)}%`}}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>{campaign.donorCount || 0} Donors</span>
          <span>{campaign.daysLeft || 0} days left</span>
        </div>
        
        {showDonateButton && (
          <button 
            onClick={handleDonateClick}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Donate
          </button>
        )}
      </div>
    </div>
  );
};

// Trending Campaigns Section
const TrendingCampaigns = () => {
  const { campaigns, setCampaigns, setSelectedCampaign, loading, setLoading } = useContext(AppContext);
  
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getCampaigns({ limit: 3, status: 'active' });
        setCampaigns(response.campaigns || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [setCampaigns, setLoading]);
  
  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    // Just set selected campaign, don't show modal since we're using separate donation page
  };
  
  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending Social Works</h2>
          <p className="text-gray-600">See how your contributions can help create lasting impact</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.slice(0, 3).map((campaign) => (
            <CampaignCard 
              key={campaign._id} 
              campaign={campaign} 
              onClick={handleCampaignClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Trust Section (unchanged)
const TrustSection = () => {
  const trustFactors = [
    {
      title: "No Spam",
      description: "We keep your information secure and never spam your inbox with unwanted emails",
      icon: <Check className="w-6 h-6" />
    },
    {
      title: "Full Transparency", 
      description: "Track exactly how your donations are being used with complete transparency",
      icon: <Check className="w-6 h-6" />
    },
    {
      title: "Data Privacy",
      description: "Your personal information is protected with industry-leading security measures",
      icon: <Check className="w-6 h-6" />
    },
    {
      title: "Regular Updates",
      description: "Receive regular updates on campaigns and see the impact of your contributions",
      icon: <Check className="w-6 h-6" />
    }
  ];
  
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Trust NGOHub</h2>
          <p className="text-gray-600">Our commitment to transparency and trust with the best security standards</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustFactors.map((factor, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-green-600">
                  {factor.icon}
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">{factor.title}</h3>
              <p className="text-gray-600 text-sm">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Success Stories Section (unchanged)
const SuccessStories = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
        <p className="text-gray-600 mb-8">You are the reason lives gets to live life dream</p>
        
        <div className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
          <p className="text-gray-700 italic mb-4">
            "Thanks to the generous donors on NGOHub, my daughter received the life-saving treatment she needed. 
            We are forever grateful for the support from this amazing community."
          </p>
          <div className="font-semibold">- Testimonial</div>
        </div>
      </div>
    </section>
  );
};

// Footer Component with Navigation
const Footer = () => {
  const { setCurrentPage } = useContext(AppContext);
  
  return (
    <footer className="bg-green-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center mb-4 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <Heart className="w-5 h-5 text-green-600" />
              </div>
              <span className="ml-2 text-xl font-bold">NGOHub</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <button className="block text-left hover:text-green-200 transition-colors">ABOUT US</button>
              <button className="block text-left hover:text-green-200 transition-colors">TEAM</button>
              <button className="block text-left hover:text-green-200 transition-colors">CAREERS</button>
              <button className="block text-left hover:text-green-200 transition-colors">CONTACTS</button>
              <button className="block text-left hover:text-green-200 transition-colors">THANK YOU</button>
            </div>
            
            <div className="mt-6 space-y-1 text-sm">
              <div>For any queries:</div>
              <div>Email - info@ngohub.org</div>
              <div>Contact No - 7743908888</div>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <h3 className="text-2xl font-bold mb-4">Together, We Can Make a Difference</h3>
            <p className="text-green-100 mb-6">
              Join thousands of changemakers in driving social impact across communities
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-end">
              <button 
                onClick={() => setCurrentPage('donate')}
                className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded font-semibold transition-colors"
              >
                Donate Now
              </button>
              <button 
                onClick={() => setCurrentPage('fundraiser')}
                className="bg-white text-green-600 hover:bg-gray-100 px-6 py-2 rounded font-semibold transition-colors"
              >
                Start a Fundraiser
              </button>
              <button 
                onClick={() => setCurrentPage('resources')}
                className="border border-white hover:bg-white hover:text-green-600 px-6 py-2 rounded font-semibold transition-colors"
              >
                Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


// Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Login Modal
const LoginModal = () => {
  const { showModal, setShowModal, setIsLoggedIn, setCurrentUser, setError } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.login({ email, password });
      
      // Store token and user info
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      
      setCurrentUser(response.user);
      setIsLoggedIn(true);
      setShowModal(null);
      setEmail('');
      setPassword('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      isOpen={showModal === 'login'}
      onClose={() => setShowModal(null)}
      title="Login to NGOHub"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'LOGIN'}
        </button>
        
        <p className="text-center text-sm text-gray-600">
          New to NGOHub?{' '}
          <button
            type="button"
            onClick={() => setShowModal('signup')}
            className="text-green-600 hover:underline"
            disabled={loading}
          >
            Sign up
          </button>
        </p>
      </form>
    </Modal>
  );
};

// Signup Modal
const SignupModal = () => {
  const { showModal, setShowModal, setIsLoggedIn, setCurrentUser, setError } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.register(formData);
      
      // Store token and user info
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      
      setCurrentUser(response.user);
      setIsLoggedIn(true);
      setShowModal(null);
      setFormData({ name: '', email: '', password: '', phone: '' });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      isOpen={showModal === 'signup'}
      onClose={() => setShowModal(null)}
      title="Create Account"
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CREATE ACCOUNT'}
        </button>
        
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setShowModal('login')}
            className="text-green-600 hover:underline"
            disabled={loading}
          >
            Log in
          </button>
        </p>
      </form>
    </Modal>
  );
};

// Home Page Component
const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <TrendingCampaigns />
      <TrustSection />
      <SuccessStories />
    </div>
  );
};

// Donate Page Component  
const DonatePage = () => {
  const { campaigns, setCampaigns, loading, setLoading, error, setError } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const categories = ['All', 'Medical', 'Education', 'Community', 'Emergency Relief'];
  
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {};
        if (selectedCategory !== 'All') params.category = selectedCategory;
        if (searchTerm) params.search = searchTerm;
        
        const response = await ApiService.getCampaigns(params);
        setCampaigns(response.campaigns || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setError('Failed to load campaigns. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [selectedCategory, searchTerm, setCampaigns, setLoading, setError]);
  
  const handleCampaignClick = (campaign) => {
    // For donate page, clicking campaign card goes to donation page directly
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {campaigns.map((campaign) => (
            <CampaignCard 
              key={campaign._id} 
              campaign={campaign} 
              onClick={handleCampaignClick}
            />
          ))}
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Categories</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border hover:bg-green-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// New Separate Donation Page Component
const DonationPage = () => {
  const { selectedCampaign, setCurrentPage } = useContext(AppContext);
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [donationComplete, setDonationComplete] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  
  const predefinedAmounts = [500, 1000, 2500, 5000];
  
  useEffect(() => {
    if (!selectedCampaign) {
      setCurrentPage('donate');
    }
  }, [selectedCampaign, setCurrentPage]);
  
  const handleDonate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const donationData = {
        campaignId: selectedCampaign._id,
        donorName: isAnonymous ? 'Anonymous' : donorName,
        donorEmail,
        amount: parseFloat(amount),
        message,
        isAnonymous,
        paymentMethod
      };
      
      const response = await ApiService.createDonation(donationData);
      
      if (response.success) {
        setTransactionId(response.donation.transactionId);
        setDonationComplete(true);
      } else {
        alert('Donation failed: ' + response.message);
      }
    } catch (error) {
      alert('Donation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!selectedCampaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No campaign selected</p>
          <button 
            onClick={() => setCurrentPage('donate')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Campaigns
          </button>
        </div>
      </div>
    );
  }
  
  if (donationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            Your donation of ₹{amount} to "{selectedCampaign.title}" has been processed successfully.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Transaction ID: {transactionId}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentPage('donate')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Donate Again
            </button>
            <button 
              onClick={() => setCurrentPage('home')}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const progress = (selectedCampaign.raisedAmount / selectedCampaign.targetAmount) * 100;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => setCurrentPage('donate')}
          className="text-green-600 hover:text-green-700 mb-6 flex items-center"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Back to Campaigns
        </button>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Campaign Details */}
          <div className="bg-white rounded-lg p-6">
            <div className="h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">Campaign Image</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedCampaign.title}</h1>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-green-600">
                  ₹{selectedCampaign.raisedAmount?.toLocaleString()}
                </span>
                <span className="text-gray-600">of ₹{selectedCampaign.targetAmount?.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-green-500 h-3 rounded-full" 
                  style={{width: `${Math.min(progress, 100)}%`}}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{selectedCampaign.donorCount || 0} supporters</span>
                <span>{selectedCampaign.daysLeft || 0} days left</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">About this Campaign</h3>
              <p className="text-gray-700 text-sm">{selectedCampaign.story || selectedCampaign.description}</p>
            </div>
          </div>
          
          {/* Donation Form */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Make a Donation</h2>
            
            <form onSubmit={handleDonate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Donation Amount</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {predefinedAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      className={`py-2 px-4 rounded border ${
                        amount === amt.toString() 
                          ? 'bg-green-600 text-white border-green-600' 
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={!isAnonymous}
                  disabled={isAnonymous}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Leave a message of support..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) setDonorName('');
                  }}
                  className="mr-2"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-700">
                  Donate anonymously
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading || !amount || !donorEmail}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Donate ₹${amount || '0'}`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fundraiser Page Component
const FundraiserPage = () => {
  const { isLoggedIn, setShowModal } = useContext(AppContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    raisingFor: '',
    targetAmount: '',
    duration: '30',
    beneficiary: '',
    location: '',
    patientName: '',
    patientAge: '',
    condition: '',
    hospital: '',
    city: '',
    story: ''
  });
  
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };
  
  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setShowModal('login');
      return;
    }
    
    setLoading(true);
    try {
      const campaignData = new FormData();
      campaignData.append('title', `Help ${formData.patientName || 'Patient'} - ${formData.condition}`);
      campaignData.append('description', formData.condition);
      campaignData.append('story', formData.story);
      campaignData.append('targetAmount', formData.targetAmount);
      campaignData.append('category', 'Medical');
      campaignData.append('beneficiary', formData.beneficiary);
      campaignData.append('patientName', formData.patientName);
      campaignData.append('patientAge', formData.patientAge);
      campaignData.append('patientCondition', formData.condition);
      campaignData.append('hospital', formData.hospital);
      campaignData.append('city', formData.city);
      campaignData.append('duration', formData.duration);
      
      await ApiService.createCampaign(campaignData);
      
      alert('Fundraiser created successfully! It will be reviewed and published soon.');
      setCurrentStep(1);
      setFormData({
        name: '', email: '', password: '', mobile: '', raisingFor: '',
        targetAmount: '', duration: '30', beneficiary: '', location: '',
        patientName: '', patientAge: '', condition: '', hospital: '', city: '', story: ''
      });
    } catch (error) {
      alert('Failed to create fundraiser: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-0.5 ${step < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Start your fundraiser</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-lg">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: Campaign Details */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Tell us more about your fundraiser</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raising money for *</label>
                  <select
                    name="raisingFor"
                    value={formData.raisingFor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Medical">Medical Treatment/Expenses</option>
                    <option value="Education">Education</option>
                    <option value="Community">Community Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much do you want to raise? *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fundraise duration</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your fundraiser beneficiary *</label>
                  <select
                    name="beneficiary"
                    value={formData.beneficiary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select beneficiary</option>
                    <option value="Self">Self</option>
                    <option value="Family Member">Family Member</option>
                    <option value="Friend">Friend</option>
                    <option value="Community">Community</option>
                  </select>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Save and Continue
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Patient Details */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Tell us about the patient</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient's full name *</label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <select
                    name="patientAge"
                    value={formData.patientAge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select age range</option>
                    <option value="0-18">0-18 years</option>
                    <option value="18-30">18-30 years</option>
                    <option value="30-50">30-50 years</option>
                    <option value="50+">50+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ailment / Medical Condition *</label>
                  <input
                    type="text"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter Your City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <button
                  onClick={handleNext}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Save and Continue
                </button>
              </div>
            </div>
          )}
          
          {/* Step 4: Story */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Tell the story about why you are running a Fundraiser</h2>
              <div className="space-y-4">
                <div>
                  <textarea
                    name="story"
                    value={formData.story}
                    onChange={handleInputChange}
                    rows={8}
                    placeholder="Share your story here..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Campaign...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Resources Page Component
const ResourcesPage = () => {
  const [selectedResource, setSelectedResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const resourceCategories = [
    {
      id: 'hospitals',
      title: "Tertiary Care Hospitals in Chennai",
      description: "Find specialized medical facilities offering advanced treatment options",
      icon: "🏥"
    },
    {
      id: 'accommodations',
      title: "Accommodations",
      description: "Low-cost stays, PGs, and lodges located near major hospitals",
      icon: "🏠"
    },
    {
      id: 'medicines',
      title: "Medicine and Drugs",
      description: "Suppliers of subsidized or free medicines for patients in need",
      icon: "💊"
    },
    {
      id: 'blood-banks',
      title: "Blood Banks", 
      description: "Voluntary and government blood bank location details",
      icon: "🩸"
    },
    {
      id: 'ambulance',
      title: "Ambulance Services",
      description: "Government and private ambulance providers for emergency transportation",
      icon: "🚑"
    }
  ];
  
  useEffect(() => {
    if (selectedResource) {
      const fetchResources = async () => {
        try {
          setLoading(true);
          const response = await ApiService.getResources(selectedResource);
          setResources(response.resources || []);
        } catch (error) {
          console.error('Error fetching resources:', error);
          setResources([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchResources();
    }
  }, [selectedResource]);
  
  if (selectedResource === 'hospitals') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {resources.map((hospital) => (
                <div key={hospital._id} className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">{hospital.name}</h2>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {hospital.type}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location
                      </h3>
                      <p className="text-gray-600 mb-4">{hospital.location?.address}, {hospital.location?.city}</p>
                      
                      <h3 className="font-semibold mb-2">Specializations</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hospital.specializations?.map((spec, index) => (
                          <span key={index} className="bg-green-50 text-green-700 px-2 py-1 rounded text-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Facilities</h3>
                      <div className="space-y-2 mb-4">
                        {hospital.facilities?.map((facility, index) => (
                          <div key={index} className="flex items-center text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mr-2" />
                            {facility}
                          </div>
                        ))}
                      </div>
                      
                      <h3 className="font-semibold mb-2">Contact Information</h3>
                      <div className="space-y-1">
                        {hospital.contact?.phone?.map((phone, index) => (
                          <div key={index} className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {phone}
                          </div>
                        ))}
                        {hospital.contact?.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {hospital.contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Resource Directory</h1>
          <p className="text-gray-600">Browse our comprehensive categories to find the medical and support resources you need during treatment</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resourceCategories.map((category, index) => (
            <div 
              key={category.id} 
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => category.id === 'hospitals' ? setSelectedResource('hospitals') : null}
            >
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
              <p className="text-gray-600 mb-4">{category.description}</p>
              <div className="flex items-center text-green-600 font-medium">
                View Resources <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Error Boundary Component
const ErrorMessage = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={onRetry}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-white">
        <AppContent />
      </div>
    </AppProvider>
  );
};

// App Content Component
const AppContent = () => {
  const { currentPage, showModal, error, setError } = useContext(AppContext);
  
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'donate':
        return <DonatePage />;
      case 'donation':
        return <DonationPage />;
      case 'fundraiser':
        return <FundraiserPage />;
      case 'resources':
        return <ResourcesPage />;
      default:
        return <HomePage />;
    }
  };
  
  if (error) {
    return <ErrorMessage error={error} onRetry={() => setError(null)} />;
  }
  
  return (
    <>
      <Header />
      {renderPage()}
      <Footer />
      
      {/* Modals */}
      <LoginModal />
      <SignupModal />
    </>
  );
};

export default App;