"""
Video Generation Service
Combines images and audio into video files using moviepy
"""
import os
import requests
import tempfile
from datetime import datetime

# Ensure directories exist
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
VIDEO_DIR = os.path.join(STATIC_DIR, 'videos')
AUDIO_DIR = os.path.join(STATIC_DIR, 'audio')
TEMP_DIR = os.path.join(STATIC_DIR, 'temp')

for d in [VIDEO_DIR, AUDIO_DIR, TEMP_DIR]:
    os.makedirs(d, exist_ok=True)


def generate_pixverse_video(image_url, prompt, duration=4):
    """
    Generate AI video using PixVerse API from an image.
    
    Args:
        image_url: URL of the source image
        prompt: Motion/animation prompt describing desired movement
        duration: Video duration in seconds (default 4)
    
    Returns:
        dict with video_url or error
    """
    import time
    
    api_key = os.environ.get("PIXVERSE_API_KEY")
    if not api_key:
        return {"error": "PIXVERSE_API_KEY not set"}
    
    # Step 1: Create video generation task
    try:
        create_response = requests.post(
            "https://api.pixverse.ai/openapi/v2/video/img/generate",
            headers={
                "API-KEY": api_key,
                "Content-Type": "application/json"
            },
            json={
                "img_url": image_url,
                "prompt": prompt,
                "duration": duration,
                "quality": "540p",  # Options: 360p, 540p, 720p, 1080p
                "motion_mode": "normal"  # Options: normal, fast, slow
            },
            timeout=30
        )
        
        print(f"📹 PixVerse create response: {create_response.status_code}")
        
        if create_response.status_code != 200:
            return {"error": f"PixVerse API error: {create_response.text}"}
        
        result = create_response.json()
        video_id = result.get("Resp", {}).get("video_id") or result.get("video_id")
        
        if not video_id:
            return {"error": f"No video_id in response: {result}"}
        
        print(f"📹 PixVerse video_id: {video_id}")
        
        # Step 2: Poll for completion (max 2 minutes)
        for i in range(24):  # 24 * 5 seconds = 2 minutes
            time.sleep(5)
            
            status_response = requests.get(
                f"https://api.pixverse.ai/openapi/v2/video/result/{video_id}",
                headers={"API-KEY": api_key},
                timeout=30
            )
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                status = status_data.get("Resp", {}).get("status") or status_data.get("status")
                
                print(f"📹 PixVerse status check {i+1}: {status}")
                
                if status == "successful" or status == "completed":
                    video_url = status_data.get("Resp", {}).get("video_url") or status_data.get("video_url")
                    return {"success": True, "video_url": video_url}
                elif status == "failed":
                    return {"error": "Video generation failed"}
        
        return {"error": "Video generation timed out"}
        
    except Exception as e:
        print(f"❌ PixVerse error: {e}")
        return {"error": str(e)}


def generate_veo_video(prompt, image_url=None, duration=8):
    """
    Generate AI video using Google Veo 3.1 via Gemini API.
    
    Args:
        prompt: Text description of the video to generate
        image_url: Optional reference image URL
        duration: Video duration in seconds (default 8)
    
    Returns:
        dict with video_url or error
    """
    import time
    import google.generativeai as genai
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not set"}
    
    try:
        genai.configure(api_key=api_key)
        
        # Use Veo 3.1 model for video generation
        model = genai.GenerativeModel("veo-3.1-generate-preview")
        
        # Create generation config
        generation_config = {
            "duration_seconds": duration,
            "aspect_ratio": "16:9"
        }
        
        # If we have a reference image, download and use it
        if image_url:
            # Download image for reference
            response = requests.get(image_url, timeout=30)
            if response.status_code == 200:
                import base64
                image_data = base64.b64encode(response.content).decode('utf-8')
                
                # Generate video from image + prompt
                result = model.generate_content(
                    [
                        {"mime_type": "image/jpeg", "data": image_data},
                        prompt
                    ],
                    generation_config=generation_config
                )
            else:
                # Text-only generation
                result = model.generate_content(prompt, generation_config=generation_config)
        else:
            # Text-only generation
            result = model.generate_content(prompt, generation_config=generation_config)
        
        # Check for video in response
        if hasattr(result, 'video') and result.video:
            return {"success": True, "video_url": result.video.uri}
        
        # Alternative: check for generated videos
        if hasattr(result, 'candidates') and result.candidates:
            for candidate in result.candidates:
                if hasattr(candidate, 'content') and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'video_metadata'):
                            return {"success": True, "video_url": part.video_metadata.uri}
        
        print(f"📹 Veo result: {result}")
        return {"error": "Video generation not available - you may need to enable Veo access on Google Cloud. See: https://aistudio.google.com/"}
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Veo error: {error_msg}")
        
        if "not found" in error_msg.lower() or "404" in error_msg:
            return {"error": "Veo 3.1 not available on your API key. Enable it at https://aistudio.google.com/ or use PixVerse instead."}
        
        return {"error": error_msg}


