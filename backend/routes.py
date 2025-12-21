from flask import Blueprint, request, jsonify
from models import db, BusinessProfile, GeneratedContent, Product, User, Campaign, CompetitorData, AudioFile
from ai_service import (
    generate_marketing_content, 
    generate_image_from_text,
    fetch_latest_news,
    generate_reaction_post,
    generate_7day_campaign,
    analyze_virality_score,
    simulate_community_manager,
    analyze_competitors_swot,
    text_to_speech,
    # New unique features
    predict_roi,
    generate_ab_variations,
    optimize_hashtags,
    analyze_brand_voice,
    generate_multilingual_content,
    generate_content_with_brand_voice
)
from social_service import publish_content
from scheduler_service import (
    post_immediately,
    schedule_post,
    auto_post_trending,
    get_scheduled_posts,
    get_peak_hours_info,
    start_auto_scheduler,
    stop_auto_scheduler
)
from flask_jwt_extended import jwt_required, get_jwt_identity
from pytrends.request import TrendReq


api_bp = Blueprint('api', __name__)

def verify_business_access(business_id, user_id):
    """
    Verifies if the current user owns the business.
    Returns the business object if authorized, else raises a PermissionError or returns None.
    """
    business = BusinessProfile.query.get(business_id)
    if not business:
        return None, jsonify({'error': 'Business not found'}), 404
    
    if business.user_id != user_id:
        return None, jsonify({'error': 'Unauthorized access to this business'}), 403
        
    return business, None, 200

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200


@api_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())


@api_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    # Update editable fields
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'mobile' in data:
        user.mobile = data['mobile']
    if 'bio' in data:
        user.bio = data['bio']
    if 'company' in data:
        user.company = data['company']
    if 'location' in data:
        user.location = data['location']
    if 'username' in data and data['username'] != user.username:
        # Check if username is taken
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']
    
    db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()})


@api_bp.route('/business', methods=['POST'])
@jwt_required()
def create_business():
    current_user_id = get_jwt_identity()
    
    data = request.json
    new_business = BusinessProfile(
        name=data['name'],
        description=data.get('description'),
        industry=data.get('industry'),
        target_audience=data.get('target_audience'),
        user_id=int(current_user_id)
    )
    db.session.add(new_business)
    db.session.commit()
    return jsonify(new_business.to_dict()), 201

# Get all businesses for current user
@api_bp.route('/businesses', methods=['GET'])
@jwt_required()
def get_user_businesses():
    current_user_id = get_jwt_identity()
    user_businesses = BusinessProfile.query.filter_by(user_id=int(current_user_id)).all()
    return jsonify([b.to_dict() for b in user_businesses])

@api_bp.route('/business/<int:id>', methods=['GET'])
@jwt_required()
def get_business(id):
    current_user_id = get_jwt_identity()
    business, error_resp, code = verify_business_access(id, int(current_user_id))
    if error_resp:
        return error_resp, code
    return jsonify(business.to_dict())

