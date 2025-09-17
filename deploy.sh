#!/bin/bash

# Deploy script for Farmer Advisory System
# Usage: ./deploy.sh [start|stop|update]

# Configuration
APP_NAME="farmer_advisory"
APP_PATH="/path/to/Farmer_chatbot"
VENV_PATH="$APP_PATH/venv"
BACKUP_DIR="$APP_PATH/backups"
LOG_FILE="$APP_PATH/deploy.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
setup_directories() {
    log "Creating necessary directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$APP_PATH/uploads"
    mkdir -p "$APP_PATH/static/audio"
    chmod 755 "$APP_PATH/uploads"
    chmod 755 "$APP_PATH/static/audio"
}

# Backup database
backup_database() {
    log "Backing up database..."
    BACKUP_FILE="$BACKUP_DIR/queries_$(date +'%Y%m%d_%H%M%S').db"
    sqlite3 "$APP_PATH/queries.db" ".backup '$BACKUP_FILE'"
}

# Update application
update_app() {
    log "Updating application..."
    cd "$APP_PATH"
    git pull origin main
    
    # Update dependencies
    source "$VENV_PATH/bin/activate"
    pip install -r requirements.txt
    
    # Check for environment file
    if [ ! -f "$APP_PATH/.env" ]; then
        log "WARNING: .env file not found. Please configure environment variables."
        cp "$APP_PATH/api.env" "$APP_PATH/.env"
    fi
}

# Start application
start_app() {
    log "Starting application..."
    if [ -f "$APP_PATH/docker-compose.yml" ]; then
        docker-compose -f "$APP_PATH/docker-compose.yml" up -d
    else
        source "$VENV_PATH/bin/activate"
        gunicorn -w 4 -b 0.0.0.0:8000 app:app -D
    fi
}

# Stop application
stop_app() {
    log "Stopping application..."
    if [ -f "$APP_PATH/docker-compose.yml" ]; then
        docker-compose -f "$APP_PATH/docker-compose.yml" down
    else
        pkill gunicorn
    fi
}

# Check application status
check_status() {
    log "Checking application status..."
    if [ -f "$APP_PATH/docker-compose.yml" ]; then
        docker-compose -f "$APP_PATH/docker-compose.yml" ps
    else
        pgrep -fa gunicorn
    fi
}

# Main script logic
case "$1" in
    start)
        setup_directories
        start_app
        ;;
    stop)
        backup_database
        stop_app
        ;;
    update)
        stop_app
        backup_database
        update_app
        start_app
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 {start|stop|update|status}"
        exit 1
        ;;
esac

log "Operation completed successfully"
exit 0