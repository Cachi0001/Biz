#!/bin/bash

# Bizflow SME Nigeria - Automated Setup Script
# This script automates the installation and configuration of Bizflow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ██████╗ ██╗███████╗███████╗██╗      ██████╗ ██╗    ██╗   ║
║    ██╔══██╗██║╚══███╔╝██╔════╝██║     ██╔═══██╗██║    ██║   ║
║    ██████╔╝██║  ███╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║   ║
║    ██╔══██╗██║ ███╔╝  ██╔══╝  ██║     ██║   ██║██║███╗██║   ║
║    ██████╔╝██║███████╗██║     ███████╗╚██████╔╝╚███╔███╔╝   ║
║    ╚═════╝ ╚═╝╚══════╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝    ║
║                                                              ║
║              SME Nigeria - Business Management Platform      ║
║                        Automated Setup                      ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   warn "This script should not be run as root for security reasons."
   read -p "Do you want to continue anyway? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get OS information
get_os_info() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists lsb_release; then
            OS=$(lsb_release -si)
            VER=$(lsb_release -sr)
        elif [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$NAME
            VER=$VERSION_ID
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        VER=$(sw_vers -productVersion)
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="Windows"
        VER="Unknown"
    else
        OS="Unknown"
        VER="Unknown"
    fi
}

# Function to install system dependencies
install_system_deps() {
    log "Installing system dependencies..."
    
    if [[ "$OS" == "Ubuntu"* ]] || [[ "$OS" == "Debian"* ]]; then
        sudo apt-get update
        sudo apt-get install -y \
            python3 \
            python3-pip \
            python3-venv \
            nodejs \
            npm \
            git \
            curl \
            wget \
            build-essential \
            libpq-dev \
            postgresql-client \
            redis-tools
    elif [[ "$OS" == "CentOS"* ]] || [[ "$OS" == "Red Hat"* ]] || [[ "$OS" == "Fedora"* ]]; then
        sudo yum update -y
        sudo yum install -y \
            python3 \
            python3-pip \
            nodejs \
            npm \
            git \
            curl \
            wget \
            gcc \
            gcc-c++ \
            make \
            postgresql-devel \
            redis
    elif [[ "$OS" == "macOS" ]]; then
        if ! command_exists brew; then
            log "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew update
        brew install python3 node git postgresql redis
    else
        warn "Unsupported operating system: $OS"
        warn "Please install the following manually:"
        warn "- Python 3.11+"
        warn "- Node.js 18+"
        warn "- Git"
        warn "- PostgreSQL (optional)"
        warn "- Redis (optional)"
    fi
}

# Function to check Python version
check_python_version() {
    log "Checking Python version..."
    
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        
        if [[ $PYTHON_MAJOR -eq 3 ]] && [[ $PYTHON_MINOR -ge 11 ]]; then
            log "Python $PYTHON_VERSION found ✓"
        else
            error "Python 3.11+ required, found $PYTHON_VERSION"
        fi
    else
        error "Python 3 not found. Please install Python 3.11+"
    fi
}

# Function to check Node.js version
check_node_version() {
    log "Checking Node.js version..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        if [[ $NODE_MAJOR -ge 18 ]]; then
            log "Node.js $NODE_VERSION found ✓"
        else
            error "Node.js 18+ required, found $NODE_VERSION"
        fi
    else
        error "Node.js not found. Please install Node.js 18+"
    fi
}

# Function to install pnpm
install_pnpm() {
    if ! command_exists pnpm; then
        log "Installing pnpm..."
        npm install -g pnpm
    else
        log "pnpm already installed ✓"
    fi
}

# Function to setup backend
setup_backend() {
    log "Setting up backend..."
    
    cd backend/bizflow-backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    log "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        log "Creating backend .env file..."
        cat > .env << EOF
# Flask Configuration
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=development

# Database Configuration
DATABASE_URL=sqlite:///bizflow.db

# Paystack Configuration (Update with your keys)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Email Configuration (Update with your settings)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Bizflow SME Nigeria

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
EOF
        warn "Please update the .env file with your actual configuration values"
    fi
    
    # Initialize database
    log "Initializing database..."
    python -c "
from src.main import create_app
from src.models.user import db

app = create_app()
with app.app_context():
    db.create_all()
    print('Database initialized successfully')
"
    
    cd ../..
}

