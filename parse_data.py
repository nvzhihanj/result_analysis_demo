#!/usr/bin/env python3
"""
MLPerf Inference Results Parser

Parses the complex CSV structure from MLPerf Inference v5.1 submissions
and generates a clean JSON file for visualization.

The CSV has a 5-row header structure and groups data in 4-row blocks per system.
This script extracts metadata and benchmark results for LLM benchmarks only.
"""

import csv
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple


# Extract all benchmarks (set to None to include everything)
# Previously filtered to LLM only, now including all benchmarks
BENCHMARK_FILTER = None  # None means include all benchmarks


class MLPerfParser:
    """Parser for MLPerf Inference results CSV files."""
    
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.column_map = {}  # column_index -> (benchmark, scenario, unit)
        self.benchmarks_info = {}  # benchmark -> {scenarios, unit}
        self.systems = []
        
    def parse(self) -> Dict:
        """Main parsing function."""
        # Try different encodings
        encodings = ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1', 'cp1252']
        rows = None
        
        for encoding in encodings:
            try:
                with open(self.csv_path, 'r', encoding=encoding) as f:
                    reader = csv.reader(f, delimiter='\t')  # Tab-delimited
                    rows = list(reader)
                print(f"✓ Successfully read file with {encoding} encoding")
                break
            except (UnicodeDecodeError, UnicodeError):
                continue
        
        if rows is None:
            raise ValueError("Could not decode CSV file with any known encoding")
        
        # Parse header (rows 0-4, but Python is 0-indexed so rows 0-3 contain headers, row 4 is actual headers)
        self._parse_header(rows[:5])
        
        # Parse data rows (starting from row 5)
        self._parse_data_rows(rows[5:])
        
        # Build output structure
        return self._build_output()
    
    def _parse_header(self, header_rows: List[List[str]]) -> None:
        """Parse the 5-row header to build column mapping."""
        # Row 2 (index 2): benchmark names
        # Row 3 (index 3): scenarios
        # Row 4 (index 4): column headers with units
        
        benchmarks_row = header_rows[2]
        scenarios_row = header_rows[3]
        headers_row = header_rows[4]
        
        # Find where benchmark columns start (after metadata columns)
        metadata_end = 0
        for i, header in enumerate(headers_row):
            if header.strip() in ['Samples/s', 'Queries/s', 'Tokens/s']:
                metadata_end = i
                break
        
        # Build column map for benchmark columns
        current_benchmark = None
        current_scenario = None
        
        for col_idx in range(metadata_end, len(headers_row)):
            benchmark = benchmarks_row[col_idx].strip()
            scenario = scenarios_row[col_idx].strip()
            unit = headers_row[col_idx].strip()
            
            # Skip empty columns
            if not benchmark and not scenario and not unit:
                continue
                
            # Update current benchmark/scenario if not empty
            if benchmark:
                current_benchmark = benchmark
            if scenario:
                current_scenario = scenario
            
            # Store benchmark if it passes the filter (or if no filter is set)
            should_include = (BENCHMARK_FILTER is None or current_benchmark in BENCHMARK_FILTER)
            if should_include and current_benchmark and current_scenario and unit:
                self.column_map[col_idx] = (current_benchmark, current_scenario, unit)
                
                # Track benchmark info
                if current_benchmark not in self.benchmarks_info:
                    self.benchmarks_info[current_benchmark] = {
                        'scenarios': set(),
                        'unit': unit
                    }
                self.benchmarks_info[current_benchmark]['scenarios'].add(current_scenario)
    
    def _parse_data_rows(self, data_rows: List[List[str]]) -> None:
        """Parse data rows in groups of 4 per system."""
        i = 0
        while i < len(data_rows):
            # Each system has 4 rows, we only care about the 4th row (Avg. Result)
            if i + 3 < len(data_rows):
                # Check if this is a valid system group
                row_type = data_rows[i + 3][14] if len(data_rows[i + 3]) > 14 else ""
                
                if "Avg. Result" in row_type:
                    system = self._parse_system(data_rows[i:i+4])
                    if system:
                        self.systems.append(system)
                    i += 4
                else:
                    i += 1
            else:
                break
    
    def _parse_system(self, rows: List[List[str]]) -> Optional[Dict]:
        """Parse a 4-row system block."""
        # Use the result row (index 3) for most data
        result_row = rows[3]
        
        # Extract metadata (columns 0-14)
        if len(result_row) < 15:
            return None
            
        public_id = result_row[0].strip()
        organization = result_row[1].strip()
        system_name = result_row[3].strip()
        accelerator = result_row[5].strip()
        
        # Get accelerator count from row 1 (# of Accelerators row)
        num_accelerators_str = rows[1][6].strip() if len(rows[1]) > 6 else "0"
        num_accelerators = self._parse_number(num_accelerators_str)
        
        # Get other counts
        num_nodes_str = rows[2][4].strip() if len(rows[2]) > 4 else "0"
        num_nodes = self._parse_number(num_nodes_str)
        
        num_processors_str = rows[0][12].strip() if len(rows[0]) > 12 else "0"
        num_processors = self._parse_number(num_processors_str)
        
        # Skip if missing critical info
        if not public_id or not organization or not system_name:
            return None
        
        # Extract benchmark results
        results = {}
        has_results = False
        
        for col_idx, (benchmark, scenario, unit) in self.column_map.items():
            if col_idx < len(result_row):
                value_str = result_row[col_idx].strip()
                value = self._parse_number(value_str)
                
                if benchmark not in results:
                    results[benchmark] = {}
                
                results[benchmark][scenario] = value
                if value is not None:
                    has_results = True
        
        # Only include systems that have at least one benchmark result
        if not has_results:
            return None
        
        return {
            'public_id': public_id,
            'organization': organization,
            'system_name': system_name,
            'accelerator': accelerator if accelerator else 'N/A',
            'num_accelerators': num_accelerators,
            'num_nodes': num_nodes,
            'num_processors': num_processors,
            'results': results
        }
    
    def _parse_number(self, value_str: str) -> Optional[float]:
        """Parse a number string, handling commas and empty values."""
        if not value_str or value_str == '':
            return None
        
        # Remove commas
        value_str = value_str.replace(',', '')
        
        try:
            return float(value_str)
        except ValueError:
            return None
    
    def _build_output(self) -> Dict:
        """Build the final JSON output structure."""
        # Convert benchmark info sets to lists
        benchmarks = []
        for name, info in sorted(self.benchmarks_info.items()):
            benchmarks.append({
                'name': name,
                'scenarios': sorted(list(info['scenarios'])),
                'unit': info['unit']
            })
        
        return {
            'metadata': {
                'version': '5.1',
                'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'total_systems': len(self.systems),
                'total_benchmarks': len(benchmarks),
                'description': 'MLPerf Inference v5.1 Results - All Benchmarks'
            },
            'benchmarks': benchmarks,
            'systems': self.systems
        }


def main():
    """Main execution function."""
    print("MLPerf Inference Results Parser")
    print("=" * 50)
    
    # Parse the CSV
    print("\n[1/3] Parsing CSV file...")
    parser = MLPerfParser('inference51results.csv')
    data = parser.parse()
    
    print(f"✓ Found {data['metadata']['total_benchmarks']} benchmarks")
    print(f"✓ Parsed {data['metadata']['total_systems']} systems with results")
    
    # Print benchmark summary
    print("\n[2/3] Benchmark summary:")
    for benchmark in data['benchmarks']:
        scenarios = ', '.join(benchmark['scenarios'])
        print(f"  • {benchmark['name']}: {scenarios} ({benchmark['unit']})")
    
    # Write JSON output
    print("\n[3/3] Writing JSON output...")
    output_path = 'data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated {output_path}")
    print("\n" + "=" * 50)
    print("✓ Parsing complete!")
    print(f"  Systems: {data['metadata']['total_systems']}")
    print(f"  Benchmarks: {data['metadata']['total_benchmarks']}")
    print(f"  Output: {output_path}")


if __name__ == '__main__':
    main()

