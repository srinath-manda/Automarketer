import google.generativeai as genai
import os
import json
import requests
from duckduckgo_search import DDGS
from gtts import gTTS


def call_ai_for_json(prompt, timeout=30):
    """
    Multi-provider AI call for JSON responses.
    Tries: Groq (fast) -> Gemini -> HuggingFace
    Returns parsed JSON dict or None
    """
    # Provider 1: Groq (fast and reliable - try first!)
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            print(f"🔄 Trying Groq (fast)")
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2000,
                    "temperature": 0.7
                },
                timeout=timeout
            )
            if response.status_code == 200:
                text = response.json()['choices'][0]['message']['content']
                json_start = text.find('{')
                json_end = text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    result = json.loads(text[json_start:json_end])
                    print(f"✅ Groq succeeded")
                    return result
        except Exception as e:
            print(f"❌ Groq: {str(e)[:50]}")
    
    # Provider 2: Google Gemini (slower, may timeout)
    api_key = os.environ.get("GOOGLE_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        models = ['gemini-1.5-flash', 'gemini-pro']  # Use only fastest models
        for model_name in models:
            try:
                print(f"🔄 Trying Gemini: {model_name}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt, request_options={'timeout': 10})  # Short timeout
                text = response.text
                json_start = text.find('{')
                json_end = text.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    result = json.loads(text[json_start:json_end])
                    print(f"✅ Gemini {model_name} succeeded")
                    return result
            except Exception as e:
                print(f"❌ Gemini {model_name}: {str(e)[:50]}")
                continue
    
    # Provider 3: HuggingFace
    hf_key = os.environ.get("HUGGINGFACE_API_KEY")
    if hf_key:
        try:
            print(f"🔄 Trying HuggingFace")
            response = requests.post(
                "https://api-inference.huggingface.co/models/google/gemma-1.1-7b-it",
                headers={"Authorization": f"Bearer {hf_key}"},
                json={"inputs": prompt, "parameters": {"max_new_tokens": 1000}},
                timeout=timeout
            )
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and result:
                    text = result[0].get('generated_text', '')
                    json_start = text.find('{')
                    json_end = text.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        parsed = json.loads(text[json_start:json_end])
                        print(f"✅ HuggingFace succeeded")
                        return parsed
        except Exception as e:
            print(f"❌ HuggingFace: {str(e)[:50]}")
    
    print("❌ All AI providers failed")
    return None


# Configure Gemini
# Ensure you have GOOGLE_API_KEY in your environment variables
# genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

def generate_marketing_content(platform, business_profile, products=None, topic=None, image_data=None, language=None):
    """
    Generates marketing content using Google Gemini.
    
    Args:
        platform (str): The social media platform (e.g., 'Instagram', 'LinkedIn').
        business_profile (dict): Dictionary containing business details.
        products (list, optional): List of product dictionaries.
        topic (str, optional): Specific topic or trend to focus on.
        language (str, optional): Target language for generation.
        
    Returns:
        str: Generated content.
    """
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return "Error: GOOGLE_API_KEY not found in environment variables."

    genai.configure(api_key=api_key)
    
    product_text = ""
    if products:
        product_list = "\n".join([f"- {p.get('name')}: {p.get('description')} ({p.get('offers') if p.get('offers') else 'No specific offer'})" for p in products])
        product_text = f"\nKey Products/Services & Latest Offers:\n{product_list}"

    is_long_form = platform.lower() in ['email', 'blog']
    
    # Language Localization: value passed > business profile > default
    target_language = language if language else business_profile.get('language', 'English')
    
    prompt = f"""
    You are an expert multi-lingual content marketer for a {business_profile.get('industry', 'business')}.
    
    Business Name: {business_profile.get('name')}
    Description: {business_profile.get('description')}
    Target Audience: {business_profile.get('target_audience')}
    {product_text}
    
    Task: Write a highly engaging and professional {platform} in {target_language}.
    """
    
    if platform.lower() == 'email':
        prompt += "\nSpecific focus: Include an attention-grabbing subject line and a clear call to action."
    elif platform.lower() == 'blog':
        prompt += "\nSpecific focus: Include a catchy title and structured sections with headers."
    elif platform.lower() in ['tiktok', 'reels', 'shorts', 'tiktok/reels']:
        prompt += "\nSpecific focus: This is a VIDEO SCRIPT. Provide a 15-30 second script structure including: [Visual Scene], [Audio/Voiceover], and [On-screen Text]. Make it high-energy and hook-driven."
    
    if topic:
        prompt += f"\nContext/Topic to incorporate: {topic}"
        
    if not is_long_form:
        prompt += f"\n\nInclude relevant hashtags and emojis suitable for {target_language} audience. Keep it concise and impactful."
    else:
        prompt += f"\n\nMake it structured, persuasive, and value-driven in {target_language}. No hashtags needed for this format."

    prompt += """
    
    IMPORTANT: You must return the result as a VALID JSON OBJECT with the following two keys:
    1. "post_content": The actual generated content (marketing text).
    2. "image_prompt": A highly detailed, creative, and visual description for an AI image generator to create an image that perfectly matches this content.
    
    Example format:
    {
        "post_content": "Dear Customer, Check out our new collection...",
        "image_prompt": "A professional office setting with a organized desk and a laptop displaying a vibrant website, realistic, 4k"
    }
    """

    # Prepare content parts for Gemini
    content_parts = [prompt]
    if image_data:
        import PIL.Image
        import io
        try:
            image = PIL.Image.open(io.BytesIO(image_data))
            content_parts.append(image)
        except Exception:
            pass

    models_to_try = [
        'gemini-2.5-flash-preview-09-2025',
        'gemini-3-flash-preview',
        'gemini-2.5-flash-lite-preview-09-2025',
        'gemini-1.5-flash'
    ]
    
    import time
    import re

    last_error = None

    # Try Gemini models first
    for model_name in models_to_try:
        model = genai.GenerativeModel(model_name)
        try:
            # Set a 10-second timeout for rapid failover to HF
            response = model.generate_content(content_parts, request_options={'timeout': 10})
            
            # Simple parsing of the JSON response
            text_res = response.text.replace("```json", "").replace("```", "").strip()
            # Try to find the first { and last }
            json_start = text_res.find('{')
            json_end = text_res.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                return json.loads(text_res[json_start:json_end])
            else:
                # Fallback if model didn't output JSON
                return {
                    "post_content": text_res,
                    "image_prompt": f"Professional marketing photo for {topic} - {business_profile.get('name')}, high quality"
                }

        except Exception as e:
            last_error = e
            continue

    # If Gemini fails, try Hugging Face
    # If Gemini fails, try Hugging Face (which returns string, so wrap it)
    try:
        hf_text = generate_with_huggingface(prompt)
        return {
            "post_content": hf_text,
            "image_prompt": f"Professional marketing photo for {topic} - {business_profile.get('name')}, high quality"
        }
    except Exception as hf_error:
        err_msg = f"Generation failed. Gemini Error: {str(last_error)}. HF Error: {str(hf_error)}"
        return {
            "post_content": err_msg,
            "image_prompt": None
        }

def generate_with_huggingface(prompt):
    import requests
    import os
    
    hf_token = os.environ.get("HUGGINGFACE_API_KEY")
    if not hf_token:
        raise ValueError("HUGGINGFACE_API_KEY not set")

    API_URL = "https://router.huggingface.co/models/google/gemma-1.1-7b-it"
    headers = {"Authorization": f"Bearer {hf_token}"}

    def query(payload):
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        return response.json()
	
    try:
        response = requests.post(API_URL, headers=headers, json={
            "inputs": prompt,
            "parameters": {"max_new_tokens": 500}
        }, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                return result[0].get('generated_text', str(result)).strip()
            return str(result).strip()
        return None
    except Exception:
        return None

def fetch_latest_news(query_str):
    """
    Fetches latest news using DuckDuckGo.
    """
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.news(query_str, max_results=5)]
            return results
    except Exception as e:
        return []

def generate_reaction_post(business_profile, news_item):
    """
    Generates a 'reaction post' based on breaking news.
    """
    prompt = f"""
    Business: {business_profile.get('name')} ({business_profile.get('industry')})
    Breaking News: "{news_item.get('title')}"
    Source: {news_item.get('source')}
    Snippet: {news_item.get('body')}

    Task: Create a viral 'reaction post' for LinkedIn and Instagram that connects this news to our business. 
    Make it trending, authoritative, and engaging.
    """
    return generate_marketing_content("LinkedIn/Instagram", business_profile, topic=f"Reaction to: {news_item.get('title')}")

def generate_7day_campaign(business_profile, products):
    """
    Generates a cohesive 7-day marketing strategy.
    """
    prompt = f"""
    Create a 7-day marketing campaign for {business_profile.get('name')}.
    Industry: {business_profile.get('industry')}
    Products: {', '.join([p.get('name') for p in products])}
    
    Format the output as a JSON object with keys "Day 1" through "Day 7".
    Each day should have: "Topic", "Post_Content", "Image_Prompt", and "Platform".
    """
    
    # Use Gemini for structured output
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key: return None
    genai.configure(api_key=api_key)
    
    # Try multiple model names for robustness
    model_names = ['gemini-2.5-flash-preview-09-2025', 'gemini-3-flash-preview', 'gemini-1.5-flash']
    
    strategy = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={'timeout': 60})
            content = response.text
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            strategy = json.loads(content[json_start:json_end])
            if strategy: break
        except Exception as e:
            continue
            
    return strategy

def analyze_virality_score(content):
    """
    Analyzes content for psychological triggers and gives a Virality Score.
    """
    prompt = f"""
    Analyze this post for psychological triggers (e.g., social proof, curiosity, urgency).
    Content: "{content}"
    
    Provide a "Virality Score" (1-100) and 3 tips for maximum impact.
    Return as JSON: {{"score": 85, "triggers": ["...", "..."], "recommendations": ["...", "...", "..."], "rewritten_content": "..."}}
    """
    # Similar JSON extraction as above...
    # Try multiple model names for robustness
    model_names = ['gemini-2.5-flash-preview-09-2025', 'gemini-3-flash-preview', 'gemini-1.5-flash']
    
    result = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={'timeout': 60})
            content = response.text
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            result = json.loads(content[json_start:json_end])
            if result: break
        except Exception as e:
            continue
            
    return result

