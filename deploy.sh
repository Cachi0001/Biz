#!/bin/bash

# Bizflow SME Nigeria - Production Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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
║              SME NIGERIA - DEPLOYMENT SCRIPT                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "Starting Bizflow SME Nigeria deployment process..."

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ and try again."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm and try again."
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed. Please install Python 3.11+ and try again."
    fi
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        warn "Vercel CLI is not installed. Installing now..."
        npm install -g vercel
    fi
    
    log "All dependencies are installed ✓"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        warn ".env file not found. Please copy .env.example to .env and configure it."
        info "Run: cp .env.example .env"
        error "Environment configuration is required for deployment."
    fi
    
    # Check if required environment variables are set
    required_vars=("SECRET_KEY" "JWT_SECRET_KEY" "DATABASE_URL" "PAYSTACK_SECRET_KEY" "CLOUDINARY_CLOUD_NAME")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env || grep -q "^${var}=your_" .env; then
            error "Required environment variable ${var} is not properly configured in .env file."
        fi
    done
    
    log "Environment configuration is valid ✓"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Frontend tests
    info "Running frontend tests..."
    cd frontend/bizflow-frontend
    
    if [ ! -d "node_modules" ]; then
        log "Installing frontend dependencies..."
        npm ci
    fi
    
    log "Running frontend linting..."
    npm run lint
    
    log "Running frontend type checking..."
    npm run type-check
    
    log "Running frontend unit tests..."
    npm run test
    
    log "Building frontend..."
    npm run build
    
    cd ../..
    
    # Backend tests
    info "Running backend tests..."
    cd backend/bizflow-backend
    
    if [ ! -d "venv" ]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    log "Activating virtual environment..."
    source venv/bin/activate
    
    log "Installing backend dependencies..."
    pip install -r requirements.txt
    
    log "Running backend linting..."
    flake8 src --count --select=E9,F63,F7,F82 --show-source --statistics
    
    log "Running backend tests..."
    pytest
    
    cd ../..
    
    log "All tests passed ✓"
}

# Build application
build_application() {
    log "Building application for production..."
    
    # Build frontend
    info "Building frontend..."
    cd frontend/bizflow-frontend
    npm run build
    cd ../..
    
    # Prepare backend
    info "Preparing backend..."
    cd backend/bizflow-backend
    
    # Create requirements.txt if it doesn't exist
    if [ ! -f "requirements.txt" ]; then
        pip freeze > requirements.txt
    fi
    
    cd ../..
    
    log "Application built successfully ✓"
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel..."
    
    # Login to Vercel (if not already logged in)
    if ! vercel whoami &> /dev/null; then
        log "Please login to Vercel..."
        vercel login
    fi
    
    # Deploy
    if [ "$1" = "production" ]; then
        log "Deploying to production..."
        vercel --prod
    else
        log "Deploying to preview..."
        vercel
    fi
    
    log "Deployment completed successfully ✓"
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep bizflow | head -1 | awk '{print $2}')
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        warn "Could not determine deployment URL. Please check manually."
        return
    fi
    
    info "Deployment URL: https://$DEPLOYMENT_URL"
    
    # Test health endpoint
    log "Testing health endpoint..."
    if curl -f "https://$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
        log "Health check passed ✓"
    else
        warn "Health check failed. Please verify deployment manually."
    fi
    
    # Test frontend
    log "Testing frontend..."
    if curl -f "https://$DEPLOYMENT_URL" > /dev/null 2>&1; then
        log "Frontend is accessible ✓"
    else
        warn "Frontend test failed. Please verify deployment manually."
    fi
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove build artifacts if needed
    # This is optional as Vercel handles cleanup
    
    log "Cleanup completed ✓"
}

# Main deployment function
main() {
    local deployment_type=${1:-preview}
    
    log "Starting deployment process for: $deployment_type"
    
    check_dependencies
    pre_deployment_checks
    run_tests
    build_application
    deploy_to_vercel "$deployment_type"
    post_deployment_verification
    cleanup
    
    log "🎉 Bizflow SME Nigeria deployment completed successfully!"
    log "🚀 Your application is now live and ready for Nigerian SMEs!"
    
    if [ "$deployment_type" = "production" ]; then
        log "📊 Don't forget to:"
        log "   - Monitor application performance"
        log "   - Check error tracking in Sentry"
        log "   - Verify payment processing with Paystack"
        log "   - Test all features thoroughly"
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [production|preview]"
    echo ""
    echo "Options:"
    echo "  production  Deploy to production environment"
    echo "  preview     Deploy to preview environment (default)"
    echo ""
    echo "Examples:"
    echo "  $0                # Deploy to preview"
    echo "  $0 preview        # Deploy to preview"
    echo "  $0 production     # Deploy to production"
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    production|preview|"")
        main "$1"
        ;;
    *)
        error "Invalid argument: $1"
        usage
        exit 1
        ;;
esac