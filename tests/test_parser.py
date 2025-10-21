#!/usr/bin/env python3
"""
Unit tests for MLPerf Inference Results Parser

Tests the parsing logic, data extraction, and JSON generation.
"""

import unittest
import json
import os
import sys
from pathlib import Path

# Add parent directory to path to import parser
sys.path.insert(0, str(Path(__file__).parent.parent))
from parse_data import MLPerfParser, LLM_BENCHMARKS


class TestMLPerfParser(unittest.TestCase):
    """Test cases for MLPerfParser class."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures - parse the actual CSV once for all tests."""
        cls.csv_path = Path(__file__).parent.parent / 'inference51results.csv'
        
        # Check if CSV exists
        if not cls.csv_path.exists():
            raise FileNotFoundError(f"CSV file not found: {cls.csv_path}")
        
        # Parse the CSV
        cls.parser = MLPerfParser(str(cls.csv_path))
        cls.data = cls.parser.parse()
    
    def test_data_structure(self):
        """Test that the output has the expected structure."""
        self.assertIn('metadata', self.data)
        self.assertIn('benchmarks', self.data)
        self.assertIn('systems', self.data)
        
        # Check metadata structure
        metadata = self.data['metadata']
        self.assertIn('version', metadata)
        self.assertIn('generated_date', metadata)
        self.assertIn('total_systems', metadata)
        self.assertIn('total_benchmarks', metadata)
        
        # Check version
        self.assertEqual(metadata['version'], '5.1')
    
    def test_benchmark_extraction(self):
        """Test that LLM benchmarks are correctly extracted."""
        benchmarks = self.data['benchmarks']
        
        # Should have extracted some benchmarks
        self.assertGreater(len(benchmarks), 0)
        
        # Check that all extracted benchmarks are LLM benchmarks
        for benchmark in benchmarks:
            self.assertIn(benchmark['name'], LLM_BENCHMARKS)
            self.assertIn('scenarios', benchmark)
            self.assertIn('unit', benchmark)
            self.assertIsInstance(benchmark['scenarios'], list)
            self.assertGreater(len(benchmark['scenarios']), 0)
    
    def test_llama2_benchmark_exists(self):
        """Test that llama2-70b-99 benchmark exists (default benchmark)."""
        benchmark_names = [b['name'] for b in self.data['benchmarks']]
        self.assertIn('llama2-70b-99', benchmark_names)
        
        # Find llama2 benchmark
        llama2 = next(b for b in self.data['benchmarks'] if b['name'] == 'llama2-70b-99')
        
        # Should have multiple scenarios
        self.assertGreater(len(llama2['scenarios']), 0)
        
        # Should have unit
        self.assertIn(llama2['unit'], ['Tokens/s', 'Samples/s', 'Queries/s'])
    
    def test_system_metadata(self):
        """Test that system metadata is correctly extracted."""
        systems = self.data['systems']
        
        # Should have extracted some systems
        self.assertGreater(len(systems), 0)
        
        # Check first system structure
        system = systems[0]
        required_fields = [
            'public_id', 'organization', 'system_name', 'accelerator',
            'num_accelerators', 'num_nodes', 'num_processors', 'results'
        ]
        
        for field in required_fields:
            self.assertIn(field, system)
        
        # Check field types
        self.assertIsInstance(system['public_id'], str)
        self.assertIsInstance(system['organization'], str)
        self.assertIsInstance(system['system_name'], str)
        self.assertIsInstance(system['accelerator'], str)
        self.assertIsInstance(system['results'], dict)
        
        # Check that public_id follows format
        self.assertTrue(system['public_id'].startswith('5.1-'))
    
    def test_results_structure(self):
        """Test that results are properly structured."""
        systems = self.data['systems']
        
        for system in systems:
            results = system['results']
            
            # Results should have benchmark keys
            for benchmark_name, scenarios in results.items():
                # Should be an LLM benchmark
                self.assertIn(benchmark_name, LLM_BENCHMARKS)
                
                # Scenarios should be a dict
                self.assertIsInstance(scenarios, dict)
                
                # Values should be numeric or None
                for scenario, value in scenarios.items():
                    if value is not None:
                        self.assertIsInstance(value, (int, float))
                        self.assertGreater(value, 0)  # Performance should be positive
    
    def test_metric_values(self):
        """Test that metric values are reasonable."""
        systems = self.data['systems']
        
        # Collect all non-null values
        all_values = []
        for system in systems:
            for benchmark, scenarios in system['results'].items():
                for scenario, value in scenarios.items():
                    if value is not None:
                        all_values.append(value)
        
        # Should have some results
        self.assertGreater(len(all_values), 0)
        
        # Values should be positive
        for value in all_values:
            self.assertGreater(value, 0)
        
        # Values should be reasonable (not absurdly large or small)
        for value in all_values:
            self.assertLess(value, 1e9)  # Less than 1 billion
            self.assertGreater(value, 0.01)  # Greater than 0.01
    
    def test_data_counts(self):
        """Test that counts match metadata."""
        metadata = self.data['metadata']
        
        # Check benchmark count
        self.assertEqual(len(self.data['benchmarks']), metadata['total_benchmarks'])
        
        # Check system count
        self.assertEqual(len(self.data['systems']), metadata['total_systems'])
        
        # Should have reasonable numbers
        self.assertGreater(metadata['total_benchmarks'], 0)
        self.assertGreater(metadata['total_systems'], 0)
    
    def test_no_duplicate_systems(self):
        """Test that there are no duplicate systems."""
        public_ids = [s['public_id'] for s in self.data['systems']]
        self.assertEqual(len(public_ids), len(set(public_ids)))
    
    def test_scenario_consistency(self):
        """Test that scenarios are consistent."""
        valid_scenarios = {'Offline', 'Server', 'Interactive'}
        
        for benchmark in self.data['benchmarks']:
            for scenario in benchmark['scenarios']:
                self.assertIn(scenario, valid_scenarios)
        
        for system in self.data['systems']:
            for benchmark_results in system['results'].values():
                for scenario in benchmark_results.keys():
                    self.assertIn(scenario, valid_scenarios)
    
    def test_json_serializable(self):
        """Test that the output is JSON serializable."""
        try:
            json_str = json.dumps(self.data)
            self.assertIsInstance(json_str, str)
            
            # Test round-trip
            parsed = json.loads(json_str)
            self.assertEqual(len(parsed['systems']), len(self.data['systems']))
        except (TypeError, ValueError) as e:
            self.fail(f"Data is not JSON serializable: {e}")
    
    def test_numeric_parsing(self):
        """Test that numbers with commas are parsed correctly."""
        # Test the _parse_number method
        test_cases = [
            ('1,234.56', 1234.56),
            ('1234.56', 1234.56),
            ('1,234', 1234.0),
            ('', None),
            ('invalid', None),
        ]
        
        for input_str, expected in test_cases:
            result = self.parser._parse_number(input_str)
            if expected is None:
                self.assertIsNone(result)
            else:
                self.assertAlmostEqual(result, expected, places=2)
    
    def test_specific_system_amd(self):
        """Test that a specific AMD system is parsed correctly."""
        # Find AMD systems
        amd_systems = [s for s in self.data['systems'] if s['organization'] == 'AMD']
        
        # Should have some AMD systems
        self.assertGreater(len(amd_systems), 0)
        
        # Check first AMD system
        amd_system = amd_systems[0]
        self.assertEqual(amd_system['public_id'], '5.1-0001')
        self.assertEqual(amd_system['organization'], 'AMD')
        self.assertIn('MI300X', amd_system['accelerator'] + amd_system['system_name'])
    
    def test_benchmark_has_results(self):
        """Test that each benchmark has at least one system with results."""
        for benchmark in self.data['benchmarks']:
            benchmark_name = benchmark['name']
            
            # Find systems with results for this benchmark
            systems_with_results = 0
            for system in self.data['systems']:
                if benchmark_name in system['results']:
                    results = system['results'][benchmark_name]
                    # Check if any scenario has a non-null value
                    if any(v is not None for v in results.values()):
                        systems_with_results += 1
            
            self.assertGreater(
                systems_with_results, 0,
                f"Benchmark {benchmark_name} has no systems with results"
            )
    
    def test_units_are_valid(self):
        """Test that all units are valid metric units."""
        valid_units = {'Tokens/s', 'Samples/s', 'Queries/s'}
        
        for benchmark in self.data['benchmarks']:
            self.assertIn(benchmark['unit'], valid_units)


