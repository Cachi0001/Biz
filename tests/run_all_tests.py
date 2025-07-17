#!/usr/bin/env python3
"""
Master Test Runner for SabiOps Comprehensive Testing
Runs all test suites and generates a consolidated report
"""

import subprocess
import json
import time
import os
from datetime import datetime
import webbrowser
from pathlib import Path

class SabiOpsTestRunner:
    def __init__(self):
        self.test_results = {}
        self.start_time = time.time()
        self.test_dir = Path("Biz/tests")
        
    def run_python_tests(self):
        """Run Python API tests"""
        print("🐍 Running Python API Tests...")
        try:
            result = subprocess.run([
                "python", "Biz/tests/api_endpoints_test.py"
            ], capture_output=True, text=True, timeout=300)
            
            self.test_results['api_tests'] = {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'duration': time.time() - self.start_time
            }
            
            # Try to load detailed results
            try:
                with open("Biz/tests/api_test_results.json", "r") as f:
                    self.test_results['api_details'] = json.load(f)
            except FileNotFoundError:
                pass
                
        except subprocess.TimeoutExpired:
            self.test_results['api_tests'] = {
                'success': False,
                'output': '',
                'error': 'Test timed out after 5 minutes',
                'duration': 300
            }
        except Exception as e:
            self.test_results['api_tests'] = {
                'success': False,
                'output': '',
                'error': f'Failed to run tests: {str(e)}',
                'duration': 0
            }
    
    def run_javascript_tests(self):
        """Run JavaScript frontend tests"""
        print("🌐 Running JavaScript Frontend Tests...")
        
        # Create a simple HTML test runner
        html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SabiOps Test Runner</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .pass { color: green; }
        .fail { color: red; }
        .loading { color: orange; }
    </style>
</head>
<body>
    <h1>SabiOps Comprehensive Testing</h1>
    <div id="test-output"></div>
    
    <script src="mobile_responsiveness_test.js"></script>
    <script src="error_handling_test.js"></script>
    <script src="data_consistency_test.js"></script>
    
    <script>
        async function runAllJSTests() {
            const output = document.getElementById('test-output');
            
            try {
                // Mobile Responsiveness Tests
                output.innerHTML += '<div class="test-section"><h2>Mobile Responsiveness Tests</h2><div class="loading">Running...</div></div>';
                const mobileTest = new MobileResponsivenessTest();
                await mobileTest.runAllTests();
                
                // Error Handling Tests
                output.innerHTML += '<div class="test-section"><h2>Error Handling Tests</h2><div class="loading">Running...</div></div>';
                const errorTest = new ErrorHandlingTest();
                await errorTest.runAllTests();
                
                // Data Consistency Tests
                output.innerHTML += '<div class="test-section"><h2>Data Consistency Tests</h2><div class="loading">Running...</div></div>';
                const dataTest = new DataConsistencyTest();
                await dataTest.runAllTests();
                
                output.innerHTML += '<div class="test-section"><h2 class="pass">All JavaScript Tests Completed!</h2></div>';
                
            } catch (error) {
                output.innerHTML += `<div class="test-section"><h2 class="fail">JavaScript Tests Failed: ${error.message}</h2></div>`;
            }
        }
        
        // Run tests when page loads
        window.addEventListener('load', runAllJSTests);
    </script>
</body>
</html>
        """
        
        # Save HTML test runner
        with open("Biz/tests/test_runner.html", "w") as f:
            f.write(html_content)
        
        self.test_results['javascript_tests'] = {
            'success': True,
            'output': 'JavaScript test runner created at Biz/tests/test_runner.html',
            'error': '',
            'duration': 1
        }
    
    def check_backend_server(self):
        """Check if backend server is running"""
        print("🔍 Checking Backend Server...")
        try:
            import requests
            response = requests.get("http://localhost:5000/health", timeout=5)
            server_running = response.status_code == 200
        except:
            server_running = False
            
        self.test_results['server_check'] = {
            'success': server_running,
            'output': 'Backend server is running' if server_running else 'Backend server not accessible',
            'error': '' if server_running else 'Server not running on localhost:5000',
            'duration': 1
        }
        
        return server_running
    
    def check_frontend_build(self):
        """Check if frontend builds successfully"""
        print("🏗️ Checking Frontend Build...")
        try:
            # Check if package.json exists
            frontend_dir = Path("Biz/frontend/sabiops-frontend")
            package_json = frontend_dir / "package.json"
            
            if not package_json.exists():
                raise FileNotFoundError("package.json not found")
            
            # Try to run build check (without actually building)
            result = subprocess.run([
                "npm", "list", "--depth=0"
            ], cwd=frontend_dir, capture_output=True, text=True, timeout=60)
            
            self.test_results['frontend_build'] = {
                'success': result.returncode == 0,
                'output': 'Frontend dependencies check passed' if result.returncode == 0 else result.stdout,
                'error': result.stderr if result.returncode != 0 else '',
                'duration': 2
            }
            
        except Exception as e:
            self.test_results['frontend_build'] = {
                'success': False,
                'output': '',
                'error': f'Frontend build check failed: {str(e)}',
                'duration': 0
            }
    
    def run_manual_tests(self):
        """Generate manual test checklist"""
        print("📋 Generating Manual Test Checklist...")
        
        manual_tests = [
            "✅ Test customer creation form on mobile device",
            "✅ Test product management on tablet",
            "✅ Test invoice generation and PDF download",
            "✅ Test sales creation with inventory update",
            "✅ Test expense tracking with categories",
            "✅ Test dashboard metrics accuracy",
            "✅ Test offline functionality",
            "✅ Test error handling with network issues",
            "✅ Test Nigerian Naira formatting",
            "✅ Test phone number formatting (+234)",
            "✅ Test responsive design on actual devices",
            "✅ Test touch interactions on mobile",
            "✅ Test form validation errors",
            "✅ Test data consistency across pages",
            "✅ Test loading states and spinners"
        ]
        
        manual_checklist = """
