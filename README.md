# NGOHub – Social Fundraising Platform

NGOHub is a full-stack web application that connects donors with individuals and NGOs for medical aid, education, and emergency fundraising. The platform supports campaign creation, donations, admin moderation, and resource discovery.

---

## 🚀 Features
- JWT-based authentication (Users & Admins)
- Create and manage fundraising campaigns
- Donate to campaigns (mock payment system)
- Admin approval & moderation of campaigns
- User dashboard to track donations & campaigns
- File uploads for campaign images/documents
- Responsive UI (mobile & desktop)

---

## 🛠 Tech Stack

**Frontend**
- React
- Tailwind CSS
- Fetch API

**Backend**
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)
- Nodemailer (email notifications)

---

## 📁 Project Structure

ngohub/
├── backend/
│ ├── server.js
│ ├── models/
│ ├── controllers/
│ ├── routes/
│ └── middleware/
└── frontend/
├── public/
└── src/
├── components/
├── pages/
└── services/

---

## ⚙️ Installation (Local Setup)

### Backend

cd backend
npm install
npm run dev

### Frontend
cd frontend
npm install
npm start

### Environment Variables (Backend)

Create a .env file inside backend/:

MONGODB_URI=mongodb://localhost:27017/ngohub
JWT_SECRET=your_jwt_secret
PORT=5000

### Test Credentials (After Seeding)

Admin

Email: admin@ngohub.org

Password: admin123

### API Overview

POST /api/auth/login

POST /api/auth/register

GET /api/campaigns

POST /api/campaigns (Protected)

POST /api/donations

GET /api/admin/dashboard (Admin)

### Future Improvements

Real payment gateway integration

Email verification & OTP

Campaign updates & comments

Deployment (Docker + Cloud)

Mobile app (React Native)

### Author

Ayush
GitHub: https://github.com/ayushllcode