# Function to setup frontend
setup_frontend() {
    log "Setting up frontend..."
    
    cd frontend/bizflow-frontend
    
    # Install dependencies
    log "Installing frontend dependencies..."
    pnpm install
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        log "Creating frontend .env file..."
        cat > .env << EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Application Configuration
VITE_APP_NAME=Bizflow SME Nigeria
VITE_APP_VERSION=1.0.0
EOF
        warn "Please update the frontend .env file with your actual configuration values"
    fi
    
    cd ../..
}

# Function to run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests
    log "Running backend tests..."
    cd backend/bizflow-backend
    source venv/bin/activate
    pytest --tb=short || warn "Some backend tests failed"
    cd ../..
    
    # Frontend tests
    log "Running frontend tests..."
    cd frontend/bizflow-frontend
    pnpm test --run || warn "Some frontend tests failed"
    cd ../..
}

# Function to create startup scripts
create_startup_scripts() {
    log "Creating startup scripts..."
    
    # Development startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start Bizflow in development mode

echo "Starting Bizflow SME Nigeria in development mode..."

# Start backend
echo "Starting backend server..."
cd backend/bizflow-backend
source venv/bin/activate
python src/main.py &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend development server..."
cd frontend/bizflow-frontend
pnpm run dev &
FRONTEND_PID=$!
cd ../..

echo "Bizflow is starting up..."
echo "Backend API: http://localhost:5000"
echo "Frontend App: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

    # Production startup script
    cat > start-prod.sh << 'EOF'
#!/bin/bash

# Start Bizflow in production mode

echo "Starting Bizflow SME Nigeria in production mode..."

# Build frontend
echo "Building frontend..."
cd frontend/bizflow-frontend
pnpm run build
cd ../..

# Copy frontend build to backend static folder
echo "Copying frontend build to backend..."
mkdir -p backend/bizflow-backend/static
cp -r frontend/bizflow-frontend/dist/* backend/bizflow-backend/static/

# Start backend with gunicorn
echo "Starting backend server with gunicorn..."
cd backend/bizflow-backend
source venv/bin/activate
gunicorn --bind 0.0.0.0:5000 --workers 4 src.main:app
EOF

    # Make scripts executable
    chmod +x start-dev.sh start-prod.sh
    
    log "Startup scripts created:"
    log "  - start-dev.sh: Development mode"
    log "  - start-prod.sh: Production mode"
}

# Function to display final instructions
display_final_instructions() {
    echo -e "${GREEN}"
    cat << "EOF"

╔══════════════════════════════════════════════════════════════╗
║                    SETUP COMPLETED SUCCESSFULLY!            ║
╚══════════════════════════════════════════════════════════════╝

EOF
    echo -e "${NC}"
    
    log "Bizflow SME Nigeria has been set up successfully!"
    echo
    info "Next steps:"
    echo "1. Update configuration files:"
    echo "   - backend/bizflow-backend/.env (Paystack keys, email settings)"
    echo "   - frontend/bizflow-frontend/.env (API URL, Paystack public key)"
    echo
    echo "2. Start the application:"
    echo "   - Development: ./start-dev.sh"
    echo "   - Production: ./start-prod.sh"
    echo
    echo "3. Access the application:"
    echo "   - Development Frontend: http://localhost:5173"
    echo "   - Development Backend: http://localhost:5000"
    echo "   - Production: http://localhost:5000"
    echo
    echo "4. Default admin credentials will be created on first run"
    echo
    info "For more information, see README.md"
    echo
    warn "Remember to:"
    warn "- Update your Paystack API keys"
    warn "- Configure email settings"
    warn "- Set up SSL certificates for production"
    warn "- Configure your domain and DNS settings"
    echo
}

# Main execution
main() {
    log "Starting Bizflow SME Nigeria setup..."
    
    # Get OS information
    get_os_info
    log "Detected OS: $OS $VER"
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "Please run this script from the Bizflow project root directory"
    fi
    
    # Ask for installation preferences
    echo
    read -p "Install system dependencies? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_system_deps
    fi
    
    # Check prerequisites
    check_python_version
    check_node_version
    install_pnpm
    
    # Setup components
    setup_backend
    setup_frontend
    
    # Ask about running tests
    echo
    read -p "Run tests to verify installation? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    # Create startup scripts
    create_startup_scripts
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main "$@"

