# Automarketer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-2.0%2B-000000?logo=flask)](https://flask.palletsprojects.com/)

## 📌 Overview

**Automarketer** is a full-stack web application designed to automate and streamline video marketing workflows. It empowers creators and marketers to efficiently generate, edit, and manage professional video content with minimal manual effort. The platform combines an intelligent Python backend with a responsive React frontend to deliver a seamless user experience.

### 🎯 Key Features

- **Video Content Generation**: Automatically create marketing videos from templates
- **Multi-Format Support**: Generate videos in various formats optimized for different platforms
- **Schedule Management**: Peak hours configuration for optimal content scheduling
- **Social Media Integration**: Seamless integration with social media platforms
- **Database Management**: SQLite-backed persistent data storage
- **RESTful API**: Well-structured API endpoints for video and content operations
- **Authentication**: Secure user authentication system with JWT tokens (v2)
- **Real-time Processing**: Async task handling for video generation
- **Responsive UI**: Modern, user-friendly React interface with Vite build optimization

---

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Framework**: Flask
- **Database**: SQLite
- **Video Processing**: MoviePy, Pillow
- **Email**: Flask-Mail with Jinja2 templates
- **Authentication**: Custom JWT-based auth
- **Task Scheduling**: Async scheduler
- **API Documentation**: Flask-generated endpoints

#### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.4.5
- **Routing**: React Router DOM 7.10.1
- **HTTP Client**: Axios
- **UI Components**: Lucide React icons
- **Styling**: CSS/TailwindCSS

### Project Structure

```
Automarketer/
├── backend/                        # Python Flask application
│   ├── app.py                     # Main Flask application
│   ├── models.py                  # Database models
│   ├── routes.py                  # API endpoints
│   ├── ai_service.py              # AI integration service
│   ├── video_service.py           # Video generation logic
│   ├── social_service.py          # Social media integration
│   ├── scheduler_service.py       # Task scheduling
│   ├── auth_v2.py                 # JWT authentication
│   ├── requirements.txt           # Python dependencies
│   ├── automarketer.db            # SQLite database
│   └── peak_hours_config.json     # Schedule configuration
│
├── frontend/                       # React Vite application
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # React entry point
│   ├── public/                    # Static assets
│   ├── package.json               # Node dependencies
│   ├── vite.config.js             # Vite configuration
│   └── index.html                 # HTML template
│
├── README.md                       # Project documentation
├── render.yaml                     # Deployment configuration
├── start.bat                       # Windows startup script
└── .gitignore                      # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 16.x or higher
- npm or yarn package manager
- SQLite3

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   python init_db.py
   ```

6. **Start the Flask server**
   ```bash
   python app.py
   # Server runs on http://localhost:5000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint** (if needed)
   Edit `.env.production` or environment detection in config files

4. **Start development server**
   ```bash
   npm run dev
   # Application runs on http://localhost:5173
   ```

### Quick Start (Windows)

Use the provided batch file for automatic startup:

```bash
start.bat
```

This will launch both backend and frontend services.

---

## 📚 API Documentation

### Available Endpoints

#### Video Management
- `POST /api/videos` - Create new video
- `GET /api/videos` - List all videos
- `GET /api/videos/<id>` - Get video details
- `PUT /api/videos/<id>` - Update video
- `DELETE /api/videos/<id>` - Delete video
- `POST /api/videos/<id>/generate` - Generate video

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

#### Social Media
- `POST /api/social/publish` - Publish to social platforms
- `GET /api/social/accounts` - List connected accounts
- `POST /api/social/accounts` - Connect new account

#### Scheduling
- `GET /api/schedule/peak-hours` - Get peak hours configuration
- `PUT /api/schedule/peak-hours` - Update peak hours
- `GET /api/schedule/upcoming` - View scheduled posts

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_secret_key_here

# Database
DATABASE_URL=sqlite:///automarketer.db

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Social Media APIs
INSTAGRAM_API_KEY=your_instagram_api_key
TWITTER_API_KEY=your_twitter_api_key
FACEBOOK_API_KEY=your_facebook_api_key

# Frontend API
REACT_APP_API_URL=http://localhost:5000
```

### Peak Hours Configuration (peak_hours_config.json)

```json
{
  "monday": { "start": 9, "end": 17 },
  "tuesday": { "start": 9, "end": 17 },
  "wednesday": { "start": 9, "end": 17 },
  "thursday": { "start": 9, "end": 17 },
  "friday": { "start": 9, "end": 17 },
  "saturday": { "start": 10, "end": 18 },
  "sunday": { "start": 10, "end": 18 }
}
```

---

## 📊 Database Schema

The application uses SQLite with the following main tables:

- **Users**: User account information and authentication
- **Videos**: Video metadata and configuration
- **Templates**: Video templates for generation
- **ScheduledPosts**: Scheduled video publishing
- **SocialAccounts**: Connected social media accounts
- **Logs**: Application logs and activity tracking

---

## 🎬 Usage Examples

### Generate a Video

**Request**
```bash
curl -X POST http://localhost:5000/api/videos/1/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"template_id": 1, "duration": 30}'
```

**Response**
```json
{
  "video_id": 1,
  "status": "processing",
  "estimated_time": 120,
  "message": "Video generation started"
}
```

### List Videos

**Request**
```bash
curl -X GET http://localhost:5000/api/videos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm test
```

---

## 📦 Dependencies

### Backend (Python)
- flask - Web framework
- flask-cors - Cross-origin support
- flask-sqlalchemy - ORM
- flask-mail - Email sending
- moviepy - Video processing
- pillow - Image processing
- google-generativeai - AI integration
- python-dotenv - Environment management
- gunicorn - Production server
- requests - HTTP client

### Frontend (JavaScript)
- react - UI framework
- react-router-dom - Routing
- axios - HTTP client
- vite - Build tool
- lucide-react - Icon library

---

## 🚢 Deployment

### Render.com Deployment

The project includes `render.yaml` for easy deployment:

```bash
# Push to GitHub and connect repository
# Render will automatically detect render.yaml and deploy
```

### Docker Deployment

```bash
# Build and run with Docker
docker-compose up --build
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Database initialization error
```bash
# Solution: Delete existing database and reinitialize
rm backend/automarketer.db
python backend/init_db.py
```

**Issue**: CORS errors in frontend
```bash
# Solution: Verify FLASK_ENV and check CORS headers
# Ensure backend is running and accessible
```

**Issue**: Video generation fails
```bash
# Solution: Check MoviePy and Pillow installation
pip install --upgrade moviepy pillow
```

---

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Python: Follow PEP 8 standards
- JavaScript: Follow ESLint configuration
- Commit messages: Use descriptive messages

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Srinath Manda** - [@srinath-manda](https://github.com/srinath-manda)
- **Shivaram More** - [@Shivaram304](https://github.com/Shivaram304)

---

## 🙏 Acknowledgments

- Flask documentation and community
- React ecosystem and libraries
- MoviePy for video processing capabilities
- All contributors and users

---

## 📞 Support & Contact

For support, please:
- Open an issue on GitHub
- Check existing issues and discussions
- Contact the maintainers directly

---

## 🗺️ Roadmap

- [ ] Advanced video templates library
- [ ] AI-powered script generation
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Mobile application
- [ ] Real-time collaboration features
- [ ] Advanced scheduling with timezone support
- [ ] A/B testing framework

---

**Last Updated**: December 31, 2025
**Version**: 1.0.0