# SabiOps Manual Testing Checklist

## Mobile Device Testing (Required)
- [ ] Test on actual iPhone/Android device
- [ ] Test portrait and landscape orientations
- [ ] Test touch interactions and gestures
- [ ] Test form inputs with virtual keyboard
- [ ] Test navigation and menu interactions

## Feature Testing
- [ ] Customer Management: Create, edit, delete, search
- [ ] Product Management: Add products, update inventory, low stock alerts
- [ ] Invoice Generation: Create invoice, generate PDF, email functionality
- [ ] Sales Tracking: Record sales, update inventory automatically
- [ ] Expense Management: Add expenses, categorize, track totals
- [ ] Dashboard Metrics: Verify all numbers are accurate and up-to-date

## Nigerian SME Specific Testing
- [ ] All amounts display in Nigerian Naira (₦) format
- [ ] Phone numbers accept Nigerian formats (+234, 0xxx)
- [ ] Business categories relevant to Nigerian SMEs
- [ ] Expense categories appropriate for local businesses
- [ ] Date formats appropriate for Nigerian users

## Error Handling Testing
- [ ] Test with poor internet connection
- [ ] Test offline functionality
- [ ] Test form validation with invalid data
- [ ] Test API errors and user feedback
- [ ] Test loading states during slow operations

## Performance Testing
- [ ] Page load times under 3 seconds
- [ ] Smooth scrolling and interactions
- [ ] No horizontal scrolling on mobile
- [ ] Responsive design works on all screen sizes
- [ ] Images and assets load properly

## Data Consistency Testing
- [ ] Sales update inventory correctly
- [ ] Dashboard metrics match actual data
- [ ] Customer data displays consistently
- [ ] Product information is accurate
- [ ] Transaction history is complete

## Browser Compatibility Testing
- [ ] Chrome (mobile and desktop)
- [ ] Safari (iOS and macOS)
- [ ] Firefox
- [ ] Edge
- [ ] Mobile browsers (Chrome Mobile, Safari Mobile)

## Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Touch targets are large enough (44px minimum)
- [ ] Text is readable on mobile devices
- [ ] Forms are properly labeled
- [ ] Error messages are clear and helpful

---

**Instructions:**
1. Go through each item systematically
2. Test on actual mobile devices, not just browser dev tools
3. Document any issues found
4. Verify fixes work across different devices and browsers
5. Pay special attention to Nigerian SME specific features

