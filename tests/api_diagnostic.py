#!/usr/bin/env python3
"""
API Diagnostic Tool for SabiOps Backend
Tests and diagnoses API endpoint issues
"""

import requests
import json
import sys
from datetime import datetime

class APIDiagnostic:
    def __init__(self, base_url="https://sabiops-backend.vercel.app/api"):
        self.base_url = base_url
        self.results = []
        
    def log_test(self, endpoint, success, status_code, response_type, message=""):
        """Log test results"""
        result = {
            "endpoint": endpoint,
            "success": success,
            "status_code": status_code,
            "response_type": response_type,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {endpoint} - {status_code} ({response_type}) - {message}")
    
    def test_endpoint(self, endpoint, method="GET", data=None, headers=None):
        """Test a single endpoint"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                response = requests.request(method, url, json=data, headers=headers, timeout=10)
            
            # Determine response type
            content_type = response.headers.get('content-type', '').lower()
            
            if 'application/json' in content_type:
                response_type = "JSON"
                try:
                    json_data = response.json()
                    success = response.status_code < 400
                    message = json_data.get('message', 'OK') if isinstance(json_data, dict) else 'JSON Response'
                except:
                    success = False
                    message = "Invalid JSON"
            elif 'text/html' in content_type:
                response_type = "HTML"
                success = False
                message = "Returning HTML instead of JSON (likely 404/error page)"
            elif 'text/plain' in content_type:
                response_type = "TEXT"
                success = response.status_code < 400
                message = "Plain text response"
            else:
                response_type = "UNKNOWN"
                success = response.status_code < 400
                message = f"Content-Type: {content_type}"
            
            self.log_test(endpoint, success, response.status_code, response_type, message)
            return success, response
            
        except requests.exceptions.Timeout:
            self.log_test(endpoint, False, 0, "TIMEOUT", "Request timed out")
            return False, None
        except requests.exceptions.ConnectionError:
            self.log_test(endpoint, False, 0, "CONNECTION_ERROR", "Could not connect to server")
            return False, None
        except Exception as e:
            self.log_test(endpoint, False, 0, "ERROR", str(e))
            return False, None
    
    def run_diagnostics(self):
        """Run comprehensive API diagnostics"""
        print("🔍 SABIOPS API DIAGNOSTIC")
        print("=" * 50)
        print(f"Testing: {self.base_url}")
        print("=" * 50)
        
        # Test basic connectivity
        print("\n📡 Testing Basic Connectivity...")
        self.test_endpoint("/")
        self.test_endpoint("/health")
        
        # Test core endpoints
        print("\n🏗️  Testing Core Endpoints...")
        endpoints = [
            "/customers/",
            "/products/",
            "/sales/",
            "/expenses/",
            "/invoices/",
            "/dashboard/metrics",
            "/notifications/",
        ]
        
        for endpoint in endpoints:
            self.test_endpoint(endpoint)
        
        # Test with authentication (if we had a token)
        print("\n🔐 Testing Authentication Endpoints...")
        auth_endpoints = [
            "/auth/register",
            "/auth/login",
        ]
        
        for endpoint in auth_endpoints:
            self.test_endpoint(endpoint, method="POST", data={
                "email": "test@example.com",
                "password": "testpassword"
            })
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate diagnostic report"""
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Categorize issues
        html_responses = len([r for r in self.results if r['response_type'] == 'HTML'])
        connection_errors = len([r for r in self.results if r['response_type'] == 'CONNECTION_ERROR'])
        timeouts = len([r for r in self.results if r['response_type'] == 'TIMEOUT'])
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{success_rate:.1f}%",
                "timestamp": datetime.now().isoformat()
            },
            "issues": {
                "html_responses": html_responses,
                "connection_errors": connection_errors,
                "timeouts": timeouts
            },
            "results": self.results,
            "recommendations": []
        }
        
        # Add recommendations
        if html_responses > 0:
            report["recommendations"].append(f"{html_responses} endpoints returning HTML instead of JSON - check route configuration")
        
        if connection_errors > 0:
            report["recommendations"].append("Connection errors detected - check if backend is deployed and accessible")
        
        if success_rate < 50:
            report["recommendations"].append("Critical: Most endpoints failing - backend may not be properly deployed")
        elif success_rate < 80:
            report["recommendations"].append("Some endpoints failing - check individual route configurations")
        else:
            report["recommendations"].append("Most endpoints working - minor issues to resolve")
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 DIAGNOSTIC SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if html_responses > 0:
            print(f"HTML Responses: {html_responses} (should be JSON)")
        if connection_errors > 0:
            print(f"Connection Errors: {connection_errors}")
        if timeouts > 0:
            print(f"Timeouts: {timeouts}")
        
        if report["recommendations"]:
            print("\n📋 RECOMMENDATIONS:")
            for rec in report["recommendations"]:
                print(f"  • {rec}")
        
        return report

def main():
    """Main function"""
    # Test both local and production
    print("Testing Production API...")
    prod_diagnostic = APIDiagnostic("https://sabiops-backend.vercel.app/api")
    prod_report = prod_diagnostic.run_diagnostics()
    
    # Save report
    with open('api_diagnostic_report.json', 'w') as f:
        json.dump(prod_report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: api_diagnostic_report.json")
    
    # Exit with appropriate code
    success_rate = float(prod_report["summary"]["success_rate"].replace('%', ''))
    sys.exit(0 if success_rate >= 80 else 1)

if __name__ == "__main__":
    main()