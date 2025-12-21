"""
AI Model Router
Generates content from multiple AI models, analyzes with virality score,
and returns the best performing content.
"""
import os
import requests
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

# Error code translations
ERROR_TRANSLATIONS = {
    137: "Duplicate content detected. Try modifying your post.",
    132: "Platform connection issue. Check Ayrshare dashboard.",
    401: "Authentication failed. API key may be invalid.",
    429: "Rate limit exceeded. Please wait a moment.",
    500: "Server error. Please try again.",
    "timeout": "Request timed out. Please try again.",
    "connection": "Connection failed. Check your internet."
}

def translate_error(error_code_or_message):
    """Convert cryptic error codes to user-friendly messages"""
    if isinstance(error_code_or_message, int):
        return ERROR_TRANSLATIONS.get(error_code_or_message, f"Error code: {error_code_or_message}")
    
    error_str = str(error_code_or_message).lower()
    if "timeout" in error_str:
        return ERROR_TRANSLATIONS["timeout"]
    if "connection" in error_str:
        return ERROR_TRANSLATIONS["connection"]
    
    return str(error_code_or_message)


class AIModelRouter:
    """Routes content generation to multiple models and picks the best"""
    
    def __init__(self):
        self.models = {
            'gemini': self._generate_gemini,
            'huggingface': self._generate_huggingface,
            'groq': self._generate_groq,
            'cohere': self._generate_cohere,
            'together': self._generate_together,
            'openrouter': self._generate_openrouter,
        }
    
    def generate_best_content(self, platform, business_info, topic=None, language="English"):
        """
        Generate content from all available models, analyze virality, return best.
        
        Returns:
            dict with best content and comparison data
        """
        from ai_service import analyze_virality_score
        
        # Debug: Check which API keys are available
        available_models = [name for name in self.models.keys() if self._has_api_key(name)]
        print(f"🔍 Available API keys: {available_models}")
        
        results = []
        
        # Generate from all models in parallel
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = {}
            for model_name, generator in self.models.items():
                if self._has_api_key(model_name):
                    future = executor.submit(
                        self._safe_generate,
                        generator,
                        platform,
                        business_info,
                        topic,
                        language
                    )
                    futures[future] = model_name
            
            for future in as_completed(futures, timeout=60):
                model_name = futures[future]
                try:
                    content = future.result()
                    if content and len(content) > 20:
                        # Analyze virality
                        virality = analyze_virality_score(content)
                        score = virality.get('score', 50) if isinstance(virality, dict) else 50
                        
                        results.append({
                            'model': model_name,
                            'content': content,
                            'virality_score': score,
                            'virality_analysis': virality
                        })
                        print(f"✅ {model_name} succeeded with score {score}")
                    else:
                        print(f"⚠️ {model_name} returned empty or short content")
                except Exception as e:
                    print(f"❌ {model_name} failed: {e}")
        
        # If no results, use template fallback
        if not results:
            fallback = self._generate_fallback(platform, business_info, topic)
            results.append({
                'model': 'template',
                'content': fallback,
                'virality_score': 60,
                'virality_analysis': {'score': 60, 'reason': 'Template-based content'}
            })
        
        # Sort by virality score, pick best
        results.sort(key=lambda x: x['virality_score'], reverse=True)
        best = results[0]
        
        return {
            'success': True,
            'best_content': best['content'],
            'best_model': best['model'],
            'best_score': best['virality_score'],
            'all_results': results,
            'comparison': [
                {'model': r['model'], 'score': r['virality_score']} 
                for r in results
            ]
        }
    
    def _safe_generate(self, generator, platform, business_info, topic, language):
        """Wrapper with timeout and error handling"""
        try:
            return generator(platform, business_info, topic, language)
        except Exception as e:
            print(f"Generation error: {e}")
            return None
    
    def _has_api_key(self, model_name):
        """Check if API key exists for model"""
        key_map = {
            'gemini': 'GOOGLE_API_KEY',
            'huggingface': 'HUGGINGFACE_API_KEY',
            'groq': 'GROQ_API_KEY',
            'cohere': 'COHERE_API_KEY',
            'together': 'TOGETHER_API_KEY',
            'openrouter': 'OPENROUTER_API_KEY',
        }
        return bool(os.environ.get(key_map.get(model_name, '')))
    
    def _generate_gemini(self, platform, business_info, topic, language):
        """Generate using Google Gemini"""
        import google.generativeai as genai
        
        api_key = os.environ.get("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        
        business_name = business_info.get('name', 'Business')
        industry = business_info.get('industry', 'general')
        
        prompt = self._build_prompt(platform, business_name, industry, topic, language)
        
        for model_name in ['gemini-1.5-flash', 'gemini-2.0-flash']:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt, request_options={'timeout': 30})
                return response.text.strip()
            except:
                continue
        return None
    
    def _generate_huggingface(self, platform, business_info, topic, language):
        """Generate using HuggingFace API"""
        api_key = os.environ.get("HUGGINGFACE_API_KEY")
        if not api_key:
            return None
        
        business_name = business_info.get('name', 'Business')
        industry = business_info.get('industry', 'general')
        
        prompt = self._build_prompt(platform, business_name, industry, topic, language)
        
        # Try multiple models
        models = [
            "google/gemma-1.1-7b-it",
            "mistralai/Mistral-7B-Instruct-v0.1"
        ]
        
        for model in models:
            try:
                response = requests.post(
                    f"https://api-inference.huggingface.co/models/{model}",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"inputs": prompt, "parameters": {"max_new_tokens": 300}},
                    timeout=30
                )
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and result:
                        text = result[0].get('generated_text', '')
                        # Extract just the generated part (after prompt)
                        if prompt in text:
                            text = text.split(prompt)[-1]
                        return text.strip()
            except:
                continue
        return None
    
    def _generate_groq(self, platform, business_info, topic, language):
        """Generate using Groq API (very fast)"""
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return None
        
        business_name = business_info.get('name', 'Business')
        industry = business_info.get('industry', 'general')
        
        prompt = self._build_prompt(platform, business_name, industry, topic, language)
        
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 300,
                    "temperature": 0.7
                },
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
        except:
            pass
        return None
    
    def _generate_cohere(self, platform, business_info, topic, language):
        """Generate using Cohere API (Command R+)"""
        api_key = os.environ.get("COHERE_API_KEY")
        if not api_key:
            return None
        
        business_name = business_info.get('name', 'Business')
        industry = business_info.get('industry', 'general')
        
        prompt = self._build_prompt(platform, business_name, industry, topic, language)
        
        try:
            response = requests.post(
                "https://api.cohere.ai/v1/generate",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "command",
                    "prompt": prompt,
                    "max_tokens": 300,
                    "temperature": 0.7
                },
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('generations', [{}])[0].get('text', '').strip()
        except:
            pass
        return None
    
    def _generate_together(self, platform, business_info, topic, language):
        """Generate using Together.ai API (Llama, Mistral models)"""
        api_key = os.environ.get("TOGETHER_API_KEY")
        if not api_key:
            return None
        
        business_name = business_info.get('name', 'Business')
        industry = business_info.get('industry', 'general')
        
        prompt = self._build_prompt(platform, business_name, industry, topic, language)
        
        try:
            response = requests.post(
                "https://api.together.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta-llama/Llama-3-70b-chat-hf",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 300,
                    "temperature": 0.7
                },
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
        except:
            pass
        return None
    
    def _generate_openrouter(self, platform, business_info, topic, language):
        """Generate using OpenRouter API (routes to best available model)"""
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            return None
        
        business_name = business_info.get('name', 'Business')
        industry = business_info.get('industry', 'general')
        
        prompt = self._build_prompt(platform, business_name, industry, topic, language)
        
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta-llama/llama-3.1-8b-instruct:free",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 300
                },
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
        except:
            pass
        return None
    
    def _build_prompt(self, platform, business_name, industry, topic, language):
        """Build the generation prompt"""
        topic_text = topic or "latest products/services"
        
        platform_hints = {
            'Twitter': "Keep under 280 characters. Be punchy and use 1-2 hashtags.",
            'LinkedIn': "Be professional, longer form. Add value and insights.",
            'Instagram': "Be visual and trendy. Use emojis and multiple hashtags.",
            'TikTok': "Be fun, Gen-Z friendly, use trending phrases.",
            'Email': "Be personal and include a clear call-to-action.",
            'Blog': "Write detailed, SEO-friendly content with headers."
        }
        
        hint = platform_hints.get(platform, "Be engaging and relevant.")
        
        return f"""Write a {platform} post for {business_name} ({industry}) about {topic_text}.
Language: {language}
{hint}
Only return the post content, no explanations."""
    
    def _generate_fallback(self, platform, business_info, topic):
        """Template-based fallback (always works)"""
        business_name = business_info.get('name', 'Business')
        industry = business_info.get('industry', 'general')
        topic_text = topic or "amazing products"
        
        templates = {
            'Twitter': f"✨ Exciting news from {business_name}! Check out our {topic_text}. Quality you can trust! 🔥 #{industry.replace(' ', '')} #MustSee",
            'LinkedIn': f"At {business_name}, we're proud to share our latest {topic_text}.\n\nAs leaders in {industry}, we continue to bring value to our customers. Let's connect and discuss how we can help your business grow.\n\n#Business #{industry.replace(' ', '')}",
            'Instagram': f"✨ {topic_text.upper()} ✨\n\n{business_name} brings you the best in {industry}! 🔥\n\nDouble tap if you agree! 👇\n\n#{industry.replace(' ', '')} #Quality #MustHave #Trending #Viral",
            'Email': f"Hello!\n\nWe're excited to share {topic_text} at {business_name}.\n\nAs your trusted {industry} partner, we're committed to bringing you the best.\n\nCheck it out today!\n\nBest regards,\n{business_name} Team",
            'Blog': f"# {topic_text.title()} - {business_name}\n\n{business_name} is proud to announce {topic_text}. As a leading provider in {industry}, we continue to innovate and deliver value.\n\n## Why Choose Us?\n\nQuality, trust, and customer satisfaction are at the heart of everything we do.\n\n## Get Started\n\nContact us today to learn more!"
        }
        
        return templates.get(platform, templates['Instagram'])


def format_for_platform(content, platform):
    """
    Auto-format content for specific platform requirements
    """
    if platform.lower() == 'twitter':
        # Truncate to 280 chars
        if len(content) > 280:
            # Try to cut at last complete sentence
            truncated = content[:277]
            last_period = truncated.rfind('.')
            if last_period > 200:
                return truncated[:last_period+1]
            return truncated + "..."
        return content
    
    if platform.lower() == 'linkedin':
        # Ensure professional tone, add line breaks
        if not content.startswith(('We', 'At', 'I', 'Our', 'The')):
            content = content[0].upper() + content[1:]
        return content
    
    if platform.lower() == 'instagram':
        # Ensure hashtags, add emojis if missing
        if '#' not in content:
            content += "\n\n#marketing #business #trending"
        return content
    
    return content


# Singleton instance
router = AIModelRouter()

def generate_best_content(platform, business_info, topic=None, language="English"):
    """Convenience function"""
    return router.generate_best_content(platform, business_info, topic, language)