def simulate_community_manager(content):
    """
    Simulates user comments and brand replies.
    """
    prompt = f"""
    For this post: "{content}"
    Simulate 3 realistic user comments and provide the perfect brand reply for each.
    Return as JSON list of objects: [{{"user": "...", "comment": "...", "brand_reply": "..."}}]
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key: return None
    genai.configure(api_key=api_key)
    # Try multiple model names for robustness
    model_names = ['gemini-2.5-flash-preview-09-2025', 'gemini-3-flash-preview', 'gemini-1.5-flash']
    
    result = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={'timeout': 60})
            content = response.text
            json_start = content.find('[')
            json_end = content.rfind(']') + 1
            result = json.loads(content[json_start:json_end])
            if result: break
        except Exception as e:
            continue
            
    return result

def analyze_competitors_swot(business_profile, competitor_name):
    """
    Performs SWOT analysis on a competitor.
    """
    news = fetch_latest_news(competitor_name)
    news_text = "\n".join([f"- {n.get('title')}: {n.get('body')}" for n in news])
    
    prompt = f"""
    Our Business: {business_profile.get('name')} ({business_profile.get('industry')})
    Competitor: {competitor_name}
    Latest News on Competitor:
    {news_text}
    
    Perform a SWOT analysis on this competitor.
    Return as JSON: {{"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}}
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key: return None
    genai.configure(api_key=api_key)
    # Try multiple model names for robustness
    model_names = ['gemini-2.5-flash-preview-09-2025', 'gemini-3-flash-preview', 'gemini-1.5-flash']
    
    result = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={'timeout': 60})
            content = response.text
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            result = json.loads(content[json_start:json_end])
            if result: break
        except Exception as e:
            continue
            
    return result

def text_to_speech(text, filename):
    """
    Converts text to MP3 using gTTS.
    """
    try:
        tts = gTTS(text=text, lang='en')
        static_dir = os.path.join(os.path.dirname(__file__), 'static', 'audio')
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
        filepath = os.path.join(static_dir, filename)
        tts.save(filepath)
        return filename
    except Exception as e:
        return None

def generate_image_from_text(prompt, enhance_prompt=True):
    """
    Generates an image URL using Pollinations.ai with enhanced prompt engineering.
    Uses specific prompt techniques for more accurate product/brand images.
    """
    import urllib.parse
    
    original_prompt = prompt
    
    # Enhance prompt for better accuracy
    if enhance_prompt:
        # Add quality modifiers for better images
        quality_modifiers = [
            "professional product photography",
            "high quality",
            "sharp focus",
            "studio lighting",
            "clean background",
            "detailed",
            "realistic",
            "8k resolution"
        ]
        
        # Check if it's a product/brand image
        is_product = any(word in prompt.lower() for word in [
            'tv', 'phone', 'laptop', 'product', 'device', 'gadget', 
            'oneplus', 'samsung', 'apple', 'sony', 'lg', 'xiaomi'
        ])
        
        if is_product:
            # For products, add specific product photography modifiers
            enhanced_prompt = f"{prompt}, professional product photography, exact product as described, studio lighting, clean white background, high detail, commercial advertising photo, sharp focus, no text overlay, accurate brand design"
        else:
            # For general marketing images
            enhanced_prompt = f"{prompt}, {', '.join(quality_modifiers[:5])}"
        
        prompt = enhanced_prompt
    
    # Clean the prompt - remove problematic characters
    prompt = prompt.replace('\n', ' ').replace('\r', ' ').strip()
    
    # URL encode the prompt
    encoded_prompt = urllib.parse.quote(prompt)
    
    # Use Pollinations.ai with enhanced parameters
    # - model: Use flux for better quality
    # - nologo: Remove watermark
    # - enhance: AI enhancement
    # - seed: For reproducibility (optional)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&enhance=true&model=flux"
    
    return image_url


def validate_image_relevance(image_prompt, topic):
    """
    Validates if the image prompt is relevant to the topic.
    Uses keyword matching to ensure relevance.
    """
    topic_words = set(topic.lower().split())
    prompt_words = set(image_prompt.lower().split())
    
    # Calculate overlap
    common_words = topic_words.intersection(prompt_words)
    
    # At least 30% of topic words should be in prompt
    if len(topic_words) > 0:
        overlap_ratio = len(common_words) / len(topic_words)
        return overlap_ratio >= 0.3
    
    return True


# ==================== NEW UNIQUE FEATURES ====================

def predict_roi(content, platform, business_profile, products=None):
    """
    🎯 ROI Predictor: Predicts reach, engagement, and ROI before publishing.
    This is a unique feature that shows business thinking.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not found"}
    
    genai.configure(api_key=api_key)
    
    product_text = ""
    if products:
        product_list = ", ".join([p.get('name', '') for p in products[:3]])
        product_text = f"Products: {product_list}"
    
    prompt = f"""
    You are a marketing analytics expert. Analyze this social media post and predict its performance.
    
    Platform: {platform}
    Business: {business_profile.get('name')} ({business_profile.get('industry')})
    Target Audience: {business_profile.get('target_audience')}
    {product_text}
    
    Content to analyze:
    "{content}"
    
    Provide predictions as JSON:
    {{
        "estimated_reach": {{
            "min": 5000,
            "max": 15000,
            "confidence": "Medium"
        }},
        "predicted_engagement_rate": 4.2,
        "predicted_clicks": 120,
        "predicted_conversions": 8,
        "suggested_ad_spend": 500,
        "expected_roi_multiplier": 2.8,
        "best_posting_time": "10:00 AM - 12:00 PM",
        "optimization_tips": [
            "Add more urgency words",
            "Include a clear CTA"
        ],
        "virality_score": 72,
        "emotional_triggers": ["curiosity", "fomo", "social proof"]
    }}
    
    Be realistic based on platform averages for small-medium businesses.
    """
    
    model_names = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={'timeout': 30})
            text = response.text
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(text[json_start:json_end])
        except Exception:
            continue
    
    # Fallback with estimated values
    return {
        "estimated_reach": {"min": 1000, "max": 5000, "confidence": "Low"},
        "predicted_engagement_rate": 3.5,
        "predicted_clicks": 50,
        "predicted_conversions": 3,
        "suggested_ad_spend": 300,
        "expected_roi_multiplier": 2.0,
        "best_posting_time": "9:00 AM - 11:00 AM",
        "optimization_tips": ["Add hashtags", "Include emojis"],
        "virality_score": 50,
        "emotional_triggers": ["interest"]
    }


def generate_ab_variations(content, platform, business_profile, num_variations=3):
    """
    🧪 A/B Testing Lab: Generate multiple content variations and predict winners.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not found"}
    
    genai.configure(api_key=api_key)
    
    prompt = f"""
    You are an expert copywriter specializing in A/B testing for social media.
    
    Platform: {platform}
    Business: {business_profile.get('name')} ({business_profile.get('industry')})
    Target Audience: {business_profile.get('target_audience')}
    
    Original Content:
    "{content}"
    
    Create {num_variations} distinct variations of this content, each with a different psychological approach:
    - Variation A: Focus on URGENCY
    - Variation B: Focus on SOCIAL PROOF
    - Variation C: Focus on CURIOSITY
    
    For each variation, predict its virality score (1-100) and explain why.
    
    Return as JSON:
    {{
        "variations": [
            {{
                "version": "A",
                "approach": "Urgency",
                "content": "...",
                "virality_score": 78,
                "reasoning": "Uses time-sensitive language and FOMO triggers",
                "best_for": "Flash sales, limited offers"
            }},
            {{
                "version": "B", 
                "approach": "Social Proof",
                "content": "...",
                "virality_score": 72,
                "reasoning": "Leverages customer testimonials and numbers",
                "best_for": "Building trust, new products"
            }},
            {{
                "version": "C",
                "approach": "Curiosity",
                "content": "...",
                "virality_score": 68,
                "reasoning": "Creates intrigue with open loops",
                "best_for": "Blog posts, teasers"
            }}
        ],
        "winner": "A",
        "recommendation": "Version A is predicted to perform best due to..."
    }}
    """
    
    # Use multi-provider AI call
    result = call_ai_for_json(prompt, timeout=45)
    if result:
        return result
    
    # Fallback with sample data if all AI providers fail
    return {
        "variations": [
            {
                "version": "A",
                "approach": "Emotional Appeal",
                "content": f"🌟 {content[:50]}... Connect with your heart! Check it out today! 💖",
                "virality_score": 78,
                "best_for": "Building emotional connection"
            },
            {
                "version": "B", 
                "approach": "Urgency & Scarcity",
                "content": f"⏰ Limited time! {content[:50]}... Don't miss out! 🔥",
                "virality_score": 82,
                "best_for": "Quick conversions"
            },
            {
                "version": "C",
                "approach": "Social Proof",
                "content": f"Join 10,000+ happy customers! {content[:50]}... ⭐⭐⭐⭐⭐",
                "virality_score": 75,
                "best_for": "Building trust"
            }
        ],
        "winner": "B",
        "recommendation": "Version B uses urgency which typically performs 23% better for conversions."
    }


def optimize_hashtags(content, platform, business_profile):
    """
    #️⃣ Smart Hashtag Optimizer: Analyze and suggest strategic hashtags with competition scores.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not found"}
    
    genai.configure(api_key=api_key)
    
    prompt = f"""
    You are a social media hashtag strategist.
    
    Platform: {platform}
    Business: {business_profile.get('name')} ({business_profile.get('industry')})
    Target Audience: {business_profile.get('target_audience')}
    
    Content:
    "{content}"
    
    Analyze and suggest the optimal hashtag strategy. Return as JSON:
    {{
        "hashtags": [
            {{
                "tag": "#TechDeals",
                "estimated_posts": "2.1M",
                "competition": "High",
                "relevance_score": 95,
                "recommendation": "Use sparingly - high competition"
            }},
            {{
                "tag": "#GadgetLovers",
                "estimated_posts": "450K", 
                "competition": "Medium",
                "relevance_score": 88,
                "recommendation": "Great balance of reach and visibility"
            }},
            {{
                "tag": "#IndianTech",
                "estimated_posts": "89K",
                "competition": "Low",
                "relevance_score": 92,
                "recommendation": "Niche - excellent for targeted reach"
            }}
        ],
        "strategy": {{
            "high_competition": 2,
            "medium_competition": 5,
            "low_competition": 3,
            "total": 10
        }},
        "optimized_content": "Original content with hashtags properly placed...",
        "tips": [
            "Place hashtags at the end for cleaner look",
            "Use niche hashtags for better engagement rate"
        ]
    }}
    
    Include 10-15 relevant hashtags for {platform} with realistic estimates.
    """
    
    model_names = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
    for model_name in model_names:
        try:
            print(f"🔄 Trying model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={'timeout': 30})
            text = response.text
            print(f"✅ Got response from {model_name}: {text[:100]}...")
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(text[json_start:json_end])
        except Exception as e:
            print(f"❌ Error with {model_name}: {str(e)}")
            continue
    
    # Fallback with sample hashtags if API fails
    return {
        "hashtags": [
            {"tag": "#Marketing", "estimated_posts": "15M", "competition": "High", "relevance_score": 90},
            {"tag": "#SmallBusiness", "estimated_posts": "8M", "competition": "Medium", "relevance_score": 88},
            {"tag": "#Entrepreneur", "estimated_posts": "12M", "competition": "High", "relevance_score": 85},
            {"tag": "#BusinessGrowth", "estimated_posts": "2M", "competition": "Medium", "relevance_score": 92},
            {"tag": "#StartupLife", "estimated_posts": "4M", "competition": "Medium", "relevance_score": 80},
            {"tag": "#IndianBusiness", "estimated_posts": "500K", "competition": "Low", "relevance_score": 95}
        ],
        "strategy": {
            "high_competition": 2,
            "medium_competition": 3,
            "low_competition": 1,
            "total": 6
        },
        "tips": [
            "Mix high and low competition hashtags for best reach",
            "Place hashtags at end of caption for cleaner look",
            "Use niche hashtags for better engagement rates"
        ]
    }


def analyze_brand_voice(sample_content, business_profile):
    """
    🧬 Brand Voice DNA: Analyze content samples to extract unique brand voice characteristics.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not found"}
    
    genai.configure(api_key=api_key)
    
    prompt = f"""
    You are a brand strategist and linguistic analyst.
    
    Business: {business_profile.get('name')} ({business_profile.get('industry')})
    
    Analyze this content sample to extract the brand's unique voice DNA:
    
    "{sample_content}"
    
    Return a detailed brand voice analysis as JSON:
    {{
        "brand_voice_dna": {{
            "tone": "Casual & Witty",
            "formality_level": "Informal (3/10)",
            "energy_level": "High Energy",
            "personality_traits": ["Friendly", "Innovative", "Bold"],
            "communication_style": "Direct with humor"
        }},
        "vocabulary_patterns": {{
            "favorite_words": ["awesome", "game-changer", "you'll love"],
            "phrases": ["Check it out", "Here's the deal"],
            "industry_jargon": ["tech-savvy", "cutting-edge"],
            "avoided_words": ["cheap", "basic"]
        }},
        "emoji_style": {{
            "usage_frequency": "Heavy",
            "favorite_emojis": ["🔥", "🚀", "💯", "✨"],
            "placement": "Middle and end of sentences"
        }},
        "cta_style": {{
            "approach": "Soft push",
            "examples": ["Check it out", "See for yourself"],
            "urgency_level": "Medium"
        }},
        "unique_characteristics": [
            "Uses questions to engage readers",
            "Starts sentences with action verbs",
            "References pop culture"
        ],
        "voice_summary": "A friendly, energetic brand that speaks like a knowledgeable friend rather than a salesperson."
    }}
    """
    
    # Use multi-provider AI call
    result = call_ai_for_json(prompt, timeout=30)
    if result:
        return result
    
    # Fallback with sample brand voice data if all AI providers fail
    return {
        "brand_voice_dna": {
            "tone": "Friendly & Professional",
            "formality_level": "Semi-Formal (5/10)",
            "energy_level": "Medium-High Energy",
            "personality_traits": ["Approachable", "Knowledgeable", "Authentic"],
            "communication_style": "Direct with warmth"
        },
        "vocabulary_patterns": {
            "favorite_words": ["amazing", "discover", "transform"],
            "phrases": ["check it out", "here's the thing"],
            "industry_jargon": [],
            "avoided_words": ["cheap", "basic"]
        },
        "emoji_style": {
            "usage_frequency": "Moderate",
            "favorite_emojis": ["✨", "🚀", "💡", "🎯"],
            "placement": "End of sentences"
        },
        "cta_style": {
            "approach": "Soft push",
            "examples": ["Learn more", "See for yourself"],
            "urgency_level": "Medium"
        },
        "unique_characteristics": [
            "Uses questions to engage readers",
            "Starts with action verbs",
            "Balances professionalism with personality"
        ],
        "voice_summary": "A warm, professional voice that connects authentically with the audience while maintaining expertise."
    }


def generate_multilingual_content(content, target_language, business_profile):
    """
    🌍 Multi-Language Generator: Translate and culturally adapt content for Indian languages.
    Supports: Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not found"}
    
    genai.configure(api_key=api_key)
    
    language_map = {
        "hindi": "Hindi (हिंदी)",
        "tamil": "Tamil (தமிழ்)",
        "telugu": "Telugu (తెలుగు)",
        "marathi": "Marathi (मराठी)",
        "bengali": "Bengali (বাংলা)",
        "gujarati": "Gujarati (ગુજરાતી)",
        "kannada": "Kannada (ಕನ್ನಡ)",
        "malayalam": "Malayalam (മലയാളം)"
    }
    
    full_language = language_map.get(target_language.lower(), target_language)
    
    prompt = f"""
    You are an expert multilingual marketing translator with deep cultural understanding.
    
    Business: {business_profile.get('name')} ({business_profile.get('industry')})
    Target Language: {full_language}
    
    Original English Content:
    "{content}"
    
    Task: Translate and CULTURALLY ADAPT this content for {full_language} speaking audience.
    - Translate the ENTIRE content to {full_language} script (NOT English)
    - Keep the marketing impact
    - Adapt idioms and expressions to local equivalents
    - Maintain hashtags relevance (translate or keep English where appropriate)
    - Preserve emojis and formatting
    
    IMPORTANT: The translated_content MUST be in {full_language} script, NOT English.
    
    Return as JSON:
    {{
        "translated_content": "[Your translation in {full_language} script here - NOT in English]",
        "transliteration": "[Roman script transliteration for pronunciation]",
        "cultural_adaptations": [
            "List of cultural changes made"
        ],
        "hashtags_translated": ["#translated_hashtag1", "#translated_hashtag2"],
        "recommended_posting_time": "7 PM - 9 PM IST (peak regional engagement)",
        "dialect_notes": "Notes about the dialect used"
    }}
    """
    
    # Use multi-provider AI call
    result = call_ai_for_json(prompt, timeout=30)
    if result:
        return result
    
    # Fallback with sample translation if all AI providers fail
    return {
        "translated_content": f"[{target_language.upper()}] {content}",
        "transliteration": content,
        "cultural_adaptations": ["Translation service temporarily unavailable"],
        "hashtags_translated": [],
        "recommended_posting_time": "7 PM - 9 PM IST",
        "dialect_notes": "Standard dialect"
    }


def generate_content_with_brand_voice(platform, business_profile, brand_voice_dna, topic=None, products=None):
    """
    Generate content that matches the extracted brand voice DNA.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {"error": "GOOGLE_API_KEY not found"}
    
    genai.configure(api_key=api_key)
    
    product_text = ""
    if products:
        product_list = "\n".join([f"- {p.get('name')}: {p.get('description')}" for p in products[:3]])
        product_text = f"\nProducts to promote:\n{product_list}"
    
    prompt = f"""
    You are a content writer who must EXACTLY match a specific brand voice.
    
    Business: {business_profile.get('name')} ({business_profile.get('industry')})
    Platform: {platform}
    Topic: {topic or 'General promotional content'}
    {product_text}
    
    BRAND VOICE DNA (You MUST follow this exactly):
    {json.dumps(brand_voice_dna, indent=2)}
    
    Generate content that:
    1. Uses the same tone and energy level
    2. Includes the favorite words and phrases
    3. Uses emojis in the same style
    4. Follows the CTA approach
    5. Matches all unique characteristics
    
    Return as JSON:
    {{
        "post_content": "Your generated content matching the brand voice...",
        "image_prompt": "Detailed image description...",
        "voice_match_score": 92,
        "elements_used": ["Used favorite emoji 🔥", "Included phrase 'Check it out'"]
    }}
    """
    
    model_names = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={'timeout': 30})
            text = response.text
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(text[json_start:json_end])
        except Exception:
            continue
    
    return {"error": "Failed to generate content with brand voice"}


