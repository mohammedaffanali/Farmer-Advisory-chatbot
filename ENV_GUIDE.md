# Environment Configuration Guide

This guide explains how to properly configure the environment variables and API keys for the Farmer Advisory System.

## Required API Keys

1. **OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key

2. **Google Gemini API Key**
   - Visit https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key

3. **OpenWeatherMap API Key (Optional)**
   - Go to https://openweathermap.org/api
   - Sign up and get your API key
   - Copy the key

## Environment File Setup

1. Rename the `api.env` file to `.env`:
```bash
mv api.env .env
```

2. Edit the `.env` file with your API keys:
```env
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
WEATHER_API_KEY=your_weather_key_here  # Optional
```

## Production Environment Variables

For production deployment, additional environment variables can be set:

```env
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=0

# Security
SECRET_KEY=your_secure_random_key_here

# Server Configuration
GUNICORN_WORKERS=4
GUNICORN_THREADS=2
MAX_REQUESTS=1000
```

## Environment Variable Usage

The application uses these environment variables in the following ways:

1. **OpenAI API Key**
   - Used for general farming advice
   - Fallback for when Gemini is unavailable

2. **Gemini API Key**
   - Primary AI model for farming advice
   - Image analysis for crop disease detection
   - Weather interpretation
   - Market analysis

3. **Weather API Key**
   - Weather forecasting
   - Agricultural advice based on weather conditions

## Security Best Practices

1. Never commit `.env` file to version control
2. Regularly rotate API keys
3. Use different API keys for development and production
4. Set appropriate permissions on the `.env` file:
   ```bash
   chmod 600 .env
   ```

## Troubleshooting

1. **API Key Issues**
   - Verify key format and validity
   - Check for whitespace in the .env file
   - Ensure proper quotation marks around values if needed

2. **Environment Loading Issues**
   - Verify .env file location
   - Check file permissions
   - Ensure python-dotenv is installed

3. **Production Issues**
   - Verify environment variables are properly set in your deployment platform
   - Check system environment variables don't conflict
   - Ensure proper error logging is enabled