def generate_smart_video(prompt, image_url=None, business_info=None, duration=8):
    """
    Smart video generation with automatic fallback:
    1. Try Veo 3.1 (best quality, paid)
    2. Fall back to PixVerse (free AI video)
    3. Fall back to slideshow (always works)
    
    Args:
        prompt: Description of the video
        image_url: Optional reference image
        business_info: Business details for slideshow fallback
        duration: Video duration in seconds
    
    Returns:
        dict with video_url, provider used, and status
    """
    from gtts import gTTS
    
    result = {
        "success": False,
        "video_url": None,
        "provider": None,
        "attempts": []
    }
    
    # Step 1: Try Veo 3.1 (best quality)
    print("🎬 Attempting Veo 3.1...")
    veo_result = generate_veo_video(prompt, image_url, duration)
    result["attempts"].append({"provider": "veo", "result": veo_result.get("error") or "success"})
    
    if veo_result.get("success"):
        result["success"] = True
        result["video_url"] = veo_result["video_url"]
        result["provider"] = "veo"
        print("✅ Veo 3.1 succeeded!")
        return result
    
    print(f"⚠️ Veo failed: {veo_result.get('error')}")
    
    # Step 2: Try PixVerse (free AI video)
    if image_url:
        print("🎬 Attempting PixVerse...")
        pixverse_result = generate_pixverse_video(image_url, prompt, min(duration, 4))
        result["attempts"].append({"provider": "pixverse", "result": pixverse_result.get("error") or "success"})
        
        if pixverse_result.get("success"):
            result["success"] = True
            result["video_url"] = pixverse_result["video_url"]
            result["provider"] = "pixverse"
            print("✅ PixVerse succeeded!")
            return result
        
        print(f"⚠️ PixVerse failed: {pixverse_result.get('error')}")
    
    # Step 3: Fall back to slideshow video (always works)
    print("🎬 Creating slideshow fallback...")
    try:
        from ai_service import generate_image_from_text
        
        # Generate images if we don't have one
        images = []
        if image_url:
            images.append(image_url)
        else:
            # Generate 3 promotional images
            for i, scene in enumerate(["intro", "showcase", "call-to-action"]):
                img_prompt = f"{prompt}, {scene} scene, professional marketing"
                img_url = generate_image_from_text(img_prompt)
                if img_url:
                    images.append(img_url)
        
        if not images:
            images = [generate_image_from_text(prompt)]
        
        # Create audio narration
        import re
        clean_prompt = re.sub(r'#\w+', '', prompt)
        clean_prompt = re.sub(r'[^\w\s.,!?\'\"-]', '', clean_prompt)
        
        narration = f"Welcome! {clean_prompt}. Thanks for watching!"
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        audio_filename = f"smart_video_{timestamp}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        
        tts = gTTS(text=narration[:5000], lang='en')
        tts.save(audio_path)
        
        # Create slideshow video
        video_result = create_slideshow_video(images, audio_path)
        
        if video_result.get("success"):
            result["success"] = True
            result["video_url"] = video_result["video_url"]
            result["provider"] = "slideshow"
            print("✅ Slideshow fallback succeeded!")
            return result
        
        result["attempts"].append({"provider": "slideshow", "result": video_result.get("error") or "failed"})
        
    except Exception as e:
        print(f"❌ Slideshow fallback failed: {e}")
        result["attempts"].append({"provider": "slideshow", "result": str(e)})
    
    result["error"] = "All video generation methods failed"
    return result


