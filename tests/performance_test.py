#!/usr/bin/env python3
"""
Performance Testing Suite for SabiOps
Tests system performance under realistic Nigerian SME usage scenarios
"""

import asyncio
import aiohttp
import time
import json
import statistics
from datetime import datetime
import concurrent.futures
import sys

class SabiOpsPerformanceTest:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.test_results = []
        self.performance_metrics = {}
        
    def log_test(self, test_name, success, message="", metrics=None):
        """Log test results with performance metrics"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "metrics": metrics or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        
    async def measure_response_time(self, session, url, method='GET', data=None):
        """Measure response time for a single request"""
        start_time = time.time()
        try:
            if method == 'GET':
                async with session.get(url) as response:
                    await response.text()
                    end_time = time.time()
                    return {
                        'response_time': end_time - start_time,
                        'status_code': response.status,
                        'success': response.status < 400
                    }
            elif method == 'POST':
                async with session.post(url, json=data) as response:
                    await response.text()
                    end_time = time.time()
                    return {
                        'response_time': end_time - start_time,
                        'status_code': response.status,
                        'success': response.status < 400
                    }
        except Exception as e:
            end_time = time.time()
            return {
                'response_time': end_time - start_time,
                'status_code': 0,
                'success': False,
                'error': str(e)
            }
    
    async def test_single_endpoint_performance(self, endpoint, name, expected_time=3.0):
        """Test performance of a single endpoint"""
        print(f"\n🧪 Testing {name} Performance...")
        
        url = f"{self.base_url}{endpoint}"
        response_times = []
        success_count = 0
        
        # Test with multiple requests to get average
        async with aiohttp.ClientSession() as session:
            for i in range(10):  # 10 requests for average
                result = await self.measure_response_time(session, url)
                response_times.append(result['response_time'])
                if result['success']:
                    success_count += 1
        
        if response_times:
            avg_time = statistics.mean(response_times)
            min_time = min(response_times)
            max_time = max(response_times)
            
            metrics = {
                'average_response_time': avg_time,
                'min_response_time': min_time,
                'max_response_time': max_time,
                'success_rate': (success_count / len(response_times)) * 100
            }
            
            success = avg_time <= expected_time and success_count >= 8  # 80% success rate
            message = f"Avg: {avg_time:.2f}s, Min: {min_time:.2f}s, Max: {max_time:.2f}s, Success: {success_count}/10"
            
            self.log_test(f"Performance - {name}", success, message, metrics)
            return success
        else:
            self.log_test(f"Performance - {name}", False, "No response times recorded")
            return False
    
    async def test_concurrent_load(self, endpoint, name, concurrent_users=10):
        """Test performance under concurrent load"""
        print(f"\n🧪 Testing {name} Concurrent Load ({concurrent_users} users)...")
        
        url = f"{self.base_url}{endpoint}"
        
        async def make_request(session):
            return await self.measure_response_time(session, url)
        
        start_time = time.time()
        
        async with aiohttp.ClientSession() as session:
            # Create concurrent requests
            tasks = [make_request(session) for _ in range(concurrent_users)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Process results
        valid_results = [r for r in results if isinstance(r, dict) and 'response_time' in r]
        success_count = len([r for r in valid_results if r['success']])
        
        if valid_results:
            response_times = [r['response_time'] for r in valid_results]
            avg_time = statistics.mean(response_times)
            max_time = max(response_times)
            
            metrics = {
                'concurrent_users': concurrent_users,
                'total_time': total_time,
                'average_response_time': avg_time,
                'max_response_time': max_time,
                'success_rate': (success_count / len(valid_results)) * 100,
                'requests_per_second': len(valid_results) / total_time
            }
            
            # Success criteria: avg response < 5s, success rate > 80%
            success = avg_time <= 5.0 and (success_count / len(valid_results)) >= 0.8
            message = f"Avg: {avg_time:.2f}s, Max: {max_time:.2f}s, RPS: {metrics['requests_per_second']:.1f}, Success: {success_count}/{len(valid_results)}"
            
            self.log_test(f"Concurrent Load - {name}", success, message, metrics)
            return success
        else:
            self.log_test(f"Concurrent Load - {name}", False, "No valid responses received")
            return False
    
    async def test_data_intensive_operations(self):
        """Test performance with data-intensive operations"""
        print(f"\n🧪 Testing Data-Intensive Operations...")
        
        # Test creating multiple customers rapidly
        customer_data = {
            "name": "Performance Test Customer",
            "email": "perf@test.com",
            "phone": "+2348012345678",
            "business_name": "Test Business"
        }
        
        create_times = []
        success_count = 0
        
        async with aiohttp.ClientSession() as session:
            for i in range(5):  # Create 5 customers
                customer_data['email'] = f"perf{i}@test.com"
                result = await self.measure_response_time(
                    session, 
                    f"{self.base_url}/customers/", 
                    'POST', 
                    customer_data
                )
                create_times.append(result['response_time'])
                if result['success']:
                    success_count += 1
        
        if create_times:
            avg_create_time = statistics.mean(create_times)
            metrics = {
                'average_create_time': avg_create_time,
                'success_rate': (success_count / len(create_times)) * 100
            }
            
            success = avg_create_time <= 2.0 and success_count >= 4  # 80% success
            message = f"Avg create time: {avg_create_time:.2f}s, Success: {success_count}/5"
            
            self.log_test("Data Creation Performance", success, message, metrics)
            return success
        else:
            self.log_test("Data Creation Performance", False, "No creation times recorded")
            return False
    
    async def test_memory_usage_simulation(self):
        """Simulate memory-intensive operations"""
        print(f"\n🧪 Testing Memory Usage Patterns...")
        
        # Test fetching large datasets
        endpoints = [
            "/customers/",
            "/products/",
            "/sales/",
            "/expenses/"
        ]
        
        memory_test_results = []
        
        async with aiohttp.ClientSession() as session:
            for endpoint in endpoints:
                # Make multiple rapid requests to simulate memory pressure
                tasks = []
                for _ in range(5):
                    tasks.append(self.measure_response_time(session, f"{self.base_url}{endpoint}"))
                
                results = await asyncio.gather(*tasks)
                
                valid_results = [r for r in results if r['success']]
                if valid_results:
                    avg_time = statistics.mean([r['response_time'] for r in valid_results])
                    memory_test_results.append({
                        'endpoint': endpoint,
                        'avg_time': avg_time,
                        'success_count': len(valid_results)
                    })
        
        if memory_test_results:
            overall_avg = statistics.mean([r['avg_time'] for r in memory_test_results])
            total_success = sum([r['success_count'] for r in memory_test_results])
            total_requests = len(endpoints) * 5
            
            metrics = {
                'overall_average_time': overall_avg,
                'total_success_rate': (total_success / total_requests) * 100,
                'endpoint_results': memory_test_results
            }
            
            success = overall_avg <= 3.0 and (total_success / total_requests) >= 0.8
            message = f"Overall avg: {overall_avg:.2f}s, Success: {total_success}/{total_requests}"
            
            self.log_test("Memory Usage Simulation", success, message, metrics)
            return success
        else:
            self.log_test("Memory Usage Simulation", False, "No memory test results")
            return False
    
    def test_nigerian_network_conditions(self):
        """Simulate Nigerian network conditions (slower connections)"""
        print(f"\n🧪 Testing Nigerian Network Conditions...")
        
        # Simulate slower network by adding artificial delays
        # This is a simplified simulation - in real testing, you'd use network throttling
        
        import time
        
        # Test with simulated 3G speeds (slower response expectations)
        slower_endpoints = [
            ("/customers/", "Customer List", 5.0),  # Allow 5s for slower networks
            ("/dashboard/metrics", "Dashboard", 6.0),  # Dashboard might be slower
            ("/products/", "Product List", 5.0)
        ]
        
        results = []
        for endpoint, name, max_time in slower_endpoints:
            # Simulate network delay
            start_time = time.time()
            time.sleep(0.5)  # Simulate 500ms network latency
            
            try:
                import requests
                response = requests.get(f"{self.base_url}{endpoint}", timeout=max_time)
                end_time = time.time()
                
                response_time = end_time - start_time
                success = response_time <= max_time and response.status_code == 200
                
                results.append(success)
                message = f"Response time: {response_time:.2f}s (max: {max_time}s)"
                self.log_test(f"Nigerian Network - {name}", success, message)
                
            except Exception as e:
                results.append(False)
                self.log_test(f"Nigerian Network - {name}", False, f"Error: {str(e)}")
        
        overall_success = all(results) if results else False
        return overall_success
    
    async def run_all_performance_tests(self):
        """Run complete performance test suite"""
        print("🚀 Starting SabiOps Performance Testing...")
        print("=" * 60)
        
        start_time = time.time()
        
        # Core endpoint performance tests
        endpoints_to_test = [
            ("/customers/", "Customer List", 3.0),
            ("/products/", "Product List", 3.0),
            ("/sales/", "Sales List", 3.0),
            ("/expenses/", "Expense List", 3.0),
            ("/dashboard/metrics", "Dashboard Metrics", 2.0)
        ]
        
        performance_results = []
        
        # Test individual endpoint performance
        for endpoint, name, expected_time in endpoints_to_test:
            result = await self.test_single_endpoint_performance(endpoint, name, expected_time)
            performance_results.append(result)
        
        # Test concurrent load
        concurrent_results = []
        for endpoint, name, _ in endpoints_to_test[:3]:  # Test top 3 endpoints
            result = await self.test_concurrent_load(endpoint, name, 10)
            concurrent_results.append(result)
        
        # Test data-intensive operations
        data_result = await self.test_data_intensive_operations()
        
        # Test memory usage patterns
        memory_result = await self.test_memory_usage_simulation()
        
        # Test Nigerian network conditions
        network_result = self.test_nigerian_network_conditions()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"\n⏱️  Total performance test time: {total_time:.2f} seconds")
        
        return self.generate_performance_report()
    
    def generate_performance_report(self):
        """Generate comprehensive performance report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Calculate performance metrics
        response_times = []
        for result in self.test_results:
            if result.get('metrics', {}).get('average_response_time'):
                response_times.append(result['metrics']['average_response_time'])
        
        performance_summary = {}
        if response_times:
            performance_summary = {
                'average_response_time': statistics.mean(response_times),
                'fastest_response': min(response_times),
                'slowest_response': max(response_times)
            }
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{success_rate:.1f}%",
                "performance_summary": performance_summary,
                "timestamp": datetime.now().isoformat()
            },
            "results": self.test_results,
            "recommendations": []
        }
        
        # Add performance recommendations
        if performance_summary:
            avg_time = performance_summary.get('average_response_time', 0)
            if avg_time > 3.0:
                report["recommendations"].append("Average response time exceeds 3s - optimize database queries and caching")
            elif avg_time > 2.0:
                report["recommendations"].append("Response times acceptable but could be improved with optimization")
            else:
                report["recommendations"].append("Excellent response times - system performs well")
        
        if success_rate < 80:
            report["recommendations"].append("Performance issues detected - immediate optimization required")
        elif success_rate < 95:
            report["recommendations"].append("Minor performance issues - monitor and optimize")
        else:
            report["recommendations"].append("System performance meets requirements for Nigerian SME usage")
        
        print("\n" + "=" * 60)
        print("⚡ PERFORMANCE TEST REPORT")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if performance_summary:
            print(f"\n📊 Performance Summary:")
            print(f"  Average Response Time: {performance_summary['average_response_time']:.2f}s")
            print(f"  Fastest Response: {performance_summary['fastest_response']:.2f}s")
            print(f"  Slowest Response: {performance_summary['slowest_response']:.2f}s")
        
        if report["recommendations"]:
            print("\n📋 Recommendations:")
            for rec in report["recommendations"]:
                print(f"  • {rec}")
        
        return report

async def main():
    # Allow custom base URL for testing different environments
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    tester = SabiOpsPerformanceTest(base_url)
    report = await tester.run_all_performance_tests()
    
    # Save report to file
    with open('performance_test_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: performance_test_report.json")
    
    # Exit with appropriate code
    success_rate = float(report["summary"]["success_rate"].replace('%', ''))
    sys.exit(0 if success_rate >= 80 else 1)

if __name__ == "__main__":
    asyncio.run(main())