class TestDataIntegrity(unittest.TestCase):
    """Test data integrity and consistency."""
    
    @classmethod
    def setUpClass(cls):
        """Load the generated JSON file."""
        json_path = Path(__file__).parent.parent / 'data.json'
        
        if not json_path.exists():
            raise FileNotFoundError(f"JSON file not found: {json_path}")
        
        with open(json_path, 'r') as f:
            cls.data = json.load(f)
    
    def test_json_file_exists(self):
        """Test that data.json file was created."""
        json_path = Path(__file__).parent.parent / 'data.json'
        self.assertTrue(json_path.exists())
    
    def test_json_file_not_empty(self):
        """Test that data.json is not empty."""
        self.assertIsNotNone(self.data)
        self.assertGreater(len(self.data), 0)
    
    def test_generated_date(self):
        """Test that generated_date is present and formatted."""
        date_str = self.data['metadata']['generated_date']
        self.assertIsInstance(date_str, str)
        self.assertGreater(len(date_str), 0)
        
        # Should contain year, month, day
        self.assertIn('2025', date_str)  # Current year
        self.assertIn('-', date_str)  # Date separator


def run_tests():
    """Run all tests and print results."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestMLPerfParser))
    suite.addTests(loader.loadTestsFromTestCase(TestDataIntegrity))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed!")
        return 1


if __name__ == '__main__':
    exit(run_tests())

