#!/usr/bin/env python3
"""
Test Runner for Analytics Implementation
Runs all analytics-related unit tests and provides a summary
"""

import unittest
import sys
import os
from io import StringIO

def run_analytics_tests():
    """Run all analytics tests and return results"""
    
    # Add the src directory to the path
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    test_modules = [
        'tests.test_analytics_service',
        'tests.test_subscription_decorators'
    ]
    
    for module_name in test_modules:
        try:
            module_suite = loader.loadTestsFromName(module_name)
            suite.addTest(module_suite)
            print(f"✓ Loaded tests from {module_name}")
        except ImportError as e:
            print(f"✗ Failed to load tests from {module_name}: {e}")
            continue
    
    stream = StringIO()
    runner = unittest.TextTestRunner(
        stream=stream,
        verbosity=2,
        buffer=True
    )
    
    print("\n" + "="*60)
    print("RUNNING ANALYTICS IMPLEMENTATION TESTS")
    print("="*60)
    
    result = runner.run(suite)
    
    output = stream.getvalue()
    print(output)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped) if hasattr(result, 'skipped') else 0}")
    
    if result.failures:
        print(f"\nFAILURES ({len(result.failures)}):")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print(f"\nERRORS ({len(result.errors)}):")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback.split('Error:')[-1].strip()}")
    
    success_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100) if result.testsRun > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1f}%")
    
    if result.wasSuccessful():
        print("🎉 ALL TESTS PASSED!")
        return True
    else:
        print("❌ SOME TESTS FAILED")
        return False

def validate_test_coverage():
    """Validate that we have tests for key components"""
    
    print("\n" + "="*60)
    print("VALIDATING TEST COVERAGE")
    print("="*60)
    
    required_test_files = [
        'tests/test_analytics_service.py',
        'tests/test_subscription_decorators.py'
    ]
    
    coverage_report = {
        'analytics_service': {
            'file': 'tests/test_analytics_service.py',
            'key_methods': [
                'test_get_business_analytics_success',
                'test_get_revenue_analytics_with_data',
                'test_get_customer_analytics_with_data',
                'test_get_product_analytics_with_data',
                'test_get_financial_analytics_with_data',
                'test_calculate_growth_rate',
                'test_parse_date_valid_formats',
                'test_error_handling_in_revenue_analytics'
            ]
        },
        'subscription_decorators': {
            'file': 'tests/test_subscription_decorators.py',
            'key_methods': [
                'test_subscription_required_free_user_denied',
                'test_subscription_required_trial_user_allowed',
                'test_subscription_required_paid_user_allowed',
                'test_check_analytics_access_free_user',
                'test_check_analytics_access_trial_user',
                'test_get_subscription_upgrade_info_free_user'
            ]
        }
    }
    
    all_covered = True
    
    for component, info in coverage_report.items():
        print(f"\n{component.upper()}:")
        
        # Check if test file exists
        if os.path.exists(info['file']):
            print(f"  ✓ Test file exists: {info['file']}")
            
            # Read test file and check for key methods
            try:
                with open(info['file'], 'r') as f:
                    content = f.read()
                
                missing_tests = []
                for method in info['key_methods']:
                    if method in content:
                        print(f"    ✓ {method}")
                    else:
                        print(f"    ✗ {method} - MISSING")
                        missing_tests.append(method)
                        all_covered = False
                
                if missing_tests:
                    print(f"    Missing {len(missing_tests)} key test methods")
                else:
                    print(f"    All {len(info['key_methods'])} key methods covered")
                    
            except Exception as e:
                print(f"  ✗ Error reading test file: {e}")
                all_covered = False
        else:
            print(f"  ✗ Test file missing: {info['file']}")
            all_covered = False
    
    print(f"\nOverall Coverage: {'✓ GOOD' if all_covered else '✗ INCOMPLETE'}")
    return all_covered

def main():
    """Main test runner function"""
    print("Analytics Implementation Test Suite")
    print("=" * 60)
    
    # Validate test coverage first
    coverage_ok = validate_test_coverage()
    
    if not coverage_ok:
        print("\n⚠️  Warning: Test coverage is incomplete")
        print("Some key test methods are missing. Consider adding them for better coverage.")
    
    # Run the actual tests
    tests_passed = run_analytics_tests()
    
    # Final summary
    print("\n" + "="*60)
    print("FINAL RESULTS")
    print("="*60)
    
    if tests_passed and coverage_ok:
        print("🎉 SUCCESS: All tests passed with good coverage!")
        sys.exit(0)
    elif tests_passed:
        print("⚠️  PARTIAL SUCCESS: Tests passed but coverage could be improved")
        sys.exit(0)
    else:
        print("❌ FAILURE: Some tests failed")
        sys.exit(1)

if __name__ == '__main__':
    main()