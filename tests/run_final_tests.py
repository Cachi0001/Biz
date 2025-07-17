#!/usr/bin/env python3
"""
Final Integration and Deployment Test Runner
Orchestrates all final testing phases for SabiOps deployment readiness
"""

import subprocess
import sys
import json
import time
from datetime import datetime
import os

class FinalTestRunner:
    def __init__(self):
        self.test_results = {}
        self.overall_success = True
        
    def run_command(self, command, test_name, timeout=300):
        """Run a command and capture results"""
        print(f"\n🚀 Running {test_name}...")
        print(f"Command: {command}")
        print("-" * 50)
        
        try:
            start_time = time.time()
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            end_time = time.time()
            
            duration = end_time - start_time
            success = result.returncode == 0
            
            self.test_results[test_name] = {
                "success": success,
                "duration": duration,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "timestamp": datetime.now().isoformat()
            }
            
            if success:
                print(f"✅ {test_name} PASSED ({duration:.1f}s)")
            else:
                print(f"❌ {test_name} FAILED ({duration:.1f}s)")
                print(f"Error: {result.stderr}")
                self.overall_success = False
            
            # Print stdout if it contains useful information
            if result.stdout and len(result.stdout.strip()) > 0:
                print("Output:")
                print(result.stdout)
            
            return success
            
        except subprocess.TimeoutExpired:
            print(f"❌ {test_name} TIMED OUT after {timeout}s")
            self.test_results[test_name] = {
                "success": False,
                "duration": timeout,
                "error": "Timeout",
                "timestamp": datetime.now().isoformat()
            }
            self.overall_success = False
            return False
            
        except Exception as e:
            print(f"❌ {test_name} ERROR: {str(e)}")
            self.test_results[test_name] = {
                "success": False,
                "duration": 0,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.overall_success = False
            return False
    
    def check_backend_status(self):
        """Check if backend is running"""
        print("\n🔍 Checking Backend Status...")
        
        try:
            import requests
            response = requests.get("http://localhost:5000/health", timeout=10)
            if response.status_code == 200:
                print("✅ Backend is running and accessible")
                return True
            else:
                print(f"❌ Backend returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend not accessible: {str(e)}")
            print("💡 Make sure to start the backend server before running tests")
            return False
    
    def run_backend_tests(self):
        """Run backend API tests"""
        print("\n📡 Running Backend API Tests...")
        
        # Check if backend test file exists
        if not os.path.exists("Biz/tests/validate_tests.py"):
            print("❌ Backend test file not found")
            return False
        
        return self.run_command(
            "cd Biz && python tests/validate_tests.py",
            "Backend API Tests",
            timeout=120
        )
    
    def run_integration_tests(self):
        """Run comprehensive integration tests"""
        print("\n🔗 Running Integration Tests...")
        
        return self.run_command(
            "cd Biz && python tests/final_integration_test.py",
            "Integration Tests",
            timeout=180
        )
    
    def run_performance_tests(self):
        """Run performance tests"""
        print("\n⚡ Running Performance Tests...")
        
        return self.run_command(
            "cd Biz && python tests/performance_test.py",
            "Performance Tests",
            timeout=300
        )
    
    def run_frontend_build_test(self):
        """Test frontend build process"""
        print("\n🏗️  Testing Frontend Build...")
        
        # Check if frontend directory exists
        frontend_path = "Biz/frontend/sabiops-frontend"
        if not os.path.exists(frontend_path):
            print("❌ Frontend directory not found")
            return False
        
        # Test npm install
        install_success = self.run_command(
            f"cd {frontend_path} && npm install",
            "Frontend Dependencies Install",
            timeout=180
        )
        
        if not install_success:
            return False
        
        # Test build
        return self.run_command(
            f"cd {frontend_path} && npm run build",
            "Frontend Build",
            timeout=120
        )
    
    def validate_nigerian_sme_features(self):
        """Validate Nigerian SME specific features"""
        print("\n🇳🇬 Validating Nigerian SME Features...")
        
        # Check for Nigerian formatting utilities
        formatting_file = "Biz/frontend/sabiops-frontend/src/utils/formatting.js"
        if os.path.exists(formatting_file):
            print("✅ Nigerian formatting utilities found")
        else:
            print("❌ Nigerian formatting utilities missing")
            self.overall_success = False
            return False
        
        # Check for Nigerian business categories
        validation_file = "Biz/backend/subscription_plans_spec.py"
        if os.path.exists(validation_file):
            print("✅ Nigerian business specifications found")
        else:
            print("❌ Nigerian business specifications missing")
            self.overall_success = False
            return False
        
        print("✅ Nigerian SME features validation passed")
        return True
    
    def run_mobile_responsiveness_check(self):
        """Check mobile responsiveness implementation"""
        print("\n📱 Checking Mobile Responsiveness...")
        
        # Check for mobile-specific components
        mobile_nav = "Biz/frontend/sabiops-frontend/src/components/dashboard/MobileNavigation.jsx"
        if os.path.exists(mobile_nav):
            print("✅ Mobile navigation component found")
        else:
            print("❌ Mobile navigation component missing")
            self.overall_success = False
            return False
        
        # Check for responsive utilities
        responsive_test = "Biz/frontend/sabiops-frontend/src/utils/mobileResponsivenessTest.js"
        if os.path.exists(responsive_test):
            print("✅ Mobile responsiveness test utilities found")
        else:
            print("❌ Mobile responsiveness test utilities missing")
            self.overall_success = False
            return False
        
        print("✅ Mobile responsiveness check passed")
        return True
    
    def validate_data_consistency(self):
        """Validate data consistency across features"""
        print("\n🔄 Validating Data Consistency...")
        
        # Check for data integrity components
        data_integrity = "Biz/frontend/sabiops-frontend/src/components/data/DataIntegrityPanel.jsx"
        if os.path.exists(data_integrity):
            print("✅ Data integrity panel found")
        else:
            print("❌ Data integrity panel missing")
            self.overall_success = False
            return False
        
        # Check for database migrations
        migrations_dir = "Biz/database_migrations"
        if os.path.exists(migrations_dir) and os.listdir(migrations_dir):
            print("✅ Database migrations found")
        else:
            print("❌ Database migrations missing")
            self.overall_success = False
            return False
        
        print("✅ Data consistency validation passed")
        return True
    
    def run_deployment_readiness_check(self):
        """Check deployment readiness"""
        print("\n🚀 Checking Deployment Readiness...")
        
        # Check for deployment scripts
        deploy_script = "Biz/deploy.sh"
        if os.path.exists(deploy_script):
            print("✅ Deployment script found")
        else:
            print("❌ Deployment script missing")
            self.overall_success = False
            return False
        
        # Check for environment configuration
        env_example = "Biz/.env.example"
        if os.path.exists(env_example):
            print("✅ Environment configuration template found")
        else:
            print("❌ Environment configuration template missing")
            self.overall_success = False
            return False
        
        # Check for production configuration files
        required_configs = [
            "Biz/frontend/sabiops-frontend/package.json",
            "Biz/backend/sabiops-backend/requirements.txt"
        ]
        
        for config in required_configs:
            if os.path.exists(config):
                print(f"✅ {os.path.basename(config)} found")
            else:
                print(f"❌ {os.path.basename(config)} missing")
                self.overall_success = False
                return False
        
        print("✅ Deployment readiness check passed")
        return True
    
    def generate_final_report(self):
        """Generate comprehensive final report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results.values() if r['success']])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            "final_test_summary": {
                "total_test_suites": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{success_rate:.1f}%",
                "overall_success": self.overall_success,
                "timestamp": datetime.now().isoformat()
            },
            "test_results": self.test_results,
            "deployment_readiness": self.overall_success,
            "recommendations": []
        }
        
        # Add recommendations based on results
        if not self.overall_success:
            failed_tests = [name for name, result in self.test_results.items() if not result['success']]
            report["recommendations"].append(f"Fix failing tests: {', '.join(failed_tests)}")
            report["recommendations"].append("System not ready for production deployment")
        else:
            report["recommendations"].append("All tests passed - system ready for production deployment")
            report["recommendations"].append("Consider setting up monitoring and logging for production")
        
        # Performance recommendations
        performance_results = [r for r in self.test_results.values() if 'Performance' in str(r)]
        if performance_results:
            avg_duration = sum([r.get('duration', 0) for r in performance_results]) / len(performance_results)
            if avg_duration > 60:
                report["recommendations"].append("Performance tests taking longer than expected - consider optimization")
        
        return report
    
    def run_all_final_tests(self):
        """Run complete final testing suite"""
        print("🎯 SABIOPS FINAL INTEGRATION AND DEPLOYMENT TESTING")
        print("=" * 70)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        start_time = time.time()
        
        # Phase 1: Pre-flight checks
        print("\n📋 PHASE 1: PRE-FLIGHT CHECKS")
        if not self.check_backend_status():
            print("❌ Backend not running. Please start the backend server first.")
            return self.generate_final_report()
        
        # Phase 2: Feature validation
        print("\n📋 PHASE 2: FEATURE VALIDATION")
        self.validate_nigerian_sme_features()
        self.run_mobile_responsiveness_check()
        self.validate_data_consistency()
        
        # Phase 3: Functional testing
        print("\n📋 PHASE 3: FUNCTIONAL TESTING")
        self.run_backend_tests()
        self.run_integration_tests()
        
        # Phase 4: Performance testing
        print("\n📋 PHASE 4: PERFORMANCE TESTING")
        self.run_performance_tests()
        
        # Phase 5: Build and deployment testing
        print("\n📋 PHASE 5: BUILD AND DEPLOYMENT TESTING")
        self.run_frontend_build_test()
        self.run_deployment_readiness_check()
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        print(f"\n⏱️  Total testing time: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
        
        # Generate and save final report
        report = self.generate_final_report()
        
        with open('final_deployment_test_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print final summary
        print("\n" + "=" * 70)
        print("📊 FINAL TEST SUMMARY")
        print("=" * 70)
        print(f"Total Test Suites: {report['final_test_summary']['total_test_suites']}")
        print(f"Passed: {report['final_test_summary']['passed']} ✅")
        print(f"Failed: {report['final_test_summary']['failed']} ❌")
        print(f"Success Rate: {report['final_test_summary']['success_rate']}")
        print(f"Deployment Ready: {'YES' if report['deployment_readiness'] else 'NO'}")
        
        if report["recommendations"]:
            print("\n📋 FINAL RECOMMENDATIONS:")
            for rec in report["recommendations"]:
                print(f"  • {rec}")
        
        print(f"\n📄 Detailed report saved to: final_deployment_test_report.json")
        
        if self.overall_success:
            print("\n🎉 ALL TESTS PASSED - SABIOPS IS READY FOR DEPLOYMENT! 🎉")
        else:
            print("\n⚠️  SOME TESTS FAILED - REVIEW AND FIX BEFORE DEPLOYMENT")
        
        return report

if __name__ == "__main__":
    runner = FinalTestRunner()
    report = runner.run_all_final_tests()
    
    # Exit with appropriate code
    sys.exit(0 if runner.overall_success else 1)