# filepath: app.py
import os
import sqlite3
import json
import requests
import io
import base64
from datetime import datetime
from flask import Flask, render_template, request, jsonify, Response, send_from_directory
from werkzeug.utils import secure_filename
import whisper
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import pandas as pd
from geopy.geocoders import Nominatim

# Optional imports
try:
    import openai
except ImportError:
    openai = None

try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except ImportError:
    genai = None

try:
    import speech_recognition as sr
except ImportError:
    sr = None

try:
    import pyttsx3
except ImportError:
    pyttsx3 = None

app = Flask(__name__, static_url_path='/static', static_folder='static')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['AUDIO_FOLDER'] = 'static/audio'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Load Whisper model for audio transcription
whisper_model = whisper.load_model("base")

# API keys from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "demo_key")  # Default to demo key if not provided

if OPENAI_API_KEY and openai:
    openai.api_key = OPENAI_API_KEY

if GEMINI_API_KEY and genai:
    genai.configure(api_key=GEMINI_API_KEY)
    
# Configure Gemini safety settings
safety_settings = [
    {"category": HarmCategory.HARM_CATEGORY_HARASSMENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
    {"category": HarmCategory.HARM_CATEGORY_HATE_SPEECH, "threshold": HarmBlockThreshold.BLOCK_NONE},
    {"category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, "threshold": HarmBlockThreshold.BLOCK_NONE},
    {"category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
]
# --- Image Analysis with Gemini ---
def analyze_image(image_path):
    print(f"Starting image analysis for: {image_path}")
    
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY not configured")
        return "Image analysis requires Gemini API key. Please configure your API key."
    
    if not genai:
        print("Error: google.generativeai module not available")
        return "Required module 'google.generativeai' is not available."
    
    try:
        # Check if file exists
        if not os.path.exists(image_path):
            print(f"Error: Image file not found at path: {image_path}")
            return "Error: Image file not found."
        
        print("Loading and preparing image...")
        # Load and prepare the image
        img = Image.open(image_path)
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()
        
        print("Creating Gemini model instance...")
        # Create a Gemini model instance for image analysis
        model = genai.GenerativeModel('gemini-pro-vision')
        
        # Prepare the prompt for crop disease detection
        prompt = """
        Analyze this crop image and provide the following information:
        1. Identify the crop in the image
        2. Detect any diseases or pests visible
        3. Provide treatment recommendations
        4. Suggest preventive measures
        
        Format your response in a clear, structured way that would be helpful for a farmer.
        """
        
        # Generate content with the image
        response = model.generate_content([prompt, img_bytes], safety_settings=safety_settings)
        
        # Check if response has text attribute
        if hasattr(response, 'text'):
            return response.text
        else:
            # Handle case where response might be in a different format
            return str(response)
    except Exception as e:
        print(f"Image analysis error: {e}")
        return f"Error analyzing image: {str(e)}"

# --- Image Analysis Endpoint ---
@app.route('/analyze_image', methods=['POST'])
def analyze_image_endpoint():
    print("Received image analysis request")
    
    if 'image' not in request.files:
        print("Error: No image file in request")
        return jsonify({'result': 'Please upload an image file'})
    
    image_file = request.files['image']
    if image_file.filename == '':
        print("Error: Empty filename")
        return jsonify({'result': 'No file selected'})
    
    try:
        # Ensure uploads directory exists
        upload_dir = app.config['UPLOAD_FOLDER']
        print(f"Ensuring upload directory exists: {upload_dir}")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Create a secure filename and save the file
        filename = secure_filename(image_file.filename)
        image_path = os.path.join(upload_dir, filename)
        print(f"Saving image to: {image_path}")
        image_file.save(image_path)
        
        # Analyze the image
        print("Starting image analysis...")
        result = analyze_image(image_path)
        print(f"Analysis result: {result[:100]}...")  # Print first 100 chars of result
        
        return jsonify({'result': result})
    except Exception as e:
        print(f"Error in image analysis endpoint: {str(e)}")
        return jsonify({'result': f"Sorry, there was an error analyzing the image: {str(e)}"})

# --- Weather Forecast with Gemini ---
def get_weather_forecast(location):
    try:
        # Get coordinates from location name
        geolocator = Nominatim(user_agent="farmer_advisory_app")
        location_data = geolocator.geocode(location)
        
        if not location_data:
            return "Location not found. Please try a different location name."
        
        lat, lon = location_data.latitude, location_data.longitude
        
        # Get weather data from OpenWeatherMap API
        weather_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
        response = requests.get(weather_url)
        
        if response.status_code != 200:
            return "Weather data unavailable. Please try again later."
        
        weather_data = response.json()
        
        # Process weather data for Gemini
        forecast_text = f"Weather forecast for {location} (next 5 days):\n\n"
        
        # Group by day
        daily_forecasts = {}
        for item in weather_data.get('list', []):
            date = datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d')
            if date not in daily_forecasts:
                daily_forecasts[date] = []
            daily_forecasts[date].append(item)
        
        # Create summary for each day
        for date, items in list(daily_forecasts.items())[:5]:  # Limit to 5 days
            day_name = datetime.strptime(date, '%Y-%m-%d').strftime('%A')
            temps = [item['main']['temp'] for item in items]
            humidity = [item['main']['humidity'] for item in items]
            descriptions = [item['weather'][0]['description'] for item in items]
            
            forecast_text += f"{day_name} ({date}):\n"
            forecast_text += f"  Temperature: {min(temps):.1f}°C to {max(temps):.1f}°C\n"
            forecast_text += f"  Humidity: {sum(humidity)//len(humidity)}%\n"
            forecast_text += f"  Conditions: {', '.join(set(descriptions))}\n\n"
        
        # Get farming advice based on weather using Gemini
        if GEMINI_API_KEY and genai:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Based on this weather forecast, provide farming advice:
            
            {forecast_text}
            
            What agricultural activities should farmers consider? What precautions should they take?
            Focus on practical advice related to irrigation, pest control, harvesting, and crop protection.
            """
            
            response = model.generate_content(prompt, safety_settings=safety_settings)
            farming_advice = response.text
            
            return f"{forecast_text}\n\nFARMING RECOMMENDATIONS:\n{farming_advice}"
        
        return forecast_text
    
    except Exception as e:
        print(f"Weather forecast error: {e}")
        return f"Error getting weather forecast: {str(e)}"

# --- Market Price Tracking ---
def get_crop_prices(crop_name):
    try:
        # This would ideally connect to a real agricultural price API
        # For demonstration, we'll use a simulated response
        
        # Simulate API call with mock data
        crops_data = {
            "rice": {"min": 1800, "max": 2200, "avg": 2000, "trend": "stable"},
            "wheat": {"min": 1900, "max": 2300, "avg": 2100, "trend": "rising"},
            "cotton": {"min": 5500, "max": 6200, "avg": 5800, "trend": "falling"},
            "sugarcane": {"min": 280, "max": 320, "avg": 300, "trend": "stable"},
            "maize": {"min": 1700, "max": 1900, "avg": 1800, "trend": "rising"},
            "potato": {"min": 1200, "max": 1800, "avg": 1500, "trend": "volatile"},
            "tomato": {"min": 1500, "max": 2500, "avg": 2000, "trend": "falling"},
            "onion": {"min": 1800, "max": 2800, "avg": 2300, "trend": "rising"},
        }
        
        # Normalize crop name for lookup
        crop_name = crop_name.lower().strip()
        
        if crop_name in crops_data:
            data = crops_data[crop_name]
            
            # Format the response
            response = f"Current market prices for {crop_name.title()}:\n"
            response += f"Minimum: ₹{data['min']} per quintal\n"
            response += f"Maximum: ₹{data['max']} per quintal\n"
            response += f"Average: ₹{data['avg']} per quintal\n"
            response += f"Price Trend: {data['trend'].title()}\n\n"
            
            # Get market advice using Gemini
            if GEMINI_API_KEY and genai:
                model = genai.GenerativeModel('gemini-1.5-flash')
                prompt = f"""
                Based on these market prices for {crop_name}:
                - Minimum: ₹{data['min']} per quintal
                - Maximum: ₹{data['max']} per quintal
                - Average: ₹{data['avg']} per quintal
                - Price Trend: {data['trend']}
                
                Provide advice to farmers about:
                1. Whether this is a good time to sell their {crop_name} crop
                2. Market outlook for the coming weeks
                3. Storage recommendations if applicable
                4. Alternative markets or value-addition opportunities
                
                Keep the advice practical and actionable for Indian farmers.
                """
                
                response_obj = model.generate_content(prompt, safety_settings=safety_settings)
                market_advice = response_obj.text
                
                response += f"MARKET ADVISORY:\n{market_advice}"
            
            return response
        else:
            return f"Price data for {crop_name} is not available. Please try another crop."
    
    except Exception as e:
        print(f"Market price error: {e}")
        return f"Error retrieving market prices: {str(e)}"

# --- Seasonal Crops Advisory ---
def get_seasonal_crops_advice(region, season=None):
    try:
        # Determine current season if not provided
        if not season:
            current_month = datetime.now().month
            if 3 <= current_month <= 6:
                season = "summer"
            elif 7 <= current_month <= 10:
                season = "monsoon"
            else:
                season = "winter"
        
        # Use Gemini to provide region and season specific crop recommendations
        if GEMINI_API_KEY and genai:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Provide detailed seasonal crop recommendations for farmers in {region} during {season} season.
            
            Include:
            1. Top 5 recommended crops to plant now in {region} during {season}
            2. Optimal planting times and methods
            3. Expected water requirements
            4. Common challenges during this season and how to address them
            5. Intercropping opportunities if applicable
            
            Format your response in a clear, structured way that would be helpful for a farmer.
            """
            
            response = model.generate_content(prompt, safety_settings=safety_settings)
            return response.text
        else:
            # Fallback if Gemini is not available
            seasonal_crops = {
                "summer": ["cotton", "sugarcane", "rice", "vegetables", "fruits"],
                "monsoon": ["rice", "maize", "pulses", "oilseeds", "vegetables"],
                "winter": ["wheat", "barley", "mustard", "potato", "peas"]
            }
            
            crops = seasonal_crops.get(season.lower(), ["rice", "wheat", "vegetables"])
            
            response = f"Recommended crops for {season} season in {region}:\n"
            for crop in crops:
                response += f"- {crop.title()}\n"
            
            return response
    
    except Exception as e:
        print(f"Seasonal crops advice error: {e}")
        return f"Error getting seasonal crops advice: {str(e)}"

# --- Translation with Gemini ---
def translate_text(text, target_language="Malayalam"):
    if not (GEMINI_API_KEY and genai):
        return "Translation requires Gemini API. Please configure your API key."
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        Translate the following text to {target_language}:
        
        {text}
        
        Provide only the translated text without any additional explanations.
        """
        
        response = model.generate_content(prompt, safety_settings=safety_settings)
        return response.text
    
    except Exception as e:
        print(f"Translation error: {e}")
        return f"Error translating text: {str(e)}"

# --- Voice Synthesis ---
def text_to_speech(text):
    if not pyttsx3:
        return None
    
    try:
        engine = pyttsx3.init()
        # Save to a temporary file
        temp_file = os.path.join("uploads", "response.mp3")
        engine.save_to_file(text, temp_file)
        engine.runAndWait()
        return temp_file
    except Exception as e:
        print(f"Text-to-speech error: {e}")
        return None

# --- Speech Recognition ---
def recognize_speech():
    if not sr:
        return "Speech recognition requires the SpeechRecognition library."
    
    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            print("Listening...")
            audio = recognizer.listen(source)
            text = recognizer.recognize_google(audio)
            return text
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError:
        return "Could not request results"
    except Exception as e:
        print(f"Speech recognition error: {e}")
        return f"Error: {str(e)}"

# --- Rule-based fallback logic ---
def rule_based_advice(query: str) -> str:
    query = query.lower()
    if "pest" in query:
        return "Use eco-friendly pesticides and monitor crop leaves daily."
    elif "water" in query or "irrigation" in query:
        return "Ensure drip irrigation and avoid overwatering."
    elif "soil" in query:
        return "Test soil pH and enrich with organic compost."
    elif "weather" in query or "rain" in query:
        return "Check the local forecast; consider protective covering for crops."
    elif "subsidy" in query or "scheme" in query:
        return "Visit your Krishibhavan office for the latest subsidy and scheme details."
    else:
        return "Consult your nearest agricultural office for expert advice."

# --- Gemini integration ---
def gemini_based_advice(prompt: str) -> str:
    if not (GEMINI_API_KEY and genai):
        return ""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(prompt, safety_settings=safety_settings)
        return resp.text if hasattr(resp, "text") else str(resp)
    except Exception as e:
        print("Gemini API failed:", e)
        return ""

# --- OpenAI integration ---
def openai_based_advice(prompt: str) -> str:
    if not (OPENAI_API_KEY and openai):
        return ""
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an agricultural advisor for Indian farmers. Give concise, clear advice in simple language."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200
        )
        return resp.choices[0].message["content"].strip()
    except Exception as e:
        print("OpenAI API failed:", e)
        return ""

# --- Unified advisory logic ---
def get_advice(query: str) -> str:
    if not query:
        return "Please enter a valid farming question."

    # Try Gemini first
    advice = gemini_based_advice(query)
    if advice:
        return advice

    # Then OpenAI
    advice = openai_based_advice(query)
    if advice:
        return advice

    # Fallback to rules
    return rule_based_advice(query)
    
# --- Chatbot functionality ---
def get_chatbot_response(query: str) -> dict:
    """Process a chat query and return a structured response for the chatbot interface"""
    try:
        # Store the query in database for future reference
        conn = sqlite3.connect('queries.db')
        cursor = conn.cursor()
        cursor.execute('CREATE TABLE IF NOT EXISTS chat_queries (id INTEGER PRIMARY KEY, query TEXT, response TEXT, timestamp TEXT)')
        
        # Process the query based on its content
        response = ""
        
        # Check if query is about weather
        if any(keyword in query.lower() for keyword in ['weather', 'rain', 'forecast', 'climate']):
            # Extract location from query or use default
            location = "Kerala"  # Default location
            location_keywords = ["in", "at", "for", "near"]
            for keyword in location_keywords:
                if f" {keyword} " in query.lower():
                    location = query.lower().split(f" {keyword} ")[1].split()[0]
                    location = location.strip("?.,!").title()
            response = get_weather_forecast(location)
            
        # Check if query is about market prices
        elif any(keyword in query.lower() for keyword in ['price', 'market', 'sell', 'cost', 'rate']):
            # Extract crop name from query or use default
            crop = "rice"  # Default crop
            common_crops = ["rice", "wheat", "cotton", "sugarcane", "maize", "potato", "tomato", "onion"]
            for c in common_crops:
                if c in query.lower():
                    crop = c
                    break
            response = get_crop_prices(crop)
            
        # Check if query is about seasonal crops
        elif any(keyword in query.lower() for keyword in ['season', 'crop', 'plant', 'grow', 'cultivate']):
            # Extract region from query or use default
            region = "Kerala"  # Default region
            season = None
            seasons = ["summer", "winter", "monsoon", "rainy"]
            for s in seasons:
                if s in query.lower():
                    season = s
                    break
            response = get_seasonal_crops_advice(region, season)
            
        # For all other queries, use the general advice function
        else:
            response = get_advice(query)
        
        # Save the query and response to database
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('INSERT INTO chat_queries (query, response, timestamp) VALUES (?, ?, ?)', 
                      (query, response, timestamp))
        conn.commit()
        conn.close()
        
        return {
            "response": response,
            "timestamp": timestamp
        }
        
    except Exception as e:
        print(f"Chatbot error: {e}")
        return {
            "response": f"I'm sorry, I encountered an error: {str(e)}. Please try again.",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

# --- Audio transcription ---
def transcribe_audio(file_path: str) -> str:
    try:
        result = whisper_model.transcribe(file_path)
        return result.get("text", "").strip()
    except Exception as e:
        print(f"Audio transcription error: {e}")
        return ""

# --- Database setup ---
def init_db():
    conn = sqlite3.connect("queries.db")
    c = conn.cursor()
    
    # Main queries table
    c.execute(
        """CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT,
            response TEXT,
            query_type TEXT DEFAULT 'general',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    
    # Image analysis table
    c.execute(
        """CREATE TABLE IF NOT EXISTS image_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT,
            analysis_result TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    
    # Weather forecasts table
    c.execute(
        """CREATE TABLE IF NOT EXISTS weather_forecasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT,
            forecast_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    
    # Market prices table
    c.execute(
        """CREATE TABLE IF NOT EXISTS market_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop_name TEXT,
            price_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    
    # Seasonal crops advice table
    c.execute(
        """CREATE TABLE IF NOT EXISTS seasonal_crops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region TEXT,
            season TEXT,
            advice TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    
    conn.commit()
    conn.close()

def save_to_db(question: str, response: str, query_type: str = "general"):
    conn = sqlite3.connect("queries.db")
    c = conn.cursor()
    c.execute("INSERT INTO queries (question, response, query_type) VALUES (?, ?, ?)", 
              (question, response, query_type))
    conn.commit()
    conn.close()
    
def save_image_analysis(image_path: str, analysis_result: str):
    conn = sqlite3.connect("queries.db")
    c = conn.cursor()
    c.execute("INSERT INTO image_analysis (image_path, analysis_result) VALUES (?, ?)", 
              (image_path, analysis_result))
    conn.commit()
    conn.close()
    
def save_weather_forecast(location: str, forecast_data: str):
    conn = sqlite3.connect("queries.db")
    c = conn.cursor()
    c.execute("INSERT INTO weather_forecasts (location, forecast_data) VALUES (?, ?)", 
              (location, forecast_data))
    conn.commit()
    conn.close()
    
def save_market_price(crop_name: str, price_data: str):
    conn = sqlite3.connect("queries.db")
    c = conn.cursor()
    c.execute("INSERT INTO market_prices (crop_name, price_data) VALUES (?, ?)", 
              (crop_name, price_data))
    conn.commit()
    conn.close()
    
def save_seasonal_crops_advice(region: str, season: str, advice: str):
    conn = sqlite3.connect("queries.db")
    c = conn.cursor()
    c.execute("INSERT INTO seasonal_crops (region, season, advice) VALUES (?, ?, ?)", 
              (region, season, advice))
    conn.commit()
    conn.close()
    
def save_to_csv(query: str, response: str):
    """Save query and response to CSV file"""
    import csv
    import os
    from datetime import datetime
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # CSV file path
    csv_file = os.path.join('data', 'queries.csv')
    
    # Check if file exists to determine if we need to write headers
    file_exists = os.path.isfile(csv_file)
    
    # Current timestamp
    timestamp = datetime.now().isoformat()
    
    # Write to CSV file
    with open(csv_file, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write headers if file doesn't exist
        if not file_exists:
            writer.writerow(['timestamp', 'query', 'response'])
        
        # Write data
        writer.writerow([timestamp, query, response])

# --- Routes ---
@app.route("/", methods=["GET", "POST"])
def index():
    response = None
    translated_response = None
    audio_response_path = None
    image_analysis_result = None
    weather_forecast_result = None
    market_price_result = None
    seasonal_crops_result = None
    
    if request.method == "POST":
        # Get the request type
        request_type = request.form.get("request_type", "general_query")
        
        # Handle general query
        if request_type == "general_query":
            user_query = request.form.get("query")

            # Handle audio upload for transcription
            if "audio" in request.files:
                audio_file = request.files["audio"]
                if audio_file.filename:
                    audio_path = os.path.join("uploads", audio_file.filename)
                    os.makedirs("uploads", exist_ok=True)
                    audio_file.save(audio_path)
                    transcribed_text = transcribe_audio(audio_path)
                    if transcribed_text:
                        user_query = (user_query or "") + " " + transcribed_text

            if user_query:
                response = get_advice(user_query)
                save_to_db(user_query, response, "general")
                
                # Generate translated response if requested
                if request.form.get("translate") == "on":
                    target_language = request.form.get("language", "Malayalam")
                    translated_response = translate_text(response, target_language)
                
                # Generate audio response if requested
                if request.form.get("voice_response") == "on":
                    audio_response_path = text_to_speech(response)
        
        # Handle image analysis
        elif request_type == "image_analysis":
            if "crop_image" in request.files:
                image_file = request.files["crop_image"]
                if image_file.filename:
                    # Ensure uploads directory exists
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                    
                    # Create a secure filename and save the file
                    from werkzeug.utils import secure_filename
                    filename = secure_filename(image_file.filename)
                    image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    image_file.save(image_path)
                    
                    # Analyze the image and save the result
                    try:
                        image_analysis_result = analyze_image(image_path)
                        save_image_analysis(image_path, image_analysis_result)
                    except Exception as e:
                        print(f"Error in image analysis route: {e}")
                        image_analysis_result = f"Error analyzing image: {str(e)}"
        
        # Handle weather forecast
        elif request_type == "weather_forecast":
            location = request.form.get("location")
            if location:
                weather_forecast_result = get_weather_forecast(location)
                save_weather_forecast(location, weather_forecast_result)
        
        # Handle market price check
        elif request_type == "market_price":
            crop_name = request.form.get("crop_name")
            if crop_name:
                market_price_result = get_crop_prices(crop_name)
                save_market_price(crop_name, market_price_result)
        
        # Handle seasonal crops advice
        elif request_type == "seasonal_crops":
            region = request.form.get("region")
            season = request.form.get("season")
            if region:
                seasonal_crops_result = get_seasonal_crops_advice(region, season)
                save_seasonal_crops_advice(region, season, seasonal_crops_result)
        
        # Handle live voice input
        elif request_type == "voice_input":
            voice_text = recognize_speech()
            if voice_text:
                response = get_advice(voice_text)
                save_to_db(voice_text, response, "voice")
                
                # Generate translated response if requested
                if request.form.get("translate") == "on":
                    target_language = request.form.get("language", "Malayalam")
                    translated_response = translate_text(response, target_language)
                
                # Generate audio response
                audio_response_path = text_to_speech(response)

    return render_template(
        "index.html", 
        response=response,
        translated_response=translated_response,
        audio_response_path=audio_response_path,
        image_analysis_result=image_analysis_result,
        weather_forecast_result=weather_forecast_result,
        market_price_result=market_price_result,
        seasonal_crops_result=seasonal_crops_result
    )
    
@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    data = request.json
    query = data.get('message', '')
    
    if not query:
        return jsonify({"error": "No message provided"}), 400
        
    response = get_chatbot_response(query)
    
    # Save to CSV file
    save_to_csv(query, response["response"])
    
    return jsonify(response)

@app.route("/admin")
def admin():
    conn = sqlite3.connect("queries.db")
    c = conn.cursor()
    
    # Get general queries
    c.execute("SELECT * FROM queries ORDER BY id DESC LIMIT 50")
    queries = c.fetchall()
    
    # Get image analyses
    c.execute("SELECT * FROM image_analysis ORDER BY id DESC LIMIT 20")
    image_analyses = c.fetchall()
    
    # Get weather forecasts
    c.execute("SELECT * FROM weather_forecasts ORDER BY id DESC LIMIT 20")
    weather_forecasts = c.fetchall()
    
    # Get market prices
    c.execute("SELECT * FROM market_prices ORDER BY id DESC LIMIT 20")
    market_prices = c.fetchall()
    
    # Get seasonal crops advice
    c.execute("SELECT * FROM seasonal_crops ORDER BY id DESC LIMIT 20")
    seasonal_crops = c.fetchall()
    
    conn.close()
    
    return render_template(
        "admin.html", 
        queries=queries,
        image_analyses=image_analyses,
        weather_forecasts=weather_forecasts,
        market_prices=market_prices,
        seasonal_crops=seasonal_crops
    )

# API routes for AJAX requests
@app.route("/api/speech-to-text", methods=["POST"])
def speech_to_text_api():
    try:
        if "audio" in request.files:
            audio_file = request.files["audio"]
            if audio_file.filename:
                audio_path = os.path.join("uploads", audio_file.filename)
                os.makedirs("uploads", exist_ok=True)
                audio_file.save(audio_path)
                transcribed_text = transcribe_audio(audio_path)
                return jsonify({"success": True, "text": transcribed_text})
        return jsonify({"success": False, "error": "No audio file provided"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/text-to-speech", methods=["POST"])
def text_to_speech_api():
    try:
        data = request.get_json()
        text = data.get("text")
        if text:
            audio_path = text_to_speech(text)
            if audio_path:
                return jsonify({"success": True, "audio_path": audio_path})
        return jsonify({"success": False, "error": "Failed to generate speech"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/audio/<filename>")
def serve_audio(filename):
    return send_from_directory("uploads", filename)

# --- Main ---
if __name__ == "__main__":
    init_db()
    app.run(debug=True)
