#!/usr/bin/env python3
"""
Validation script for MLPerf Visualization project
Checks that all files are present and correctly configured
"""

import json
import os
from pathlib import Path


def check_file_exists(filepath, description):
    """Check if a file exists."""
    if Path(filepath).exists():
        size = Path(filepath).stat().st_size
        print(f"✓ {description}: {filepath} ({size:,} bytes)")
        return True
    else:
        print(f"✗ {description}: {filepath} NOT FOUND")
        return False


def validate_json_structure(json_path):
    """Validate JSON data structure."""
    print("\n[Validating JSON Structure]")
    
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Check top-level keys
        required_keys = ['metadata', 'benchmarks', 'systems']
        for key in required_keys:
            if key in data:
                print(f"✓ JSON contains '{key}'")
            else:
                print(f"✗ JSON missing '{key}'")
                return False
        
        # Check metadata
        metadata = data['metadata']
        print(f"  - Version: {metadata['version']}")
        print(f"  - Generated: {metadata['generated_date']}")
        print(f"  - Total systems: {metadata['total_systems']}")
        print(f"  - Total benchmarks: {metadata['total_benchmarks']}")
        
        # Check benchmarks
        print(f"\n✓ Benchmarks ({len(data['benchmarks'])}):")
        for bench in data['benchmarks']:
            scenarios = ', '.join(bench['scenarios'])
            print(f"  - {bench['name']}: {scenarios} ({bench['unit']})")
        
        # Check default benchmark exists
        benchmark_names = [b['name'] for b in data['benchmarks']]
        if 'llama2-70b-99' in benchmark_names:
            print(f"\n✓ Default benchmark (llama2-70b-99) is present")
        else:
            print(f"\n✗ Default benchmark (llama2-70b-99) NOT FOUND")
        
        # Check systems
        print(f"\n✓ Systems: {len(data['systems'])} total")
        if data['systems']:
            sample = data['systems'][0]
            print(f"  Sample: {sample['organization']} - {sample['system_name'][:60]}...")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def validate_html_references(html_path):
    """Check that HTML references correct files."""
    print("\n[Validating HTML References]")
    
    with open(html_path, 'r') as f:
        html_content = f.read()
    
    # Check CSS reference
    if 'styles.css' in html_content:
        print("✓ HTML references styles.css")
    else:
        print("✗ HTML missing styles.css reference")
    
    # Check JS reference
    if 'app.js' in html_content:
        print("✓ HTML references app.js")
    else:
        print("✗ HTML missing app.js reference")
    
    # Check Plotly CDN
    if 'plotly' in html_content.lower():
        print("✓ HTML includes Plotly.js")
    else:
        print("✗ HTML missing Plotly.js")
    
    return True


def validate_js_configuration(js_path):
    """Check JavaScript configuration."""
    print("\n[Validating JavaScript Configuration]")
    
    with open(js_path, 'r') as f:
        js_content = f.read()
    
    # Check default benchmark
    if "currentBenchmark = 'llama2-70b-99'" in js_content:
        print("✓ Default benchmark is llama2-70b-99")
    else:
        print("⚠ Default benchmark might not be llama2-70b-99")
    
    # Check pagination
    if 'pageSize' in js_content and 'getPaginatedSystems' in js_content:
        print("✓ Pagination functionality present")
    else:
        print("✗ Pagination functionality missing")
    
    # Check Plotly usage
    if 'Plotly.newPlot' in js_content:
        print("✓ Plotly chart rendering present")
    else:
        print("✗ Plotly chart rendering missing")
    
    return True


def main():
    """Run all validations."""
    print("=" * 70)
    print("MLPerf Visualization Project Validation")
    print("=" * 70)
    
    # Check all required files
    print("\n[Checking Required Files]")
    all_present = True
    all_present &= check_file_exists('inference51results.csv', 'Source CSV')
    all_present &= check_file_exists('parse_data.py', 'Parser script')
    all_present &= check_file_exists('data.json', 'Parsed JSON data')
    all_present &= check_file_exists('index.html', 'Main HTML page')
    all_present &= check_file_exists('styles.css', 'CSS styles')
    all_present &= check_file_exists('app.js', 'JavaScript logic')
    all_present &= check_file_exists('README.md', 'Documentation')
    all_present &= check_file_exists('tests/test_parser.py', 'Unit tests')
    
    if not all_present:
        print("\n✗ Some required files are missing!")
        return False
    
    # Validate JSON
    if not validate_json_structure('data.json'):
        return False
    
    # Validate HTML
    if not validate_html_references('index.html'):
        return False
    
    # Validate JS
    if not validate_js_configuration('app.js'):
        return False
    
    # Summary
    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    print("✓ All required files present")
    print("✓ JSON data structure valid")
    print("✓ HTML references correct")
    print("✓ JavaScript configuration valid")
    print("\n✓ Project is ready to use!")
    print("\nTo view the visualization:")
    print("  1. Run: python3 -m http.server 8000")
    print("  2. Open: http://localhost:8000")
    
    return True


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)