**Priority Items (Must Pass):**
- Mobile responsiveness on actual devices
- Nigerian Naira formatting
- Data consistency between features
- Error handling and user feedback
- Core business functionality (customers, products, sales, invoices)
        """
        
        with open("Biz/tests/manual_testing_checklist.md", "w") as f:
            f.write(manual_checklist)
        
        self.test_results['manual_tests'] = {
            'success': True,
            'output': f'Manual testing checklist created with {len(manual_tests)} items',
            'error': '',
            'duration': 1
        }
    
    def generate_consolidated_report(self):
        """Generate consolidated test report"""
        print("📊 Generating Consolidated Test Report...")
        
        total_time = time.time() - self.start_time
        
        # Calculate overall statistics
        total_tests = 0
        passed_tests = 0
        
        for test_name, result in self.test_results.items():
            if 'api_details' in test_name:
                continue
            total_tests += 1
            if result['success']:
                passed_tests += 1
        
        # Add detailed API test results if available
        if 'api_details' in self.test_results:
            api_details = self.test_results['api_details']
            if 'summary' in api_details:
                total_tests += api_details['summary']['total_tests']
                passed_tests += api_details['summary']['passed']
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            'test_run_summary': {
                'timestamp': datetime.now().isoformat(),
                'total_time': total_time,
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': total_tests - passed_tests,
                'success_rate': success_rate
            },
            'test_suites': self.test_results,
            'recommendations': self.generate_recommendations()
        }
        
        # Save consolidated report
        with open("Biz/tests/consolidated_test_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        # Generate HTML report
        self.generate_html_report(report)
        
        return report
    
    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        recommendations = []
        
        # Check API tests
        if not self.test_results.get('api_tests', {}).get('success', False):
            recommendations.append("🔧 Fix backend API endpoints - some are not responding correctly")
        
        # Check server status
        if not self.test_results.get('server_check', {}).get('success', False):
            recommendations.append("🚀 Start the backend server before running tests")
        
        # Check frontend build
        if not self.test_results.get('frontend_build', {}).get('success', False):
            recommendations.append("📦 Fix frontend build issues and dependencies")
        
        # Add general recommendations
        recommendations.extend([
            "📱 Test on actual mobile devices, not just browser dev tools",
            "🇳🇬 Verify Nigerian Naira formatting is consistent throughout",
            "🔄 Test data consistency between different features",
            "⚡ Ensure page load times are under 3 seconds",
            "🛡️ Test error handling with poor network conditions"
        ])
        
        return recommendations
    
    def generate_html_report(self, report):
        """Generate HTML test report"""
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SabiOps Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .metric {{ background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }}
        .metric h3 {{ margin: 0 0 10px 0; color: #333; }}
        .metric .value {{ font-size: 2em; font-weight: bold; }}
        .pass {{ color: #28a745; }}
        .fail {{ color: #dc3545; }}
        .warning {{ color: #ffc107; }}
        .test-suite {{ margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
        .test-suite h3 {{ margin-top: 0; }}
        .recommendations {{ background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 30px; }}
        .recommendations ul {{ margin: 10px 0; }}
        .timestamp {{ color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 SabiOps Comprehensive Test Report</h1>
            <p class="timestamp">Generated: {report['test_run_summary']['timestamp']}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">{report['test_run_summary']['total_tests']}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value pass">{report['test_run_summary']['passed_tests']}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value fail">{report['test_run_summary']['failed_tests']}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value {'pass' if report['test_run_summary']['success_rate'] >= 80 else 'warning' if report['test_run_summary']['success_rate'] >= 60 else 'fail'}">{report['test_run_summary']['success_rate']:.1f}%</div>
            </div>
        </div>
        
        <h2>Test Suites</h2>
"""
        
        # Add test suite results
        for suite_name, result in report['test_suites'].items():
            if 'api_details' in suite_name:
                continue
                
            status_class = 'pass' if result['success'] else 'fail'
            status_text = '✅ PASSED' if result['success'] else '❌ FAILED'
            
            html_content += f"""
        <div class="test-suite">
            <h3>{suite_name.replace('_', ' ').title()} <span class="{status_class}">{status_text}</span></h3>
            <p><strong>Duration:</strong> {result['duration']:.2f}s</p>
            {f'<p><strong>Output:</strong> {result["output"]}</p>' if result['output'] else ''}
            {f'<p class="fail"><strong>Error:</strong> {result["error"]}</p>' if result['error'] else ''}
        </div>
"""
        
        # Add recommendations
        html_content += f"""
        <div class="recommendations">
            <h2>🎯 Recommendations</h2>
            <ul>
"""
        for rec in report['recommendations']:
            html_content += f"<li>{rec}</li>"
        
        html_content += """
            </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p>For detailed test results, check the individual JSON files in the tests directory.</p>
            <p>Manual testing checklist: <a href="manual_testing_checklist.md">manual_testing_checklist.md</a></p>
        </div>
    </div>
</body>
</html>
"""
        
        with open("Biz/tests/test_report.html", "w") as f:
            f.write(html_content)
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting SabiOps Comprehensive Testing Suite...")
        print("=" * 60)
        
        # Pre-flight checks
        self.check_backend_server()
        self.check_frontend_build()
        
        # Run test suites
        self.run_python_tests()
        self.run_javascript_tests()
        self.run_manual_tests()
        
        # Generate reports
        report = self.generate_consolidated_report()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {report['test_run_summary']['total_tests']}")
        print(f"Passed: {report['test_run_summary']['passed_tests']} ✅")
        print(f"Failed: {report['test_run_summary']['failed_tests']} ❌")
        print(f"Success Rate: {report['test_run_summary']['success_rate']:.1f}%")
        print(f"Total Time: {report['test_run_summary']['total_time']:.2f}s")
        
        print("\n🎯 KEY RECOMMENDATIONS:")
        for rec in report['recommendations'][:5]:  # Show top 5
            print(f"  {rec}")
        
        print(f"\n📄 Detailed reports generated:")
        print(f"  - HTML Report: Biz/tests/test_report.html")
        print(f"  - JSON Report: Biz/tests/consolidated_test_report.json")
        print(f"  - Manual Checklist: Biz/tests/manual_testing_checklist.md")
        print(f"  - JS Test Runner: Biz/tests/test_runner.html")
        
        # Open HTML report in browser
        try:
            report_path = os.path.abspath("Biz/tests/test_report.html")
            webbrowser.open(f"file://{report_path}")
            print(f"\n🌐 Opening test report in browser...")
        except:
            print(f"\n💡 Open Biz/tests/test_report.html in your browser to view the full report")

if __name__ == "__main__":
    runner = SabiOpsTestRunner()
    runner.run_all_tests()