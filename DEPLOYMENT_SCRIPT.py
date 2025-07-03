#!/usr/bin/env python3
"""
Comprehensive Deployment Script for Bizflow SME Nigeria
Handles environment setup, dependency installation, and deployment
"""

import os
import sys
import subprocess
import json
from pathlib import Path

class BizflowDeployment:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "backend" / "bizflow-backend"
        self.frontend_dir = self.project_root / "frontend" / "bizflow-frontend"
        
    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")
    
    def run_command(self, command, cwd=None):
        """Run shell command and return result"""
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                cwd=cwd or self.project_root,
                capture_output=True, 
                text=True,
                check=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            self.log(f"Command failed: {command}", "ERROR")
            self.log(f"Error: {e.stderr}", "ERROR")
            return None
    
    def check_environment(self):
        """Check if all required environment variables are set"""
        self.log("Checking environment variables...")
        
        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_KEY", 
            "SUPABASE_SERVICE_KEY",
            "JWT_SECRET_KEY",
            "PAYSTACK_SECRET_KEY",
            "PAYSTACK_PUBLIC_KEY"
        ]
        
        env_file = self.backend_dir / ".env"
        missing_vars = []
        
        if env_file.exists():
            with open(env_file, 'r') as f:
                env_content = f.read()
                
            for var in required_vars:
                if f"{var}=" not in env_content or f"{var}=your_" in env_content:
                    missing_vars.append(var)
        else:
            missing_vars = required_vars
        
        if missing_vars:
            self.log("Missing environment variables:", "ERROR")
            for var in missing_vars:
                self.log(f"  - {var}", "ERROR")
            return False
        
        self.log("✅ All environment variables configured")
        return True
    
    def install_backend_dependencies(self):
        """Install Python dependencies"""
        self.log("Installing backend dependencies...")
        
        # Check if virtual environment exists
        venv_dir = self.backend_dir / "venv"
        if not venv_dir.exists():
            self.log("Creating virtual environment...")
            self.run_command("python -m venv venv", cwd=self.backend_dir)
        
        # Install dependencies
        if os.name == 'nt':  # Windows
            pip_cmd = "venv\\Scripts\\pip install -r requirements.txt"
        else:  # Unix/Linux
            pip_cmd = "source venv/bin/activate && pip install -r requirements.txt"
        
        result = self.run_command(pip_cmd, cwd=self.backend_dir)
        if result is not None:
            self.log("✅ Backend dependencies installed")
            return True
        return False
    
    def install_frontend_dependencies(self):
        """Install Node.js dependencies"""
        self.log("Installing frontend dependencies...")
        
        result = self.run_command("npm install", cwd=self.frontend_dir)
        if result is not None:
            self.log("✅ Frontend dependencies installed")
            return True
        return False
    
    def test_backend_connection(self):
        """Test backend startup and database connection"""
        self.log("Testing backend connection...")
        
        # Start backend in test mode
        if os.name == 'nt':  # Windows
            python_cmd = "venv\\Scripts\\python"
        else:  # Unix/Linux
            python_cmd = "venv/bin/python"
        
        test_script = f"""
import sys
sys.path.insert(0, 'src')
try:
    from src.main import create_app
    app = create_app()
    with app.app_context():
        from src.models.user import db
        db.create_all()
        print("✅ Database connection successful")
        print("✅ Tables created successfully")
except Exception as e:
    print(f"❌ Backend test failed: {{e}}")
    sys.exit(1)
"""
        
        with open(self.backend_dir / "test_connection.py", "w") as f:
            f.write(test_script)
        
        result = self.run_command(f"{python_cmd} test_connection.py", cwd=self.backend_dir)
        
        # Clean up test file
        (self.backend_dir / "test_connection.py").unlink()
        
        if result and "✅ Database connection successful" in result:
            self.log("✅ Backend connection test passed")
            return True
        
        self.log("❌ Backend connection test failed", "ERROR")
        return False
    
    def build_frontend(self):
        """Build frontend for production"""
        self.log("Building frontend...")
        
        result = self.run_command("npm run build", cwd=self.frontend_dir)
        if result is not None:
            self.log("✅ Frontend built successfully")
            return True
        return False
    
    def deploy_to_vercel(self):
        """Deploy to Vercel"""
        self.log("Deploying to Vercel...")
        
        # Check if Vercel CLI is installed
        vercel_check = self.run_command("vercel --version")
        if vercel_check is None:
            self.log("Installing Vercel CLI...")
            self.run_command("npm install -g vercel")
        
        # Deploy
        result = self.run_command("vercel --prod", cwd=self.project_root)
        if result is not None:
            self.log("✅ Deployed to Vercel successfully")
            return True
        return False
    
    def run_full_deployment(self):
        """Run complete deployment process"""
        self.log("🚀 Starting Bizflow SME Nigeria Deployment")
        self.log("=" * 50)
        
        steps = [
            ("Environment Check", self.check_environment),
            ("Backend Dependencies", self.install_backend_dependencies),
            ("Frontend Dependencies", self.install_frontend_dependencies),
            ("Backend Connection Test", self.test_backend_connection),
            ("Frontend Build", self.build_frontend),
            ("Vercel Deployment", self.deploy_to_vercel)
        ]
        
        for step_name, step_func in steps:
            self.log(f"\n📋 Step: {step_name}")
            if not step_func():
                self.log(f"❌ Deployment failed at: {step_name}", "ERROR")
                return False
        
        self.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!")
        self.log("Your Bizflow SME Nigeria app is now live!")
        return True

if __name__ == "__main__":
    deployment = BizflowDeployment()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--check-only":
        # Just check environment
        deployment.check_environment()
    else:
        # Run full deployment
        success = deployment.run_full_deployment()
        sys.exit(0 if success else 1)