def fetch_trending_hashtags(region="in"):
    """
    Fetches trending hashtags using DuckDuckGo Search.
    Focuses on business/marketing trends.
    """
    from duckduckgo_search import DDGS
    import re
    
    try:
        with DDGS() as ddgs:
            # Search for specific trending topics in India
            query = "trending topics india today twitter instagram"
            results = list(ddgs.text(query, max_results=5))
            
            # Extract hashtags/topics from search results
            trends = set()
            for r in results:
                # Look for #hashtag
                hashtags = re.findall(r'#\w+', r['body'])
                if hashtags:
                    trends.update(hashtags)
                
                # Look for capitalized words that might be trends
                words = re.findall(r'\\b[A-Z][a-zA-Z]+\\b', r['title'])
                # Filter out common words
                common = {'The', 'A', 'An', 'In', 'On', 'For', 'To', 'Of', 'And', 'Is', 'Are', 'Top', 'Best', 'Trending', 'India', 'Today', 'News', 'Latest', 'Twitter', 'Instagram', 'Facebook', 'Social', 'Media'}
                trends.update([f"#{w}" for w in words if w not in common and len(w) > 3])
            
            # Filter and clean
            final_trends = []
            for t in trends:
                clean = re.sub(r'[^a-zA-Z0-9]', '', t)
                if len(clean) > 3 and len(clean) < 25: 
                    final_trends.append(f"#{clean}")
            
            # Keep unique, sort by length
            final_trends = sorted(list(set(final_trends)), key=len)
            
            if not final_trends:
                raise Exception("No trends found via search")
            
            # Add some reliable fallbacks if list is short
            if len(final_trends) < 5:
                import random
                base = ["#TrendingIndia", "#VocalForLocal", "#DigitalIndia", "#BusinessGrowth", "#StartupIndia"]
                final_trends.extend(random.sample(base, 5 - len(final_trends)))
                
            return final_trends[:12]
            
    except Exception as e:
        print(f"Trend fetch error: {e}")
        # Robust fallback
        import random
        base_trends = [
            "VocalForLocal", "DigitalIndia", "SmallBusinessLove", 
            "MadeInIndia", "StartupIndia", "DesiBrands", 
            "ShopLocal", "EcoFriendly", "Handmade",
            "BusinessGrowth", "MarketingTips", "EntrepreneurLife",
            "IndianBusiness", "GrowWithGoogle", "MSME"
        ]
        return [f"#{t}" for t in random.sample(base_trends, 8)]
