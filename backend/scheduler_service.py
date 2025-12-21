"""
Automated Post Scheduler Service
Generates trend-based content and posts at optimal peak hours
"""
import os
import threading
import time
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests

load_dotenv()

# Ayrshare API
AYRSHARE_API_KEY = os.getenv('AYRSHARE_API_KEY')
AYRSHARE_BASE_URL = 'https://api.ayrshare.com/api'

# Default peak hours by platform (24-hour format)
# Based on industry research: Sprout Social, Hootsuite, Buffer studies
DEFAULT_PEAK_HOURS = {
    'twitter': [9, 10, 11, 17, 18, 21],      # 9-11 AM, 5-6 PM, 9 PM
    'linkedin': [7, 8, 12, 17, 18],           # 7-8 AM, 12 PM, 5-6 PM
    'instagram': [11, 12, 13, 19, 20, 21],    # 11 AM-1 PM, 7-9 PM
    'facebook': [9, 13, 16, 19]               # 9 AM, 1 PM, 4 PM, 7 PM
}

# Peak hours config file path
PEAK_HOURS_FILE = os.path.join(os.path.dirname(__file__), 'peak_hours_config.json')

# Scheduler state
scheduler_running = False
scheduled_posts = []


def load_peak_hours():
    """Load custom peak hours from config file, or use defaults"""
    try:
        if os.path.exists(PEAK_HOURS_FILE):
            with open(PEAK_HOURS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading peak hours config: {e}")
    return DEFAULT_PEAK_HOURS.copy()


def save_peak_hours(peak_hours):
    """Save custom peak hours to config file"""
    try:
        with open(PEAK_HOURS_FILE, 'w') as f:
            json.dump(peak_hours, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving peak hours config: {e}")
        return False


def update_peak_hours(platform, hours):
    """Update peak hours for a specific platform"""
    peak_hours = load_peak_hours()
    peak_hours[platform.lower()] = sorted(list(set(hours)))  # Remove duplicates, sort
    save_peak_hours(peak_hours)
    return peak_hours


def is_peak_hour(platform):
    """Check if current hour is peak for the platform"""
    current_hour = datetime.now().hour
    peak_hours = load_peak_hours()
    return current_hour in peak_hours.get(platform.lower(), [])



def get_next_peak_hour(platform):
    """Get the next peak hour for scheduling"""
    current_hour = datetime.now().hour
    peak_hours = load_peak_hours().get(platform.lower(), [9, 12, 18])
    
    for hour in sorted(peak_hours):
        if hour > current_hour:
            return hour
    
    # Next day's first peak hour
    return sorted(peak_hours)[0]


def post_to_ayrshare(content, platforms, image_url=None, schedule_time=None):
    """
    Post to social media via Ayrshare API
    Supports immediate posting or scheduling
    """
    if not AYRSHARE_API_KEY:
        return {'success': False, 'error': 'Ayrshare API key not configured'}
    
    headers = {
        'Authorization': f'Bearer {AYRSHARE_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Truncate for Twitter (280 char limit, minus 24 for Ayrshare free plan prefix)
    # Ayrshare adds "[Sent with Free Plan] " to free tier posts
    TWITTER_LIMIT = 250  # 280 - 24 (prefix) - ~6 (buffer)
    platforms_list = platforms if isinstance(platforms, list) else [platforms]
    post_content = content
    if 'twitter' in [p.lower() for p in platforms_list]:
        if len(content) > TWITTER_LIMIT:
            post_content = content[:TWITTER_LIMIT - 3] + '...'
    
    payload = {
        'post': post_content,
        'platforms': platforms_list
    }
    
    if image_url:
        payload['mediaUrls'] = [image_url]
    
    # Schedule for future if time provided (ISO format)
    if schedule_time:
        payload['scheduledDate'] = schedule_time
    
    try:
        response = requests.post(
            f'{AYRSHARE_BASE_URL}/post',
            headers=headers,
            json=payload,
            timeout=30
        )
        result = response.json()
        
        if response.status_code in [200, 201]:
            return {'success': True, 'data': result}
        else:
            return {'success': False, 'error': result.get('message', str(result))}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def post_to_blogger(title, content, image_url=None):
    """
    Post to Blogger via Google Blogger API
    Uses GOOGLE_API_KEY and BLOGGER_BLOG_ID from .env
    """
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    BLOGGER_BLOG_ID = os.getenv('BLOGGER_BLOG_ID')
    
    if not GOOGLE_API_KEY or not BLOGGER_BLOG_ID:
        return {'success': False, 'error': 'Blogger credentials not configured (GOOGLE_API_KEY or BLOGGER_BLOG_ID missing)'}
    
    # Blogger API endpoint
    api_url = f'https://www.googleapis.com/blogger/v3/blogs/{BLOGGER_BLOG_ID}/posts/'
    
    # Convert content to HTML
    html_content = content.replace('\n', '<br>')
    if image_url:
        html_content = f'<img src="{image_url}" alt="Featured Image" style="max-width:100%"><br><br>{html_content}'
    
    payload = {
        'kind': 'blogger#post',
        'blog': {'id': BLOGGER_BLOG_ID},
        'title': title,
        'content': html_content
    }
    
    try:
        response = requests.post(
            api_url,
            params={'key': GOOGLE_API_KEY, 'isDraft': 'false'},
            json=payload,
            timeout=30
        )
        result = response.json()
        
        if response.status_code in [200, 201]:
            return {'success': True, 'data': {'id': result.get('id'), 'url': result.get('url')}}
        else:
            error_msg = result.get('error', {}).get('message', str(result))
            return {'success': False, 'error': error_msg}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def schedule_post(content, platforms, image_url=None, hours_from_now=None):
    """
    Schedule a post for the next peak hour or specific time
    """
    if hours_from_now:
        schedule_time = datetime.now() + timedelta(hours=hours_from_now)
    else:
        # Find next peak hour
        platform = platforms[0] if isinstance(platforms, list) else platforms
        next_peak = get_next_peak_hour(platform)
        schedule_time = datetime.now().replace(hour=next_peak, minute=0, second=0)
        
        # If peak hour passed, schedule for tomorrow
        if schedule_time <= datetime.now():
            schedule_time += timedelta(days=1)
    
    # Format for Ayrshare (ISO 8601)
    schedule_iso = schedule_time.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    result = post_to_ayrshare(content, platforms, image_url, schedule_iso)
    
    if result.get('success'):
        scheduled_posts.append({
            'content': content[:100] + '...' if len(content) > 100 else content,
            'platforms': platforms,
            'scheduled_time': schedule_time.strftime('%Y-%m-%d %H:%M'),
            'status': 'scheduled'
        })
    
    return result


def auto_post_trending(business_id, platforms=['twitter', 'linkedin']):
    """
    Automatically generate and post content based on trending topics
    """
    from ai_service import fetch_latest_news, generate_marketing_content, generate_image_from_text
    from models import BusinessProfile
    
    try:
        # Get business info
        business = BusinessProfile.query.get(business_id)
        if not business:
            return {'success': False, 'error': 'Business not found'}
        
        # Get trending news
        news = fetch_latest_news(business.industry)
        
        if not news:
            return {'success': False, 'error': 'No trending topics found'}
        
        # Generate content for each platform
        results = []
        for platform in platforms:
            gen_result = generate_marketing_content(
                platform,
                business.to_dict(),
                topic=f"Trending: {news[0].get('title') if isinstance(news[0], dict) else news[0]}"
            )
            
            content = gen_result.get('post_content') if isinstance(gen_result, dict) else str(gen_result)
            image_prompt = gen_result.get('image_prompt') if isinstance(gen_result, dict) else None
            
            if content:
                # Generate AI Image for the trending post
                image_url = None
                if image_prompt:
                    image_url = generate_image_from_text(image_prompt)
                
                # Schedule for next peak hour
                result = schedule_post(content, [platform], image_url=image_url)
                results.append({
                    'platform': platform,
                    'result': result
                })
        
        return {'success': True, 'posts': results}
    
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_scheduled_posts():
    """Return list of scheduled posts"""
    return scheduled_posts


def get_peak_hours_info():
    """Return peak hours configuration"""
    return load_peak_hours()


def post_immediately(content, platforms, image_url=None, title=None):
    """
    Post immediately to specified platforms
    Routes blog posts to Blogger API, others to Ayrshare
    """
    results = []
    platforms_list = platforms if isinstance(platforms, list) else [platforms]
    
    for platform in platforms_list:
        platform_lower = platform.lower()
        
        if platform_lower == 'blog':
            # Use Blogger API for blog posts
            post_title = title or 'AutoMarketer Post'
            result = post_to_blogger(post_title, content, image_url)
            results.append({'platform': platform, 'result': result})
        elif platform_lower == 'email':
            # Use Brevo for email
            from social_service import send_email_campaign
            # For email, we need a recipient - use a default or skip
            result = {'success': False, 'error': 'Email requires a recipient. Use the publish endpoint with recipient parameter.'}
            results.append({'platform': platform, 'result': result})
        else:
            # Use Ayrshare for social media (twitter, linkedin, instagram, facebook)
            result = post_to_ayrshare(content, [platform], image_url)
            results.append({'platform': platform, 'result': result})
    
    # If single platform, return single result
    if len(results) == 1:
        return results[0]['result']
    
    # For multiple platforms, return aggregated
    success = all(r['result'].get('success') for r in results)
    return {
        'success': success,
        'data': results,
        'message': f"Posted to {len([r for r in results if r['result'].get('success')])} platforms"
    }


# Background scheduler (optional - for continuous automation)
def start_auto_scheduler(business_id, interval_hours=4):
    """Start background scheduler for automatic posting"""
    global scheduler_running
    scheduler_running = True
    
    def scheduler_loop():
        while scheduler_running:
            # Only post during peak hours
            for platform in ['twitter', 'linkedin']:
                if is_peak_hour(platform):
                    auto_post_trending(business_id, [platform])
            
            # Wait for next interval
            time.sleep(interval_hours * 3600)
    
    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()
    return {'success': True, 'message': f'Auto-scheduler started (every {interval_hours} hours)'}


def stop_auto_scheduler():
    """Stop the background scheduler"""
    global scheduler_running
    scheduler_running = False
    return {'success': True, 'message': 'Auto-scheduler stopped'}