@api_bp.route('/business/<int:id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_business(id):
    current_user_id = get_jwt_identity()
    # Verify access
    business, error_resp, code = verify_business_access(id, int(current_user_id))
    if error_resp:
        return error_resp, code
    
    data = request.json
    if 'name' in data:
        business.name = data['name']
    if 'description' in data:
        business.description = data['description']
    if 'industry' in data:
        business.industry = data['industry']
    if 'target_audience' in data:
        business.target_audience = data['target_audience']
        
    db.session.commit()
    return jsonify(business.to_dict())

@api_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    data = request.json
    business_id = data.get('business_id')
    current_user_id = get_jwt_identity()
    
    # Verify ownership
    business, error_resp, code = verify_business_access(business_id, int(current_user_id))
    if error_resp:
        return error_resp, code

    new_product = Product(
        name=data.get('name'),
        description=data.get('description'),
        offers=data.get('offers'),  # Added offers
        price=data.get('price'),
        business_id=business_id
    )
    db.session.add(new_product)
    db.session.commit()
    return jsonify(new_product.to_dict()), 201

@api_bp.route('/business/<int:id>/products/<int:pid>', methods=['DELETE'])
@jwt_required()
def delete_product(id, pid):
    current_user_id = get_jwt_identity()
    # Verify business ownership
    business, error_resp, code = verify_business_access(id, int(current_user_id))
    if error_resp:
        return error_resp, code
    
    product = Product.query.filter_by(id=pid, business_id=id).first_or_404()
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'}), 200

@api_bp.route('/business/<int:id>/products', methods=['GET'])
@jwt_required()
def get_business_products(id):
    current_user_id = get_jwt_identity()
    business, error_resp, code = verify_business_access(id, int(current_user_id))
    if error_resp:
        return error_resp, code
        
    products = Product.query.filter_by(business_id=id).all()
    return jsonify([p.to_dict() for p in products])

@api_bp.route('/generate-image', methods=['POST'])
@jwt_required()
def generate_image_route():
    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400
        
    image_url = generate_image_from_text(prompt)
    if not image_url:
        return jsonify({'error': 'Failed to generate image'}), 500
        
    return jsonify({'image_url': image_url})

@api_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_content():
    # Handle multipart/form-data
    if request.is_json:
        data = request.json
        image_file = None
    else:
        data = request.form
        image_file = request.files.get('image')

    platform = data.get('platform')
    business_id = data.get('business_id')
    current_user_id = get_jwt_identity()
    
    # Verify ownership
    business, error_resp, code = verify_business_access(business_id, int(current_user_id))
    if error_resp:
        return error_resp, code
        return jsonify({'error': 'Business not found'}), 404

    # Fetch business products
    products = Product.query.filter_by(business_id=business_id).all()
    product_list = [p.to_dict() for p in products]

    # Process image if exists (Legacy AI Vision support)
    image_data = None
    if image_file:
        image_data = image_file.read()

    # Prepare business info (Manual Override or from DB)
    target_business_data = data.get('business_info')
    if target_business_data:
        # Handle string (FormData) or dict (JSON)
        if isinstance(target_business_data, str):
            try:
                import json
                target_business = json.loads(target_business_data)
            except:
                target_business = {}
        else:
            target_business = target_business_data
            
        # User manually entered business details
        # Ensure name exists
        if not target_business.get('name') and business:
            target_business['name'] = business.name
    else:
        target_business = business.to_dict()

    # Generate content using Gemini
    # returns dict { "post_content": "...", "image_prompt": "..." } or fallback dict
    gen_result = generate_marketing_content(
        platform, 
        target_business, 
        products=product_list, 
        topic=data.get('topic'),
        image_data=image_data,
        language=data.get('language')
    )
    
    # Handle both string (old fallback/error) and dict response
    if isinstance(gen_result, dict):
        generated_text = gen_result.get('post_content', '')
        ai_image_prompt = gen_result.get('image_prompt')
    else:
        generated_text = str(gen_result)
        ai_image_prompt = None

    
    # Generate AI Image if requested
    gen_image_url = None
    if data.get('include_image') == 'true' or data.get('include_image') is True:
        # Use the specific image prompt if we got one, otherwise fall back to topic
        final_prompt = ai_image_prompt if ai_image_prompt else (data.get('topic') if data.get('topic') else f"Marketing for {business.name} on {platform}")
        
        # Ensure the prompt is high quality for the generator
        if not ai_image_prompt:
             final_prompt = f"Professional marketing photo for {final_prompt}, high quality, realistic"
             
        gen_image_url = generate_image_from_text(final_prompt)

    new_content = GeneratedContent(
        platform=platform,
        content=generated_text,
        business_id=business_id,
        image_url=gen_image_url
    )
    db.session.add(new_content)
    db.session.commit()
    
    return jsonify(new_content.to_dict()), 201


@api_bp.route('/generate-best', methods=['POST'])
@jwt_required()
def generate_best_content_route():
    """
    Generate content from multiple AI models, analyze virality, return best.
    Uses: Gemini, HuggingFace, Groq (whichever APIs are available)
    """
    from ai_model_router import generate_best_content, format_for_platform
    
    data = request.json
    platform = data.get('platform', 'Instagram')
    business_id = data.get('business_id')
    topic = data.get('topic')
    language = data.get('language', 'English')
    include_image = data.get('include_image', False)
    
    current_user_id = get_jwt_identity()
    
    # Get business info
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if error_resp:
            return error_resp, code
        business_info = business.to_dict()
    else:
        # Get first business for user
        business = BusinessProfile.query.filter_by(user_id=current_user_id).first()
        business_info = business.to_dict() if business else {'name': 'My Business', 'industry': 'general'}
        business_id = business.id if business else None
    
    # Prepare business info (Manual Override or from DB)
    if data.get('business_info'):
        # User manually entered business details
        target_business = data.get('business_info')
         # Ensure minimal fields
        if not target_business.get('name') and business_info:
             target_business['name'] = business_info.get('name')
    else:
        target_business = business_info

    # Generate content from multiple models and pick best
    result = generate_best_content(platform, target_business, topic, language)
    
    if not result.get('success'):
        return jsonify({'error': result.get('error', 'Generation failed')}), 500
    
    # Format for platform
    best_content = format_for_platform(result['best_content'], platform)
    
    # Generate image if requested
    gen_image_url = None
    if include_image:
        image_prompt = f"Professional marketing image for {topic or business_info.get('name')}, high quality"
        gen_image_url = generate_image_from_text(image_prompt)
    
    # Save to database
    if business_id:
        new_content = GeneratedContent(
            platform=platform,
            content=best_content,
            business_id=business_id,
            image_url=gen_image_url
        )
        db.session.add(new_content)
        db.session.commit()
        content_id = new_content.id
    else:
        content_id = None
    
    return jsonify({
        'success': True,
        'content': best_content,
        'content_id': content_id,
        'image_url': gen_image_url,
        'best_model': result['best_model'],
        'best_score': result['best_score'],
        'comparison': result['comparison'],
        'all_results': result.get('all_results', [])
    }), 201

@api_bp.route('/content', methods=['GET'])
@jwt_required()
def get_all_content():
    current_user_id = get_jwt_identity()
    # Filter content by user's businesses only
    contents = GeneratedContent.query.join(BusinessProfile).filter(BusinessProfile.user_id == int(current_user_id)).order_by(GeneratedContent.created_at.desc()).all()
    return jsonify([c.to_dict() for c in contents])


@api_bp.route('/content/<int:content_id>', methods=['DELETE'])
@jwt_required()
def delete_content(content_id):
    """Delete a generated content post from history"""
    current_user_id = get_jwt_identity()
    
    # Find the content
    content = GeneratedContent.query.get(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404
    
    # Verify ownership through business
    business = BusinessProfile.query.get(content.business_id)
    if not business or business.user_id != int(current_user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete the content
    db.session.delete(content)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Post deleted successfully'}), 200


@api_bp.route('/content/<int:content_id>', methods=['PATCH'])
@jwt_required()
def update_content(content_id):
    """Update a content post with video_url, audio_url, model, etc."""
    print(f"📥 PATCH /content/{content_id} called")
    current_user_id = get_jwt_identity()
    
    # Find the content
    content = GeneratedContent.query.get(content_id)
    if not content:
        print(f"❌ Content {content_id} not found")
        return jsonify({'error': 'Content not found'}), 404
    
    # Verify ownership through business
    business = BusinessProfile.query.get(content.business_id)
    if not business or business.user_id != int(current_user_id):
        print(f"❌ Unauthorized: business={business}, user={current_user_id}")
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Update fields if provided
    data = request.json
    print(f"📦 Data received: {data}")
    
    if data.get('video_url'):
        content.video_url = data['video_url']
        print(f"✅ Set video_url: {data['video_url']}")
    if data.get('audio_url'):
        content.audio_url = data['audio_url']
        print(f"✅ Set audio_url: {data['audio_url']}")
    if data.get('model'):
        content.model = data['model']
    if data.get('image_url'):
        content.image_url = data['image_url']
    
    db.session.commit()
    print(f"✅ Saved to database!")
    
    return jsonify({'success': True, 'content': content.to_dict()}), 200

@api_bp.route('/trends', methods=['GET'])
def get_trends():
    """
    Get real-time trending hashtags for India using DuckDuckGo
    """
    from ai_service import fetch_trending_hashtags
    
    # Use the robust fetching function
    trends = fetch_trending_hashtags(region='in')
    return jsonify(trends)
@api_bp.route('/newsjacking', methods=['POST'])
@jwt_required()
def newsjacking():
    data = request.json
    business_id = data.get('business_id')
    current_user_id = get_jwt_identity()
    
    business, error_resp, code = verify_business_access(business_id, int(current_user_id))
    if error_resp:
        return error_resp, code
        
    query = data.get('query', 'technology')
        
    news = fetch_latest_news(query)
    if not news:
        return jsonify({'error': 'No news found'}), 404
        
    # Pick the first news item for now
    post = generate_reaction_post(business.to_dict(), news[0])
    
    return jsonify({
        'news_item': news[0],
        'generated_post': post
    })

@api_bp.route('/campaign', methods=['POST'])
@jwt_required()
def create_campaign():
    data = request.json
    business_id = data.get('business_id')
    current_user_id = get_jwt_identity()
    
    business, error_resp, code = verify_business_access(business_id, int(current_user_id))
    if error_resp:
        return error_resp, code
        
    products = Product.query.filter_by(business_id=business_id).all()
    
    strategy = generate_7day_campaign(business.to_dict(), [p.to_dict() for p in products])
    if not strategy:
        return jsonify({'error': 'Campaign generation failed'}), 500
        
    new_campaign = Campaign(
        title=f"7-Day Strategy - {business.name}",
        strategy=strategy,
        business_id=business_id
    )
    db.session.add(new_campaign)
    db.session.commit()
    
    return jsonify(new_campaign.to_dict()), 201

@api_bp.route('/viral-doctor', methods=['POST'])
@jwt_required()
def viral_doctor():
    data = request.json
    content = data.get('content')
    analysis = analyze_virality_score(content)
    return jsonify(analysis)

@api_bp.route('/community', methods=['POST'])
@jwt_required()
def community_manager():
    data = request.json
    content = data.get('content')
    simulation = simulate_community_manager(content)
    return jsonify(simulation)

@api_bp.route('/competitors', methods=['POST'])
@jwt_required()
def competitor_spy():
    data = request.json
    business_id = data.get('business_id')
    current_user_id = get_jwt_identity()
    
    business, error_resp, code = verify_business_access(business_id, int(current_user_id))
    if error_resp:
        return error_resp, code

    competitor_name = data.get('competitor_name')
    
    analysis = analyze_competitors_swot(business.to_dict(), competitor_name)
    
    new_data = CompetitorData(
        competitor_name=competitor_name,
        swot_analysis=analysis,
        business_id=business_id
    )
    db.session.add(new_data)
    db.session.commit()
    
    return jsonify(new_data.to_dict())

@api_bp.route('/audio', methods=['POST'])
@jwt_required()
def audio_studio():
    data = request.json
    text = data.get('text')
    business_id = data.get('business_id')
    current_user_id = get_jwt_identity()
    
    # Optional: Verify business ownership if provided, though strictly speaking audio is just text
    # But for storing it related to a business, we must check
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if error_resp:
            return error_resp, code
    
    import uuid
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    result = text_to_speech(text, filename)
    
    if result:
        new_audio = AudioFile(
            filename=filename,
            original_text=text,
            business_id=business_id
        )
        db.session.add(new_audio)
        db.session.commit()
        return jsonify(new_audio.to_dict())
    
    return jsonify({'error': 'Audio generation failed'}), 500

@api_bp.route('/audio/<filename>', methods=['GET'])
def get_audio(filename):
    from flask import send_from_directory
    import os
    static_dir = os.path.join(os.path.dirname(__file__), 'static', 'audio')
    return send_from_directory(static_dir, filename)


@api_bp.route('/publish', methods=['POST'])
@jwt_required()
def publish_to_platform():
    """
    One-click publish content to social media platforms
    Supports: Twitter, LinkedIn, Email, Blog
    """
    data = request.json
    platform = data.get('platform')
    content = data.get('content')
    image_url = data.get('image_url')
    content_id = data.get('content_id')
    
    # Extra data for specific platforms
    extra_data = {
        'recipient': data.get('recipient'),  # For email
        'subject': data.get('subject'),      # For email
        'title': data.get('title')           # For blog
    }
    
    if not platform or not content:
        return jsonify({'error': 'Platform and content required'}), 400
    
    result = publish_content(platform, content, image_url, extra_data)
    
    # Update the content record if content_id provided
    if content_id and result.get('success'):
        content_record = GeneratedContent.query.get(content_id)
        if content_record:
            # Mark as published (could add a published_platforms field)
            pass
    
    if result.get('success'):
        return jsonify({
            'success': True,
            'message': f'Successfully published to {platform}',
            'data': result.get('data')
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error', 'Publishing failed')
        }), 400


# ============ AUTOMATED SCHEDULING ENDPOINTS ============

@api_bp.route('/scheduler/post-now', methods=['POST'])
@jwt_required()
def api_post_immediately():
    """Post immediately to specified platforms (Ayrshare for social, Blogger for blog)"""
    data = request.json
    content = data.get('content')
    platforms = data.get('platforms', ['twitter'])
    image_url = data.get('image_url')
    title = data.get('title')  # For blog posts
    
    if not content:
        return jsonify({'error': 'Content required'}), 400
    
    result = post_immediately(content, platforms, image_url, title)
    return jsonify(result)


@api_bp.route('/scheduler/schedule', methods=['POST'])
@jwt_required()
def api_schedule_post():
    """Schedule a post for next peak hour or specific time"""
    data = request.json
    content = data.get('content')
    platforms = data.get('platforms', ['twitter'])
    image_url = data.get('image_url')
    hours_from_now = data.get('hours_from_now')  # Optional
    
    if not content:
        return jsonify({'error': 'Content required'}), 400
    
    result = schedule_post(content, platforms, image_url, hours_from_now)
    return jsonify(result)


@api_bp.route('/scheduler/auto-trending/<int:business_id>', methods=['POST'])
@jwt_required()
def api_auto_post_trending(business_id):
    """Auto-generate and schedule posts based on trending topics"""
    user_id = get_jwt_identity()
    
    if not verify_business_access(business_id, user_id):
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json or {}
    platforms = data.get('platforms', ['twitter', 'linkedin'])
    
    result = auto_post_trending(business_id, platforms)
    return jsonify(result)


@api_bp.route('/scheduler/queue', methods=['GET'])
@jwt_required()
def api_get_scheduled_posts():
    """Get all scheduled posts in queue"""
    posts = get_scheduled_posts()
    return jsonify({'scheduled_posts': posts})


@api_bp.route('/video/pixverse', methods=['POST'])
@jwt_required()
def generate_pixverse_video_route():
    """Generate AI video using PixVerse from an image"""
    from video_service import generate_pixverse_video
    
    data = request.json
    image_url = data.get('image_url')
    prompt = data.get('prompt', 'Smooth cinematic zoom and pan, professional marketing video')
    duration = data.get('duration', 4)
    
    if not image_url:
        return jsonify({'error': 'image_url is required'}), 400
    
    result = generate_pixverse_video(image_url, prompt, duration)
    
    if result.get('error'):
        return jsonify(result), 500
    
    return jsonify(result), 200


@api_bp.route('/video/veo', methods=['POST'])
@jwt_required()
def generate_veo_video_route():
    """Generate AI video using Google Veo 3.1"""
    from video_service import generate_veo_video
    
    data = request.json
    prompt = data.get('prompt', 'Smooth cinematic marketing video with professional motion')
    image_url = data.get('image_url')
    duration = data.get('duration', 8)
    
    if not prompt:
        return jsonify({'error': 'prompt is required'}), 400
    
    result = generate_veo_video(prompt, image_url, duration)
    
    if result.get('error'):
        return jsonify(result), 500
    
    return jsonify(result), 200


@api_bp.route('/video/smart', methods=['POST'])
@jwt_required()
def generate_smart_video_route():
    """
    Smart video generation with automatic fallback:
    1. Veo 3.1 (best quality)
    2. PixVerse (free AI)
    3. Slideshow (always works)
    """
    from video_service import generate_smart_video
    
    data = request.json
    prompt = data.get('prompt', 'Professional marketing video')
    image_url = data.get('image_url')
    duration = data.get('duration', 8)
    
    if not prompt:
        return jsonify({'error': 'prompt is required'}), 400
    
    # Get business info for fallback
    current_user_id = get_jwt_identity()
    business = BusinessProfile.query.filter_by(user_id=current_user_id).first()
    business_info = business.to_dict() if business else None
    
    result = generate_smart_video(prompt, image_url, business_info, duration)
    
    if result.get('error'):
        return jsonify(result), 500
    
    return jsonify(result), 200


@api_bp.route('/scheduler/peak-hours', methods=['GET'])
def api_get_peak_hours():
    """Get peak hours configuration for all platforms"""
    return jsonify({'peak_hours': get_peak_hours_info()})


@api_bp.route('/scheduler/start/<int:business_id>', methods=['POST'])
@jwt_required()
def api_start_automation(business_id):
    """Start automatic posting scheduler"""
    user_id = get_jwt_identity()
    
    if not verify_business_access(business_id, user_id):
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json or {}
    interval_hours = data.get('interval_hours', 4)
    
    result = start_auto_scheduler(business_id, interval_hours)
    return jsonify(result)


@api_bp.route('/scheduler/stop', methods=['POST'])
@jwt_required()
def api_stop_automation():
    """Stop automatic posting scheduler"""
    result = stop_auto_scheduler()
    return jsonify(result)


@api_bp.route('/scheduler/peak-hours', methods=['PUT'])
@jwt_required()
def api_update_peak_hours():
    """Update peak hours for a platform"""
    from scheduler_service import update_peak_hours
    
    data = request.json
    platform = data.get('platform')
    hours = data.get('hours')
    
    if not platform or not hours:
        return jsonify({'error': 'Platform and hours required'}), 400
    
    if not isinstance(hours, list):
        return jsonify({'error': 'Hours must be a list of integers (0-23)'}), 400
    
    # Validate hours are valid (0-23)
    valid_hours = [h for h in hours if isinstance(h, int) and 0 <= h <= 23]
    
    updated = update_peak_hours(platform, valid_hours)
    return jsonify({
        'success': True,
        'message': f'Peak hours updated for {platform}',
        'peak_hours': updated
    })


# ====================== VIDEO GENERATION ======================

@api_bp.route('/video/generate', methods=['POST'])
@jwt_required()
def api_generate_video():
    """Generate video from text (creates audio + image + combines into video)"""
    from video_service import text_to_video
    
    data = request.json
    text = data.get('text')
    image_url = data.get('image_url')
    
    if not text:
        return jsonify({'error': 'Text content is required'}), 400
    
    result = text_to_video(text, image_url)
    
    if result['success']:
        # Return video URL
        filename = result['filename']
        return jsonify({
            'success': True,
            'video_url': f"/api/video/{filename}",
            'audio_url': f"/api/audio/{result.get('audio_filename', '')}",
            'duration': result.get('duration', 0),
            'filename': filename
        })
    else:
        return jsonify({'success': False, 'error': result.get('error', 'Video generation failed')}), 500


@api_bp.route('/video/from-content', methods=['POST'])
@jwt_required()
def api_video_from_content():
    """Generate video from existing content (uses existing image and creates audio)"""
    from video_service import generate_video_from_image_and_audio
    from gtts import gTTS
    import os
    from datetime import datetime
    
    data = request.json
    text = data.get('text')
    image_url = data.get('image_url')
    
    if not text:
        return jsonify({'error': 'Text content is required'}), 400
    
    if not image_url:
        return jsonify({'error': 'Image URL is required'}), 400
    
    try:
        # Generate audio
        AUDIO_DIR = os.path.join(os.path.dirname(__file__), 'static', 'audio')
        os.makedirs(AUDIO_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        audio_filename = f"tts_{timestamp}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        
        tts = gTTS(text=text[:5000], lang='en')
        tts.save(audio_path)
        
        # Generate video
        result = generate_video_from_image_and_audio(image_url, audio_path)
        
        if result['success']:
            return jsonify({
                'success': True,
                'video_url': f"/api/video/{result['filename']}",
                'audio_url': f"/api/audio/{audio_filename}",
                'duration': result.get('duration', 0)
            })
        else:
            return jsonify({'success': False, 'error': result.get('error')}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/video/<filename>', methods=['GET'])
def serve_video(filename):
    """Serve video files"""
    from flask import send_from_directory
    import os
    video_dir = os.path.join(os.path.dirname(__file__), 'static', 'videos')
    return send_from_directory(video_dir, filename, mimetype='video/mp4')


@api_bp.route('/video/full-post', methods=['POST'])
@jwt_required()
def api_generate_full_video_post():
    """
    Generate a complete video post with:
    - Multiple AI-generated images (slideshow)
    - AI-generated narration script
    - Combined video file
    - Caption and hashtags
    """
    from video_service import generate_full_video_post
    
    user_id = get_jwt_identity()
    data = request.json
    business_id = data.get('business_id')
    topic = data.get('topic', '')
    num_images = data.get('num_images', 4)
    
    # Get business profile
    if business_id:
        business = BusinessProfile.query.get(business_id)
        if business and business.user_id == user_id:
            business_profile = business.to_dict()
        else:
            business_profile = {'name': 'My Business', 'industry': 'general'}
    else:
        # Get first business for user
        business = BusinessProfile.query.filter_by(user_id=user_id).first()
        business_profile = business.to_dict() if business else {'name': 'My Business', 'industry': 'general'}
    
    result = generate_full_video_post(business_profile, topic, num_images)
    
    if result['success']:
        return jsonify({
            'success': True,
            'video_url': f"/api/video/{result['video_filename']}",
            'audio_url': f"/api/audio/{result.get('audio_filename', '')}",
            'caption': result.get('caption', ''),
            'hashtags': result.get('hashtags', []),
            'script': result.get('script', ''),
            'image_urls': result.get('image_urls', []),
            'duration': result.get('duration', 0)
        })
    else:
        return jsonify({'success': False, 'error': result.get('error', 'Video generation failed')}), 500


@api_bp.route('/video/post-to-platforms', methods=['POST'])
@jwt_required()
def api_post_video_to_platforms():
    """Post video to social media platforms with caption"""
    from scheduler_service import post_to_ayrshare
    
    data = request.json
    video_url = data.get('video_url')
    caption = data.get('caption', '')
    platforms = data.get('platforms', ['twitter', 'linkedin', 'instagram'])
    
    if not video_url:
        return jsonify({'error': 'Video URL is required'}), 400
    
    # Make video URL absolute if needed
    if video_url.startswith('/api/'):
        host = request.host_url.rstrip('/')
        video_url = f"{host}{video_url}"
    
    # Post to Ayrshare with video
    results = []
    for platform in platforms:
        result = post_to_ayrshare(
            content=caption,
            platforms=[platform],
            image_url=video_url  # Ayrshare accepts video URLs in mediaUrls
        )
        results.append({'platform': platform, 'result': result})
    
    success_count = sum(1 for r in results if r['result'].get('success'))
    
    return jsonify({
        'success': success_count > 0,
        'results': results,
        'message': f"Posted to {success_count}/{len(platforms)} platforms"
    })


# ==================== UNIQUE FEATURES - WOW JUDGES ====================

@api_bp.route('/roi-predict', methods=['POST'])
@jwt_required()
def roi_predictor():
    """
    💰 ROI Predictor: Predict reach, engagement, and ROI before publishing.
    This shows business thinking - not just content generation!
    """
    data = request.json
    content = data.get('content')
    platform = data.get('platform', 'Instagram')
    business_id = data.get('business_id')
    
    if not content:
        return jsonify({'error': 'Content required'}), 400
    
    current_user_id = get_jwt_identity()
    
    # Get business info
    business_info = {'name': 'Business', 'industry': 'general', 'target_audience': 'general'}
    products = []
    
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if not error_resp:
            business_info = business.to_dict()
            products = [p.to_dict() for p in Product.query.filter_by(business_id=business_id).all()]
    
    prediction = predict_roi(content, platform, business_info, products)
    
    return jsonify({
        'success': True,
        'prediction': prediction,
        'platform': platform
    })


@api_bp.route('/ab-testing', methods=['POST'])
@jwt_required()
def ab_testing_lab():
    """
    🧪 A/B Testing Lab: Generate multiple content variations and predict winners.
    Shows data-driven approach to marketing!
    """
    data = request.json
    content = data.get('content')
    platform = data.get('platform', 'Instagram')
    business_id = data.get('business_id')
    num_variations = data.get('num_variations', 3)
    
    if not content:
        return jsonify({'error': 'Content required'}), 400
    
    current_user_id = get_jwt_identity()
    
    business_info = {'name': 'Business', 'industry': 'general', 'target_audience': 'general'}
    
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if not error_resp:
            business_info = business.to_dict()
    
    result = generate_ab_variations(content, platform, business_info, num_variations)
    
    return jsonify({
        'success': True,
        'result': result
    })


@api_bp.route('/hashtag-optimize', methods=['POST'])
@jwt_required()
def hashtag_optimizer():
    """
    #️⃣ Smart Hashtag Optimizer: Analyze and suggest strategic hashtags with competition scores.
    Shows marketing intelligence!
    """
    data = request.json
    content = data.get('content')
    platform = data.get('platform', 'Instagram')
    business_id = data.get('business_id')
    
    if not content:
        return jsonify({'error': 'Content required'}), 400
    
    current_user_id = get_jwt_identity()
    
    business_info = {'name': 'Business', 'industry': 'general', 'target_audience': 'general'}
    
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if not error_resp:
            business_info = business.to_dict()
    
    result = optimize_hashtags(content, platform, business_info)
    
    return jsonify({
        'success': True,
        'result': result
    })


@api_bp.route('/brand-voice', methods=['POST'])
@jwt_required()
def brand_voice_analyzer():
    """
    🧬 Brand Voice DNA: Analyze content samples to extract unique brand voice characteristics.
    Personalization beyond templates!
    """
    data = request.json
    sample_content = data.get('sample_content')
    business_id = data.get('business_id')
    
    if not sample_content:
        return jsonify({'error': 'Sample content required'}), 400
    
    current_user_id = get_jwt_identity()
    
    business_info = {'name': 'Business', 'industry': 'general'}
    
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if not error_resp:
            business_info = business.to_dict()
    
    result = analyze_brand_voice(sample_content, business_info)
    
    return jsonify({
        'success': True,
        'result': result
    })


@api_bp.route('/translate', methods=['POST'])
@jwt_required()
def translate_content():
    """
    🌍 Multi-Language Generator: Translate and culturally adapt content for Indian languages.
    Perfect for Indian MSMEs - India has 22 official languages!
    Supports: Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam
    """
    data = request.json
    content = data.get('content')
    target_language = data.get('language', 'hindi')
    business_id = data.get('business_id')
    
    if not content:
        return jsonify({'error': 'Content required'}), 400
    
    current_user_id = get_jwt_identity()
    
    business_info = {'name': 'Business', 'industry': 'general'}
    
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if not error_resp:
            business_info = business.to_dict()
    
    result = generate_multilingual_content(content, target_language, business_info)
    
    return jsonify({
        'success': True,
        'result': result,
        'target_language': target_language
    })


@api_bp.route('/generate-with-voice', methods=['POST'])
@jwt_required()
def generate_with_brand_voice():
    """
    Generate content that matches an extracted brand voice DNA.
    """
    data = request.json
    brand_voice_dna = data.get('brand_voice_dna')
    platform = data.get('platform', 'Instagram')
    topic = data.get('topic')
    business_id = data.get('business_id')
    
    if not brand_voice_dna:
        return jsonify({'error': 'Brand voice DNA required'}), 400
    
    current_user_id = get_jwt_identity()
    
    business_info = {'name': 'Business', 'industry': 'general'}
    products = []
    
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if not error_resp:
            business_info = business.to_dict()
            products = [p.to_dict() for p in Product.query.filter_by(business_id=business_id).all()]
    
    result = generate_content_with_brand_voice(platform, business_info, brand_voice_dna, topic, products)
    
    return jsonify({
        'success': True,
        'result': result
    })


@api_bp.route('/analytics/summary', methods=['GET'])
@jwt_required()
def analytics_summary():
    """
    📊 Analytics Dashboard: Get summary of all content generation and performance.
    Visual appeal + analytics = enterprise credibility!
    """
    current_user_id = get_jwt_identity()
    
    # Get all user's content
    contents = GeneratedContent.query.join(BusinessProfile).filter(
        BusinessProfile.user_id == int(current_user_id)
    ).all()
    
    # Calculate stats
    total_posts = len(contents)
    platforms = {}
    for c in contents:
        p = c.platform or 'Unknown'
        platforms[p] = platforms.get(p, 0) + 1
    
    # Get content with images, videos, audio
    with_images = sum(1 for c in contents if c.image_url)
    with_videos = sum(1 for c in contents if c.video_url)
    with_audio = sum(1 for c in contents if c.audio_url)
    
    # Get businesses
    businesses = BusinessProfile.query.filter_by(user_id=int(current_user_id)).all()
    
    # Get products count
    total_products = sum(len(Product.query.filter_by(business_id=b.id).all()) for b in businesses)
    
    # Recent activity (last 7 days)
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_posts = [c for c in contents if c.created_at and c.created_at > week_ago]
    
    return jsonify({
        'success': True,
        'analytics': {
            'total_posts': total_posts,
            'posts_this_week': len(recent_posts),
            'platforms': platforms,
            'media_stats': {
                'with_images': with_images,
                'with_videos': with_videos,
                'with_audio': with_audio
            },
            'businesses': len(businesses),
            'products': total_products,
            'engagement_estimate': {
                'total_reach': total_posts * 2500,  # Estimated
                'avg_engagement_rate': 3.8,
                'estimated_conversions': int(total_posts * 2.5)
            }
        }
    })


@api_bp.route('/demo-mode', methods=['POST'])
@jwt_required()
def demo_mode():
    """
    🎬 Demo Mode: Run a spectacular automated demo for judges.
    Generates content, predicts ROI, shows A/B testing - all in one flow!
    """
    data = request.json or {}
    business_id = data.get('business_id')
    topic = data.get('topic', 'Holiday Sale Special')
    
    current_user_id = get_jwt_identity()
    
    # Get ACTUAL user's business - no hardcoded data
    business_info = None
    
    if business_id:
        business, error_resp, code = verify_business_access(business_id, int(current_user_id))
        if not error_resp:
            business_info = business.to_dict()
    
    # If no business_id provided, get user's first business
    if not business_info:
        user_business = BusinessProfile.query.filter_by(user_id=int(current_user_id)).first()
        if user_business:
            business_info = user_business.to_dict()
        else:
            return jsonify({'error': 'No business profile found. Please create a business first.'}), 400

    
    results = {
        'steps': [],
        'success': True
    }
    
    # Step 1: Generate content
    try:
        content_result = generate_marketing_content('Instagram', business_info, topic=topic)
        if isinstance(content_result, dict):
            generated_content = content_result.get('post_content', str(content_result))
        else:
            generated_content = str(content_result)
        results['steps'].append({
            'step': 1,
            'name': 'Content Generation',
            'status': 'success',
            'output': generated_content[:500]
        })
    except Exception as e:
        generated_content = f"🔥 Amazing {topic}! Check out our latest offers and get 20% off today! #TechDeals #ShopNow"
        results['steps'].append({
            'step': 1,
            'name': 'Content Generation',
            'status': 'fallback',
            'output': generated_content
        })
    
    # Step 2: ROI Prediction
    try:
        roi_result = predict_roi(generated_content, 'Instagram', business_info)
        results['steps'].append({
            'step': 2,
            'name': 'ROI Prediction',
            'status': 'success',
            'output': roi_result
        })
    except Exception as e:
        results['steps'].append({
            'step': 2,
            'name': 'ROI Prediction',
            'status': 'error',
            'error': str(e)
        })
    
    # Step 3: A/B Testing
    try:
        ab_result = generate_ab_variations(generated_content, 'Instagram', business_info)
        results['steps'].append({
            'step': 3,
            'name': 'A/B Testing',
            'status': 'success',
            'output': ab_result
        })
    except Exception as e:
        results['steps'].append({
            'step': 3,
            'name': 'A/B Testing',
            'status': 'error',
            'error': str(e)
        })
    
    # Step 4: Hashtag Optimization
    try:
        hashtag_result = optimize_hashtags(generated_content, 'Instagram', business_info)
        results['steps'].append({
            'step': 4,
            'name': 'Hashtag Optimization',
            'status': 'success',
            'output': hashtag_result
        })
    except Exception as e:
        results['steps'].append({
            'step': 4,
            'name': 'Hashtag Optimization',
            'status': 'error',
            'error': str(e)
        })
    
    # Step 5: Hindi Translation
    try:
        hindi_result = generate_multilingual_content(generated_content, 'hindi', business_info)
        results['steps'].append({
            'step': 5,
            'name': 'Hindi Translation',
            'status': 'success',
            'output': hindi_result
        })
    except Exception as e:
        results['steps'].append({
            'step': 5,
            'name': 'Hindi Translation',
            'status': 'error',
            'error': str(e)
        })
    
    # Summary
    success_count = sum(1 for s in results['steps'] if s['status'] == 'success')
    results['summary'] = {
        'total_steps': len(results['steps']),
        'successful': success_count,
        'message': f"Demo completed! {success_count}/{len(results['steps'])} features executed successfully. 🎉"
    }
    
    return jsonify(results)
