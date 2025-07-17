#!/usr/bin/env python3
"""
Deployment Readiness Check for SabiOps
Validates all components are ready for production deployment
"""

import os
import json
import subprocess
import sys
from datetime import datetime
import requests
import time

class DeploymentReadinessChecker:
    def __init__(self):
        self.results = {}
        self.overall_ready = True
        
    def log_check(self, check_name, success, message="", details=None):
        """Log check results"""
        result = {
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.results[check_name] = result
        
        if not success:
            self.overall_ready = False
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {check_name} - {message}")
        
    def check_file_exists(self, file_path, description):
        """Check if a required file exists"""
        exists = os.path.exists(file_path)
        self.log_check(
            f"File Check - {description}",
            exists,
            f"{'Found' if exists else 'Missing'}: {file_path}"
        )
        return exists
    
    def check_backend_structure(self):
        """Check backend file structure"""
        print("\n🏗️  Checking Backend Structure...")
        
        required_files = [
            ("backend/sabiops-backend/api/index.py", "Main API entry point"),
            ("backend/sabiops-backend/vercel.json", "Vercel configuration"),
            ("backend/sabiops-backend/requirements.txt", "Python dependencies"),
            ("backend/sabiops-backend/src/services/supabase_service.py", "Supabase service"),
            ("backend/sabiops-backend/src/routes/auth.py", "Authentication routes"),
            ("backend/sabiops-backend/src/routes/customer.py", "Customer routes"),
            ("backend/sabiops-backend/src/routes/product.py", "Product routes"),
            ("backend/sabiops-backend/src/routes/sales.py", "Sales routes"),
            ("backend/sabiops-backend/src/routes/expense.py", "Expense routes"),
            ("backend/sabiops-backend/src/routes/dashboard.py", "Dashboard routes"),
        ]
        
        all_exist = True
        for file_path, description in required_files:
            if not self.check_file_exists(file_path, description):
                all_exist = False
        
        return all_exist
    
    def check_frontend_structure(self):
        """Check frontend file structure"""
        print("\n🎨 Checking Frontend Structure...")
        
        required_files = [
            ("frontend/sabiops-frontend/package.json", "Package configuration"),
            ("frontend/sabiops-frontend/src/App.jsx", "Main App component"),
            ("frontend/sabiops-frontend/src/pages/Dashboard.jsx", "Dashboard page"),
            ("frontend/sabiops-frontend/src/pages/Login.jsx", "Login page"),
            ("frontend/sabiops-frontend/src/pages/Register.jsx", "Register page"),
            ("frontend/sabiops-frontend/src/components/dashboard/ModernHeader.jsx", "Modern header"),
            ("frontend/sabiops-frontend/src/utils/formatting.js", "Nigerian formatting"),
            ("frontend/sabiops-frontend/src/utils/errorHandling.js", "Error handling"),
            ("frontend/sabiops-frontend/src/services/api.js", "API service"),
        ]
        
        all_exist = True
        for file_path, description in required_files:
            if not self.check_file_exists(file_path, description):
                all_exist = False
        
        return all_exist
    
    def check_import_structure(self):
        """Check for problematic relative imports"""
        print("\n🔗 Checking Import Structure...")
        
        route_files = [
            "backend/sabiops-backend/src/routes/sales.py",
            "backend/sabiops-backend/src/routes/expense.py",
            "backend/sabiops-backend/src/routes/dashboard.py",
            "backend/sabiops-backend/src/routes/product.py",
        ]
        
        problematic_imports = []
        
        for file_path in route_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check for relative imports
                    if 'from ..' in content:
                        problematic_imports.append(file_path)
                except Exception as e:
                    print(f"⚠️  Could not read {file_path}: {e}")
        
        if problematic_imports:
            self.log_check(
                "Import Structure",
                False,
                f"Found relative imports in {len(problematic_imports)} files",
                {"files": problematic_imports}
            )
            return False
        else:
            self.log_check(
                "Import Structure",
                True,
                "All imports use absolute paths"
            )
            return True
    
    def check_nigerian_sme_features(self):
        """Check Nigerian SME specific features"""
        print("\n🇳🇬 Checking Nigerian SME Features...")
        
        # Check formatting utilities
        formatting_file = "frontend/sabiops-frontend/src/utils/formatting.js"
        if os.path.exists(formatting_file):
            try:
                with open(formatting_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                required_functions = ['formatNaira', 'formatPhone', 'getBusinessCategories', 'getExpenseCategories']
                missing_functions = []
                
                for func in required_functions:
                    if func not in content:
                        missing_functions.append(func)
                
                if missing_functions:
                    self.log_check(
                        "Nigerian SME Features",
                        False,
                        f"Missing functions: {', '.join(missing_functions)}"
                    )
                    return False
                else:
                    self.log_check(
                        "Nigerian SME Features",
                        True,
                        "All Nigerian SME formatting functions present"
                    )
                    return True
            except Exception as e:
                self.log_check(
                    "Nigerian SME Features",
                    False,
                    f"Error reading formatting file: {e}"
                )
                return False
        else:
            self.log_check(
                "Nigerian SME Features",
                False,
                "Formatting utilities file not found"
            )
            return False
    
    def check_mobile_responsiveness(self):
        """Check mobile responsiveness components"""
        print("\n📱 Checking Mobile Responsiveness...")
        
        mobile_components = [
            "frontend/sabiops-frontend/src/components/dashboard/MobileNavigation.jsx",
            "frontend/sabiops-frontend/src/utils/mobileResponsivenessTest.js",
        ]
        
        all_exist = True
        for component in mobile_components:
            if not os.path.exists(component):
                all_exist = False
                print(f"❌ Missing: {component}")
        
        if all_exist:
            self.log_check(
                "Mobile Responsiveness",
                True,
                "Mobile components present"
            )
        else:
            self.log_check(
                "Mobile Responsiveness",
                False,
                "Missing mobile components"
            )
        
        return all_exist
    
    def check_environment_configuration(self):
        """Check environment configuration"""
        print("\n⚙️  Checking Environment Configuration...")
        
        # Check for environment files
        env_files = [
            "backend/sabiops-backend/.env.example",
            "frontend/sabiops-frontend/.env.example",
        ]
        
        config_files = [
            "backend/sabiops-backend/vercel.json",
        ]
        
        all_files_exist = True
        
        for file_path in env_files + config_files:
            if not os.path.exists(file_path):
                all_files_exist = False
                print(f"❌ Missing: {file_path}")
        
        # Check Vercel configuration
        vercel_config = "backend/sabiops-backend/vercel.json"
        if os.path.exists(vercel_config):
            try:
                with open(vercel_config, 'r') as f:
                    config = json.load(f)
                
                # Check for required Vercel configuration
                if ('builds' in config and 'routes' in config and 
                    'api/index.py' in str(config)):
                    self.log_check(
                        "Vercel Configuration",
                        True,
                        "Vercel config properly structured"
                    )
                else:
                    self.log_check(
                        "Vercel Configuration",
                        False,
                        "Vercel config missing required settings"
                    )
                    all_files_exist = False
            except Exception as e:
                self.log_check(
                    "Vercel Configuration",
                    False,
                    f"Error reading Vercel config: {e}"
                )
                all_files_exist = False
        
        return all_files_exist
    
    def check_cors_configuration(self):
        """Check CORS configuration in backend"""
        print("\n🌐 Checking CORS Configuration...")
        
        api_file = "backend/sabiops-backend/api/index.py"
        if os.path.exists(api_file):
            try:
                with open(api_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for CORS configuration
                if 'CORS(' in content and 'sabiops.vercel.app' in content:
                    self.log_check(
                        "CORS Configuration",
                        True,
                        "CORS properly configured for production"
                    )
                    return True
                else:
                    self.log_check(
                        "CORS Configuration",
                        False,
                        "CORS not properly configured"
                    )
                    return False
            except Exception as e:
                self.log_check(
                    "CORS Configuration",
                    False,
                    f"Error reading API file: {e}"
                )
                return False
        else:
            self.log_check(
                "CORS Configuration",
                False,
                "API file not found"
            )
            return False
    
    def test_frontend_build(self):
        """Test frontend build process"""
        print("\n🏗️  Testing Frontend Build...")
        
        frontend_path = "frontend/sabiops-frontend"
        if not os.path.exists(frontend_path):
            self.log_check(
                "Frontend Build",
                False,
                "Frontend directory not found"
            )
            return False
        
        try:
            # Check if package.json exists
            package_json = os.path.join(frontend_path, "package.json")
            if not os.path.exists(package_json):
                self.log_check(
                    "Frontend Build",
                    False,
                    "package.json not found"
                )
                return False
            
            # Try to run build (dry run check)
            print("  Checking build configuration...")
            
            with open(package_json, 'r') as f:
                package_data = json.load(f)
            
            # Check for required scripts
            scripts = package_data.get('scripts', {})
            if 'build' not in scripts:
                self.log_check(
                    "Frontend Build",
                    False,
                    "Build script not found in package.json"
                )
                return False
            
            # Check for required dependencies
            dependencies = package_data.get('dependencies', {})
            required_deps = ['react', 'react-dom']
            missing_deps = [dep for dep in required_deps if dep not in dependencies]
            
            if missing_deps:
                self.log_check(
                    "Frontend Build",
                    False,
                    f"Missing dependencies: {', '.join(missing_deps)}"
                )
                return False
            
            self.log_check(
                "Frontend Build",
                True,
                "Frontend build configuration valid"
            )
            return True
            
        except Exception as e:
            self.log_check(
                "Frontend Build",
                False,
                f"Error checking build: {e}"
            )
            return False
    
    def check_data_consistency_components(self):
        """Check data consistency components"""
        print("\n🔄 Checking Data Consistency Components...")
        
        consistency_files = [
            "frontend/sabiops-frontend/src/components/data/DataIntegrityPanel.jsx",
            "backend/sabiops-backend/src/services/data_consistency_service.py",
            "backend/sabiops-backend/src/utils/business_operations.py",
        ]
        
        all_exist = True
        for file_path in consistency_files:
            if not os.path.exists(file_path):
                all_exist = False
                print(f"❌ Missing: {file_path}")
        
        if all_exist:
            self.log_check(
                "Data Consistency",
                True,
                "Data consistency components present"
            )
        else:
            self.log_check(
                "Data Consistency",
                False,
                "Missing data consistency components"
            )
        
        return all_exist
    
    def run_all_checks(self):
        """Run all deployment readiness checks"""
        print("🎯 SABIOPS DEPLOYMENT READINESS CHECK")
        print("=" * 50)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        
        start_time = time.time()
        
        # Run all checks
        checks = [
            self.check_backend_structure,
            self.check_frontend_structure,
            self.check_import_structure,
            self.check_cors_configuration,
            self.check_nigerian_sme_features,
            self.check_mobile_responsiveness,
            self.check_environment_configuration,
            self.test_frontend_build,
            self.check_data_consistency_components,
        ]
        
        for check in checks:
            try:
                check()
            except Exception as e:
                print(f"❌ Error running check: {e}")
                self.overall_ready = False
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate report
        return self.generate_report(duration)
    
    def generate_report(self, duration):
        """Generate deployment readiness report"""
        total_checks = len(self.results)
        passed_checks = len([r for r in self.results.values() if r['success']])
        failed_checks = total_checks - passed_checks
        
        success_rate = (passed_checks / total_checks * 100) if total_checks > 0 else 0
        
        report = {
            "deployment_readiness": {
                "ready_for_deployment": self.overall_ready,
                "total_checks": total_checks,
                "passed": passed_checks,
                "failed": failed_checks,
                "success_rate": f"{success_rate:.1f}%",
                "check_duration": f"{duration:.1f}s",
                "timestamp": datetime.now().isoformat()
            },
            "check_results": self.results,
            "recommendations": []
        }
        
        # Add recommendations
        if not self.overall_ready:
            failed_checks = [name for name, result in self.results.items() if not result['success']]
            report["recommendations"].append(f"Fix failing checks: {', '.join(failed_checks)}")
            report["recommendations"].append("System not ready for production deployment")
        else:
            report["recommendations"].append("All checks passed - system ready for deployment")
            report["recommendations"].append("Proceed with production deployment")
        
        # Specific recommendations based on failures
        for check_name, result in self.results.items():
            if not result['success']:
                if 'Import Structure' in check_name:
                    report["recommendations"].append("Run 'python fix_imports.py' to fix import issues")
                elif 'CORS' in check_name:
                    report["recommendations"].append("Update CORS configuration in api/index.py")
                elif 'Nigerian SME' in check_name:
                    report["recommendations"].append("Implement missing Nigerian SME formatting functions")
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 DEPLOYMENT READINESS SUMMARY")
        print("=" * 50)
        print(f"Ready for Deployment: {'YES ✅' if self.overall_ready else 'NO ❌'}")
        print(f"Total Checks: {total_checks}")
        print(f"Passed: {passed_checks} ✅")
        print(f"Failed: {failed_checks} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Check Duration: {duration:.1f}s")
        
        if report["recommendations"]:
            print("\n📋 RECOMMENDATIONS:")
            for rec in report["recommendations"]:
                print(f"  • {rec}")
        
        return report

def main():
    """Main function"""
    checker = DeploymentReadinessChecker()
    report = checker.run_all_checks()
    
    # Save report
    with open('deployment_readiness_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: deployment_readiness_report.json")
    
    # Exit with appropriate code
    sys.exit(0 if checker.overall_ready else 1)

if __name__ == "__main__":
    main()