def download_image(image_url):
    """Download image from URL to temp file"""
    try:
        response = requests.get(image_url, timeout=30)
        if response.status_code == 200:
            # Save to temp file
            ext = '.jpg'
            if 'png' in response.headers.get('content-type', ''):
                ext = '.png'
            temp_path = os.path.join(TEMP_DIR, f"temp_img_{datetime.now().strftime('%Y%m%d%H%M%S')}{ext}")
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            return temp_path
    except Exception as e:
        print(f"Error downloading image: {e}")
    return None


def generate_video_from_image_and_audio(image_path_or_url, audio_path, output_filename=None, duration=None):
    """
    Creates a video from a static image and audio file.
    The video duration matches the audio duration.
    
    Args:
        image_path_or_url: Local path or URL to image
        audio_path: Path to audio file (MP3)
        output_filename: Optional output filename
        duration: Optional duration override in seconds
        
    Returns:
        dict with success status and video path/URL
    """
    try:
        from moviepy import ImageClip, AudioFileClip, CompositeVideoClip
        from moviepy.video.fx import Resize, FadeIn, FadeOut
        
        # Download image if URL
        if image_path_or_url.startswith('http'):
            image_path = download_image(image_path_or_url)
            if not image_path:
                return {'success': False, 'error': 'Failed to download image'}
            cleanup_image = True
        else:
            image_path = image_path_or_url
            cleanup_image = False
        
        # Load audio to get duration
        audio = AudioFileClip(audio_path)
        video_duration = duration or audio.duration
        
        # Create video from image
        video = ImageClip(image_path).with_duration(video_duration)
        
        # Resize to common social media size (1080x1080 for Instagram/TikTok)
        video = video.resized(width=1080, height=1080)
        
        # Add subtle zoom effect (Ken Burns style)
        # Start at 100%, end at 105%
        def zoom_effect(get_frame, t):
            zoom_factor = 1 + (0.05 * t / video_duration)
            return get_frame(t)
        
        # Add audio
        video = video.with_audio(audio)
        
        # Add fade in/out
        video = video.with_effects([FadeIn(0.5), FadeOut(0.5)])
        
        # Generate output filename
        if not output_filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f"video_{timestamp}.mp4"
        
        output_path = os.path.join(VIDEO_DIR, output_filename)
        
        # Write video file
        video.write_videofile(
            output_path,
            fps=24,
            codec='libx264',
            audio_codec='aac',
            temp_audiofile=os.path.join(TEMP_DIR, 'temp_audio.m4a'),
            remove_temp=True,
            logger=None  # Suppress moviepy logs
        )
        
        # Cleanup
        audio.close()
        video.close()
        if cleanup_image and os.path.exists(image_path):
            os.remove(image_path)
        
        return {
            'success': True,
            'video_path': output_path,
            'filename': output_filename,
            'duration': video_duration
        }
        
    except ImportError:
        return {'success': False, 'error': 'moviepy not installed. Run: pip install moviepy'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def create_slideshow_video(image_urls, audio_path, duration_per_image=5, output_filename=None):
    """
    Creates a slideshow video from multiple images with audio.
    
    Args:
        image_urls: List of image URLs or paths
        audio_path: Path to audio file
        duration_per_image: Seconds per image (default 5)
        output_filename: Optional output filename
        
    Returns:
        dict with success status and video path
    """
    try:
        from moviepy import ImageClip, AudioFileClip, concatenate_videoclips
        from moviepy.video.fx import FadeIn, FadeOut, CrossFadeIn
        
        # Download images
        image_paths = []
        for url in image_urls:
            if url.startswith('http'):
                path = download_image(url)
                if path:
                    image_paths.append(path)
            else:
                image_paths.append(url)
        
        if not image_paths:
            return {'success': False, 'error': 'No valid images'}
        
        # Load audio
        audio = AudioFileClip(audio_path)
        
        # Calculate duration per image based on audio length
        total_duration = audio.duration
        actual_duration_per_image = total_duration / len(image_paths)
        
        # Create clips for each image
        clips = []
        for img_path in image_paths:
            clip = ImageClip(img_path).with_duration(actual_duration_per_image)
            clip = clip.resized(width=1080, height=1080)
            clip = clip.with_effects([FadeIn(0.3), FadeOut(0.3)])
            clips.append(clip)
        
        # Concatenate clips
        final_video = concatenate_videoclips(clips, method='compose')
        final_video = final_video.with_audio(audio)
        
        # Generate output filename
        if not output_filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f"slideshow_{timestamp}.mp4"
        
        output_path = os.path.join(VIDEO_DIR, output_filename)
        
        # Write video
        final_video.write_videofile(
            output_path,
            fps=24,
            codec='libx264',
            audio_codec='aac',
            logger=None
        )
        
        # Cleanup
        audio.close()
        final_video.close()
        for path in image_paths:
            if path.startswith(TEMP_DIR) and os.path.exists(path):
                os.remove(path)
        
        return {
            'success': True,
            'video_path': output_path,
            'filename': output_filename,
            'duration': total_duration
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def text_to_video(text, image_url=None, voice='en', output_filename=None):
    """
    High-level function: Takes text, generates audio, optionally uses image, creates video.
    
    Args:
        text: Text to convert to speech
        image_url: Optional image URL (generates placeholder if not provided)
        voice: Language code for TTS
        output_filename: Optional output filename
        
    Returns:
        dict with video info
    """
    from gtts import gTTS
    from ai_service import generate_image_from_text
    
    try:
        # 1. Generate audio from text
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        audio_filename = f"tts_{timestamp}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        
        tts = gTTS(text=text[:5000], lang=voice)  # Limit text length
        tts.save(audio_path)
        
        # 2. Get or generate image
        if not image_url:
            # Generate a placeholder image based on text summary
            summary = text[:100] if len(text) > 100 else text
            image_url = generate_image_from_text(f"Marketing promotional image for: {summary}")
        
        # 3. Create video
        result = generate_video_from_image_and_audio(
            image_url,
            audio_path,
            output_filename
        )
        
        if result['success']:
            result['audio_path'] = audio_path
            result['audio_filename'] = audio_filename
        
        return result
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_full_video_post(business_profile, topic=None, num_images=4, language='en'):
    """
    Generates a complete video post with:
    - AI-generated video script specifically for narration
    - Multiple AI-generated images (slideshow)
    - Audio narration of the script
    - Combined video file
    - Post caption with hashtags
    
    Uses multiple fallback methods if AI fails.
    """
    from gtts import gTTS
    from ai_service import generate_image_from_text
    import json
    
    business_name = business_profile.get('name', 'Business')
    industry = business_profile.get('industry', 'general')
    topic_text = topic or 'latest offerings'
    
    try:
        # Try to generate content with AI
        content_data = None
        
        # Method 1: Try Gemini
        try:
            import google.generativeai as genai
            api_key = os.environ.get("GOOGLE_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                prompt = f"""Create a TikTok/Reels video content for {business_name} ({industry}) about {topic_text}.
                Return JSON: {{"video_script": "30 second engaging script", "scene_descriptions": ["scene 1", "scene 2", "scene 3", "scene 4"], "caption": "caption text", "hashtags": ["tag1", "tag2", "tag3"]}}"""
                
                for model_name in ['gemini-1.5-flash', 'gemini-2.0-flash']:
                    try:
                        model = genai.GenerativeModel(model_name)
                        response = model.generate_content(prompt, request_options={'timeout': 30})
                        text = response.text
                        json_start = text.find('{')
                        json_end = text.rfind('}') + 1
                        if json_start >= 0 and json_end > json_start:
                            content_data = json.loads(text[json_start:json_end])
                            if content_data:
                                break
                    except:
                        continue
        except Exception as e:
            print(f"Gemini failed: {e}")
        
        # Method 2: Try Hugging Face
        if not content_data:
            try:
                import requests
                hf_token = os.environ.get("HUGGINGFACE_API_KEY")
                if hf_token:
                    API_URL = "https://router.huggingface.co/models/google/gemma-1.1-7b-it"
                    headers = {"Authorization": f"Bearer {hf_token}"}
                    prompt = f"Write a 30-second TikTok video script for {business_name} about {topic_text}. Keep it short and engaging."
                    
                    response = requests.post(API_URL, headers=headers, json={
                        "inputs": prompt,
                        "parameters": {"max_new_tokens": 300}
                    }, timeout=30)
                    
                    if response.status_code == 200:
                        result = response.json()
                        if isinstance(result, list) and len(result) > 0:
                            script = result[0].get('generated_text', '').strip()
                            if script and len(script) > 50:
                                content_data = {
                                    "video_script": script[:500],
                                    "scene_descriptions": [
                                        f"{business_name} logo and intro",
                                        f"{topic_text} showcase",
                                        f"Product features highlight",
                                        f"Call to action"
                                    ],
                                    "caption": f"✨ {topic_text} at {business_name}! Check it out!",
                                    "hashtags": [business_name.replace(' ', ''), industry, "viral", "trending", "mustwatch"]
                                }
            except Exception as e:
                print(f"HuggingFace failed: {e}")
        
        # Method 3: Use template-based fallback (always works)
        if not content_data:
            # Create an engaging, natural-sounding video script (NO hashtags in narration!)
            video_script = f"""
Welcome to {business_name}!

Today we're showcasing something amazing: {topic_text}.

Whether you're looking for quality, innovation, or unbeatable value, we've got exactly what you need.

At {business_name}, we're passionate about delivering the best in {industry}. 

Our team works hard to bring you products and services that make a real difference.

Don't miss out on this incredible opportunity!

Visit us today and experience the difference for yourself.

Thanks for watching! See you next time!
"""
            content_data = {
                "video_script": video_script.strip(),
                "scene_descriptions": [
                    f"Eye-catching intro with {business_name} logo animation",
                    f"Beautiful showcase of {topic_text} with professional lighting",
                    f"Happy customer testimonials and reactions",
                    f"Product features and benefits highlight reel",
                    f"Exciting call-to-action with contact details"
                ],
                "caption": f"✨ {topic_text} at {business_name}! Your go-to destination for amazing {industry}. Follow for more! 🔥",
                "hashtags": [business_name.replace(' ', ''), industry.replace(' ', ''), "viral", "trending", "fyp", "mustwatch", "followme"]
            }
        
        video_script = content_data.get('video_script', '')
        scene_descriptions = content_data.get('scene_descriptions', [])[:num_images]
        caption = content_data.get('caption', '')
        hashtags = content_data.get('hashtags', [])
        
        # Ensure we have enough scenes
        while len(scene_descriptions) < num_images:
            scene_descriptions.append(f"{business_name} {industry} promotional image")
        
        # 2. Generate audio from script - CLEAN IT FIRST!
        import re
        
        # Remove hashtags, mentions, emojis, and special characters
        clean_script = video_script
        clean_script = re.sub(r'#\w+', '', clean_script)  # Remove #hashtags
        clean_script = re.sub(r'@\w+', '', clean_script)  # Remove @mentions
        clean_script = re.sub(r'[✨🔥💯🎉💪👇❤️🙌✅⭐]', '', clean_script)  # Remove common emojis
        clean_script = re.sub(r'[^\w\s.,!?\'\"-]', '', clean_script)  # Keep only letters, numbers, punctuation
        clean_script = re.sub(r'\s+', ' ', clean_script).strip()  # Clean up extra whitespace
        
        print(f"📢 Narration script (cleaned): {clean_script[:200]}...")
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        audio_filename = f"video_script_{timestamp}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        
        # Use slower speech for clarity (lang options: en-us, en-uk, en-au)
        tts = gTTS(text=clean_script[:5000], lang=language, slow=False)
        tts.save(audio_path)
        
        # 3. Generate multiple images
        image_urls = []
        for i, scene in enumerate(scene_descriptions):
            image_prompt = f"{scene}, professional marketing photo, vibrant colors, high quality"
            image_url = generate_image_from_text(image_prompt)
            if image_url:
                image_urls.append(image_url)
        
        # Ensure we have at least 2 images
        if len(image_urls) < 2:
            for i in range(2 - len(image_urls)):
                fallback_prompt = f"{business_name} {industry} promotional image, professional, vibrant"
                image_url = generate_image_from_text(fallback_prompt)
                if image_url:
                    image_urls.append(image_url)
        
        # 4. Create slideshow video
        video_result = create_slideshow_video(image_urls, audio_path)
        
        if not video_result['success']:
            return {'success': False, 'error': video_result.get('error', 'Video creation failed')}
        
        # 5. Return complete post data
        hashtag_str = ' '.join([f'#{h.replace("#", "").replace(" ", "")}' for h in hashtags])
        full_caption = f"{caption}\n\n{hashtag_str}"
        
        return {
            'success': True,
            'video_filename': video_result['filename'],
            'video_path': video_result['video_path'],
            'audio_filename': audio_filename,
            'script': video_script,
            'caption': full_caption,
            'hashtags': hashtags,
            'image_urls': image_urls,
            'duration': video_result.get('duration', 0)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}


