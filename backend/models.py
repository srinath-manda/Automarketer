from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    # New profile fields
    full_name = db.Column(db.String(120), nullable=True)
    mobile = db.Column(db.String(20), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    company = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    businesses = db.relationship('BusinessProfile', backref='owner', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'mobile': self.mobile,
            'bio': self.bio,
            'company': self.company,
            'location': self.location,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BusinessProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    industry = db.Column(db.String(50), nullable=True)
    target_audience = db.Column(db.String(100), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'industry': self.industry,
            'target_audience': self.target_audience
        }

class GeneratedContent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    platform = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    video_url = db.Column(db.String(500), nullable=True)  # Store generated video URL
    audio_url = db.Column(db.String(500), nullable=True)  # Store generated audio URL
    model = db.Column(db.String(50), nullable=True)  # Which AI model generated this
    # Use local timezone for proper display
    created_at = db.Column(db.DateTime, default=lambda: datetime.now())
    business_id = db.Column(db.Integer, db.ForeignKey('business_profile.id'), nullable=False)


    def to_dict(self):
        return {
            'id': self.id,
            'platform': self.platform,
            'content': self.content,
            'image_url': self.image_url,
            'video_url': self.video_url,
            'audio_url': self.audio_url,
            'model': self.model,
            'created_at': self.created_at.isoformat(),
            'business_id': self.business_id
        }


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    offers = db.Column(db.Text, nullable=True)  # New column from gdg2
    price = db.Column(db.Float, nullable=True)
    business_id = db.Column(db.Integer, db.ForeignKey('business_profile.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'offers': self.offers,
            'price': self.price,
            'business_id': self.business_id
        }
class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    strategy = db.Column(db.JSON, nullable=False)  # 7-day plan
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    business_id = db.Column(db.Integer, db.ForeignKey('business_profile.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'strategy': self.strategy,
            'created_at': self.created_at.isoformat(),
            'business_id': self.business_id
        }

class CompetitorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    competitor_name = db.Column(db.String(100), nullable=False)
    swot_analysis = db.Column(db.JSON, nullable=False)
    latest_news = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    business_id = db.Column(db.Integer, db.ForeignKey('business_profile.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'competitor_name': self.competitor_name,
            'swot_analysis': self.swot_analysis,
            'latest_news': self.latest_news,
            'created_at': self.created_at.isoformat(),
            'business_id': self.business_id
        }

class AudioFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    business_id = db.Column(db.Integer, db.ForeignKey('business_profile.id'), nullable=True)  # Made optional

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_text': self.original_text,
            'created_at': self.created_at.isoformat(),
            'business_id': self.business_id
        }
