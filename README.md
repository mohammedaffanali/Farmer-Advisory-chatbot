# Farmer Advisory App

An **# AI-Based Farmer Query Support and Advisory System

This is an AI-powered farming advisory system that helps farmers with crop management, disease identification, weather forecasting, and market insights.

## Features

- 🌾 Crop Disease Analysis using Image Processing
- 🌤️ Weather Forecasting and Agricultural Advice
- 💹 Market Price Information
- 🗣️ Voice Input and Output Support
- 🔄 Language Translation
- 📊 Admin Dashboard for Query Analytics

## Prerequisites

- Python 3.10 or higher
- Docker and Docker Compose (for containerized deployment)
- API Keys:
  - OpenAI API Key
  - Google Gemini API Key
  - OpenWeatherMap API Key (optional)

## Local Development Setup

1. Clone the repository:
```bash
git clone <your-repository-url>
cd Farmer_chatbot
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
   - Rename `api.env` to `.env`
   - Add your API keys to the `.env` file:
```env
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
WEATHER_API_KEY=your_weather_key
```

5. Run the development server:
```bash
python app.py
```

## Production Deployment

### Option 1: Manual Deployment

1. Install production dependencies:
```bash
pip install gunicorn
```

2. Create a systemd service (on Linux):
```ini
[Unit]
Description=Farmer Advisory System
After=network.target

[Service]
User=your_user
WorkingDirectory=/path/to/Farmer_chatbot
Environment="PATH=/path/to/Farmer_chatbot/venv/bin"
EnvironmentFile=/path/to/Farmer_chatbot/.env
ExecStart=/path/to/Farmer_chatbot/venv/bin/gunicorn -w 4 -b 0.0.0.0:8000 app:app

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```bash
sudo systemctl enable farmer_advisory
sudo systemctl start farmer_advisory
```

4. Configure Nginx as a reverse proxy:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static {
        alias /path/to/Farmer_chatbot/static;
    }

    location /uploads {
        alias /path/to/Farmer_chatbot/uploads;
    }
}
```

### Option 2: Docker Deployment

1. Build and run using Docker Compose:
```bash
docker-compose up -d --build
```

2. Configure Nginx reverse proxy (similar to manual deployment)

## Security Considerations

1. Set up SSL/TLS certificates for HTTPS:
```bash
sudo certbot --nginx -d your_domain.com
```

2. Configure firewall rules:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

3. Secure the uploads directory:
```bash
chmod 755 uploads
```

4. Regularly update dependencies:
```bash
pip install --upgrade -r requirements.txt
```

## Database Management

The application uses SQLite by default. For production:

1. Backup the database regularly:
```bash
sqlite3 queries.db ".backup 'backup.db'"
```

2. Monitor database size:
```bash
du -h queries.db
```

## Monitoring and Maintenance

1. View application logs:
```bash
# For systemd deployment
sudo journalctl -u farmer_advisory

# For Docker deployment
docker-compose logs -f
```

2. Monitor system resources:
```bash
htop
df -h
```

## Troubleshooting

1. If the application isn't accessible:
   - Check if the service is running
   - Verify firewall settings
   - Check nginx configuration and logs

2. If image analysis isn't working:
   - Verify API keys in .env file
   - Check uploads directory permissions
   - Review application logs for errors

3. For database issues:
   - Check file permissions
   - Verify disk space
   - Backup before any maintenance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details** designed to provide instant agricultural advice to farmers using text or audio queries (supports Malayalam).

## 📂 Project Structure

```
FarmerAdvisoryApp/
│── app.py
│── requirements.txt
│── Dockerfile
│── docker-compose.yml
│── README.md
│── database.db         # auto-created on first run
│── uploads/            # for audio files
│── templates/
│   ├── index.html
│   └── admin.html
```

## 🚀 Features
- Natural language query handling (Malayalam supported).
- Voice note transcription using Whisper.
- AI-powered advisory via OpenAI GPT model.
- Rule-based fallback when AI is unavailable.
- SQLite database storage for queries & responses.
- Admin panel (`/admin`) to view all stored queries.
- Dockerized setup for easy deployment.

## 🛠️ Setup Instructions

### 1. Clone & Install Requirements
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variable
```bash
export OPENAI_API_KEY=your_api_key_here
```

(You can also create a `.env` file and use `python-dotenv` to load it.)

### 3. Run Locally
```bash
python app.py
```
Open [http://127.0.0.1:5000](http://127.0.0.1:5000).

### 4. Run with Docker
```bash
docker-compose up --build
```
Then open [http://localhost:5000](http://localhost:5000).

## 👨‍💻 Admin Panel
Visit [http://127.0.0.1:5000/admin](http://127.0.0.1:5000/admin) to view all queries and responses.

## 📌 Notes
- Audio files uploaded by users are saved in the `uploads/` folder.
- `database.db` stores all farmer queries and responses persistently.
- If no `OPENAI_API_KEY` is set, the system falls back to rule-based advice.

---

✨ This project aims to serve as a **Digital Krishi Officer** — always available, always learning, and always farmer-first.
