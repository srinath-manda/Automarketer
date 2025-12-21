"""
Social Media Publishing Service
Integrates with Ayrshare (Twitter/LinkedIn), Brevo (Email), and WordPress (Blog)
"""
import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ayrshare API for Twitter/X and LinkedIn
AYRSHARE_API_KEY = os.getenv('AYRSHARE_API_KEY')
AYRSHARE_BASE_URL = 'https://api.ayrshare.com/api'

# Brevo API for Email
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
BREVO_BASE_URL = 'https://api.brevo.com/v3'

# WordPress REST API
WP_SITE_URL = os.getenv('WP_SITE_URL')  # e.g., https://yoursite.wordpress.com
WP_USERNAME = os.getenv('WP_USERNAME')
WP_APP_PASSWORD = os.getenv('WP_APP_PASSWORD')


def post_to_twitter(content, image_url=None, video_url=None):
    """
    Post to Twitter/X via Ayrshare API
    Supports text, images, and videos
    """
    if not AYRSHARE_API_KEY:
        return {'success': False, 'error': 'Ayrshare API key not configured'}
    
    headers = {
        'Authorization': f'Bearer {AYRSHARE_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'post': content[:280],  # Twitter limit
        'platforms': ['twitter']
    }
    
    # Video takes priority over image
    if video_url:
        payload['mediaUrls'] = [video_url]
        payload['isVideo'] = True
    elif image_url:
        payload['mediaUrls'] = [image_url]
    
    try:
        print(f"📤 Posting to Twitter: {payload}")
        response = requests.post(
            f'{AYRSHARE_BASE_URL}/post',
            headers=headers,
            json=payload
        )
        result = response.json()
        print(f"📥 Twitter response: {result}")
        
        if response.status_code == 200:
            return {'success': True, 'data': result}
        else:
            return {'success': False, 'error': result.get('message', str(result))}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def post_to_linkedin(content, image_url=None, video_url=None):
    """
    Post to LinkedIn via Ayrshare API
    Supports text, images, and videos
    """
    if not AYRSHARE_API_KEY:
        return {'success': False, 'error': 'Ayrshare API key not configured'}
    
    headers = {
        'Authorization': f'Bearer {AYRSHARE_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'post': content,
        'platforms': ['linkedin']
    }
    
    # Video takes priority over image
    if video_url:
        payload['mediaUrls'] = [video_url]
        payload['isVideo'] = True
    elif image_url:
        payload['mediaUrls'] = [image_url]
    
    try:
        print(f"📤 Posting to LinkedIn: {payload}")
        response = requests.post(
            f'{AYRSHARE_BASE_URL}/post',
            headers=headers,
            json=payload
        )
        result = response.json()
        print(f"📥 LinkedIn response: {result}")
        
        if response.status_code == 200:
            return {'success': True, 'data': result}
        else:
            return {'success': False, 'error': result.get('message', str(result))}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def send_email_campaign(subject, content, recipient_email):
    """
    Send email via Brevo API
    """
    if not BREVO_API_KEY:
        return {'success': False, 'error': 'Brevo API key not configured'}
    
    headers = {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Convert content to HTML
    html_content = content.replace('\n', '<br>')
    
    payload = {
        'sender': {'name': 'AutoMarketer', 'email': 'shivarammore68@gmail.com'},
        'to': [{'email': recipient_email}],
        'subject': subject,
        'htmlContent': f'<html><body>{html_content}</body></html>'
    }
    
    try:
        response = requests.post(
            f'{BREVO_BASE_URL}/smtp/email',
            headers=headers,
            json=payload
        )
        result = response.json()
        
        if response.status_code in [200, 201]:
            return {'success': True, 'data': result}
        else:
            return {'success': False, 'error': result.get('message', 'Unknown error')}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def post_to_blogger(title, content, image_url=None):
    """
    Post to Blogger - Returns formatted content for manual posting
    (Blogger API requires OAuth2 which is complex for demos)
    """
    BLOGGER_BLOG_ID = os.getenv('BLOGGER_BLOG_ID')
    
    if not BLOGGER_BLOG_ID:
        return {'success': False, 'error': 'Blogger Blog ID not configured'}
    
    # Format content as HTML
    html_content = content.replace('\n', '<br>')
    if image_url:
        html_content = f'<img src="{image_url}" alt="Featured Image" style="max-width:100%"><br><br>{html_content}'
    
    # Return success with instructions to open Blogger
    blogger_url = f'https://www.blogger.com/blog/post/create/{BLOGGER_BLOG_ID}'
    
    return {
        'success': True,
        'data': {
            'title': title,
            'content': html_content,
            'blogger_url': blogger_url,
            'message': 'Content ready! Opening Blogger editor...'
        }
    }



def publish_content(platform, content, image_url=None, video_url=None, extra_data=None):
    """
    Unified publishing function - supports text, images, and videos
    """
    platform_lower = platform.lower()
    
    print(f"📢 Publish to {platform}: content={content[:50]}..., image={image_url}, video={video_url}")
    
    if platform_lower == 'twitter':
        return post_to_twitter(content, image_url, video_url)
    elif platform_lower == 'linkedin':
        return post_to_linkedin(content, image_url, video_url)
    elif platform_lower == 'email':
        if not extra_data or 'recipient' not in extra_data:
            return {'success': False, 'error': 'Recipient email required'}
        subject = extra_data.get('subject', 'Marketing Update')
        return send_email_campaign(subject, content, extra_data['recipient'])
    elif platform_lower == 'blog':
        title = extra_data.get('title', 'New Blog Post') if extra_data else 'New Blog Post'
        return post_to_blogger(title, content, image_url)
    elif platform_lower == 'instagram':
        # Instagram via Ayrshare - try with video
        if not AYRSHARE_API_KEY:
            return {'success': False, 'error': 'Ayrshare API key not configured'}
        
        headers = {
            'Authorization': f'Bearer {AYRSHARE_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'post': content,
            'platforms': ['instagram']
        }
        
        if video_url:
            payload['mediaUrls'] = [video_url]
            payload['isVideo'] = True
        elif image_url:
            payload['mediaUrls'] = [image_url]
        
        try:
            response = requests.post(f'{AYRSHARE_BASE_URL}/post', headers=headers, json=payload)
            result = response.json()
            print(f"📥 Instagram response: {result}")
            if response.status_code == 200:
                return {'success': True, 'data': result}
            return {'success': False, 'error': result.get('message', str(result))}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    else:
        return {'success': False, 'error': f'Platform {platform} not supported'}

