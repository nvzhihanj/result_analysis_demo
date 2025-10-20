# MLPerf Inference Results Visualization - Implementation Plan

## Executive Summary

This document outlines the detailed plan for building an interactive HTML visualization tool for MLPerf Inference v5.1 submission results. The tool will allow users to explore and compare benchmark performance across different systems, scenarios, and accelerators.

## 1. Data Understanding & Analysis

### 1.1 Current Data Structure

The `inference51results.csv` file has a complex structure:

**Header Structure (Rows 1-5):**
- **Row 1:** "Benchmark / Model MLC / Scenario / Units" repeated for each benchmark-scenario combination
- **Row 2:** "Inference" repeated (category identifier)
- **Row 3:** Benchmark names (deepseek-r1, dlrm-v2-99, llama2-70b-99, llama3.1-8b-datacenter, llama3.1-405b, mixtral-8x7b, retinanet, rgat, stable-diffusion-xl, whisper)
- **Row 4:** Scenarios (Offline, Server, Interactive)
- **Row 5:** Column headers including:
  - Metadata: Public ID, Organization, Availability, System Name, # of Nodes, Accelerator, # of Accelerators, Code, Host Processor, etc.
  - Metrics: Samples/s, Queries/s, Tokens/s (depending on benchmark)

**Data Structure (Rows 6+):**
Each system submission has 4 consecutive rows:
1. Row with "# of Processors" in column 15
2. Row with "# of Accelerators" in column 15
3. Row with "# of Nodes" in column 15
4. Row with "Avg. Result at System Name" in column 15 - **THIS ROW CONTAINS THE ACTUAL METRICS**

### 1.2 Benchmarks Identified

From the data structure, we have the following benchmarks:
- **deepseek-r1** (Offline, Server)
- **dlrm-v2-99** (Offline, Server)
- **dlrm-v2-99.9** (Offline, Server)
- **llama2-70b-99** (Offline, Server, Interactive)
- **llama2-70b-99.9** (Offline, Server, Interactive)
- **llama3.1-8b-datacenter** (Offline, Server, Interactive)
- **llama3.1-405b** (Offline, Server, Interactive)
- **mixtral-8x7b** (Offline, Server)
- **retinanet** (Offline, Server)
- **rgat** (Offline)
- **stable-diffusion-xl** (Offline, Server)
- **whisper** (Offline)

### 1.3 Scenarios

Three scenario types with different optimization goals:
- **Offline:** Maximum throughput benchmark
- **Server:** Throughput at fixed query latency
- **Interactive:** Throughput at fixed TTFT/TPOT latency (primarily for LLMs)

### 1.4 Metrics

- **Tokens/s** - Used for LLM benchmarks
- **Samples/s** - Used for non-LLM benchmarks
- **Queries/s** - Alternative metric for some server scenarios

## 2. Architecture & Technology Stack

### 2.1 Technology Choices

**Parser:**
- **Language:** Python 3.8+
- **Libraries:** 
  - `csv` (built-in) for CSV parsing
  - `json` (built-in) for JSON output
  - `pandas` (optional, for easier data manipulation)

**Frontend:**
- **HTML5:** Structure
- **CSS3:** Styling with modern design
- **JavaScript (ES6+):** Logic and interactivity
- **Plotly.js:** Charting library (chosen over Chart.js)

**Why Plotly.js?**
- Superior interactive capabilities
- Built-in hover tooltips with customization
- Native legend click-to-toggle functionality
- Professional appearance similar to InferenceMAX reference
- Better handling of categorical data
- Supports line charts with markers

### 2.2 Data Flow

```
inference51results.csv (Raw Data)
           ↓
    parse_data.py (Parser)
           ↓
      data.json (Structured Data)
           ↓
    index.html + app.js (Visualization)
           ↓
    Interactive Chart (User Interface)
```

## 3. Detailed Implementation Plan

### 3.1 Phase 1: Data Parser (parse_data.py)

**Objectives:**
- Parse complex multi-row CSV header
- Extract system metadata
- Extract benchmark results
- Generate clean JSON structure

**Implementation Steps:**

1. **Parse Header Rows (Rows 1-5)**
   - Read first 5 rows to build column mapping
   - Create dictionary mapping: column_index → (benchmark, scenario, unit)

2. **Parse Data Rows (Rows 6+)**
   - Group rows by Public ID (every 4 rows = 1 system)
   - Extract from row with "Avg. Result at System Name":
     - Public ID
     - Organization
     - System Name
     - Accelerator
     - # of Accelerators
     - # of Nodes
     - # of Processors
     - All benchmark-scenario results

3. **Data Structure Design**

```json
{
  "metadata": {
    "version": "5.1",
    "generated_date": "2025-10-20",
    "total_systems": 100,
    "total_benchmarks": 12
  },
  "benchmarks": [
    {
      "name": "deepseek-r1",
      "scenarios": ["Offline", "Server"],
      "unit": "Tokens/s"
    },
    // ... more benchmarks
  ],
  "systems": [
    {
      "public_id": "5.1-0001",
      "organization": "AMD",
      "system_name": "Supermicro AS-8125GS-TNMR2",
      "accelerator": "AMD Instinct MI300X 192GB HBM3",
      "num_accelerators": 8,
      "num_nodes": 1,
      "num_processors": 2,
      "results": {
        "deepseek-r1": {
          "Offline": null,
          "Server": null
        },
        "llama2-70b-99": {
          "Offline": 27803.90,
          "Server": 24593.77,
          "Interactive": 8840.42
        },
        // ... more results
      }
    },
    // ... more systems
  ]
}
```

4. **Handle Missing Data**
   - Use `null` for missing benchmark-scenario combinations
   - Skip empty/invalid values
   - Log parsing warnings

5. **Output JSON File**
   - Pretty-print for readability
   - Validate JSON structure before writing

### 3.2 Phase 2: HTML Structure (index.html)

**Layout Design:**

```
┌─────────────────────────────────────────────────────┐
│  MLPerf Inference v5.1 Results Visualization        │
├─────────────────────────────────────────────────────┤
│  Select Benchmark: [Dropdown ▼]                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│              [Interactive Chart]                     │
│                                                      │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Legend (Click to toggle):                          │
│  ■ System 1   ■ System 2   ■ System 3   ...        │
└─────────────────────────────────────────────────────┘
```

**HTML Elements:**
- Header with title and description
- Benchmark dropdown selector
- Chart container div
- Info panel for instructions
- Footer with data source info

### 3.3 Phase 3: Styling (styles.css)

**Design Principles:**
- Clean, modern interface
- Professional color scheme
- Responsive layout
- Clear typography
- Accessible contrast ratios

**Key Styling Elements:**
- Container with max-width for readability
- Dropdown with custom styling
- Chart with appropriate padding
- Hover effects for interactive elements
- Mobile-responsive breakpoints

### 3.4 Phase 4: JavaScript Logic (app.js)

**Core Functions:**

1. **`loadData()`**
   - Fetch data.json
   - Parse and store globally
   - Initialize UI

2. **`populateBenchmarkDropdown()`**
   - Extract unique benchmarks from data
   - Create dropdown options
   - Set default selection

3. **`filterDataByBenchmark(selectedBenchmark)`**
   - Filter systems that have results for selected benchmark
   - Extract scenarios for this benchmark
   - Prepare data for charting

4. **`renderChart(benchmark, data)`**
   - Configure Plotly chart
   - Set X-axis as categorical (scenarios)
   - Set Y-axis with appropriate unit
   - Create trace for each system
   - Configure hover template
   - Configure legend interaction

5. **`updateChart(selectedBenchmark)`**
   - Called when dropdown changes
   - Re-render chart with new data

**Chart Configuration:**

```javascript
{
  data: [
    {
      x: ['Offline', 'Server', 'Interactive'],
      y: [27803.90, 24593.77, 8840.42],
      name: 'AMD Supermicro AS-8125GS-TNMR2',
      type: 'scatter',
      mode: 'lines+markers',
      hovertemplate: '<b>%{fullData.name}</b><br>' +
                     'Scenario: %{x}<br>' +
                     'Performance: %{y:.2f} Tokens/s<br>' +
                     'Accelerator: AMD Instinct MI300X<br>' +
                     'Count: 8<extra></extra>'
    },
    // ... more traces
  ],
  layout: {
    title: 'Benchmark: llama2-70b-99',
    xaxis: { title: 'Scenario' },
    yaxis: { title: 'Performance (Tokens/s)' },
    hovermode: 'closest',
    showlegend: true,
    legend: { 
      orientation: 'v',
      x: 1.05,
      y: 1
    }
  },
  config: {
    responsive: true,
    displayModeBar: true
  }
}
```

**Legend Click Behavior:**
- Single click: Toggle single trace
- Double click: Isolate single trace
- Built-in with Plotly.js

## 4. Testing Strategy

### 4.1 Unit Tests (test_parser.py)

**Test Cases:**

1. **test_parse_header()**
   - Verify column mapping is correct
   - Test benchmark extraction
   - Test scenario extraction

2. **test_parse_system_metadata()**
   - Verify Public ID extraction
   - Verify Organization extraction
   - Verify System Name extraction
   - Verify Accelerator info extraction

3. **test_parse_metrics()**
   - Verify correct metric extraction
   - Test handling of numeric values with commas
   - Test handling of missing/null values

4. **test_json_structure()**
   - Validate JSON schema
   - Verify all expected fields present
   - Check data types

5. **test_benchmark_scenarios()**
   - Verify correct scenario mapping per benchmark
   - Test scenario count

6. **test_missing_data_handling()**
   - Test systems with partial results
   - Verify null handling
   - Test empty value handling

7. **test_data_integrity()**
   - Verify no data loss during parsing
   - Test round-trip consistency
   - Validate metric value accuracy

**Test Framework:**
- Python `unittest` or `pytest`
- Test data: Sample CSV with known values
- Assertions on parsed JSON output

### 4.2 Manual Testing Checklist

**Functionality Tests:**
- [ ] Dropdown populates with all benchmarks
- [ ] Chart renders for each benchmark selection
- [ ] All scenarios appear on X-axis
- [ ] All systems appear in legend
- [ ] Lines connect points correctly
- [ ] Hover shows correct information
- [ ] Hover shows system name, accelerator, count, metric
- [ ] Legend click toggles system visibility
- [ ] Multiple systems can be shown/hidden
- [ ] Y-axis unit updates per benchmark
- [ ] No console errors

**Data Accuracy Tests:**
- [ ] Sample spot-check metrics against CSV
- [ ] Verify system names match
- [ ] Verify accelerator info is correct
- [ ] Verify counts are accurate

**UI/UX Tests:**
- [ ] Page loads quickly
- [ ] Chart is readable
- [ ] Colors are distinguishable
- [ ] Text is legible
- [ ] Dropdown is easy to use
- [ ] Hover is responsive
- [ ] Legend is clear

**Responsive Tests:**
- [ ] Desktop view (1920x1080)
- [ ] Laptop view (1366x768)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)

**Data Update Tests:**
- [ ] Parser runs on updated CSV
- [ ] New data.json loads correctly
- [ ] Chart updates with new data
- [ ] No stale data displayed

## 5. File Structure

```
/result_analysis_demo/
├── inference51results.csv          # Original MLPerf data
├── cursor_artifacts/
│   └── implementation_plan.md      # This document
├── parse_data.py                   # Python parser script
├── data.json                       # Parsed JSON output (generated)
├── index.html                      # Main HTML page
├── styles.css                      # Styling
├── app.js                          # JavaScript logic
├── README.md                       # User documentation
├── requirements.txt                # Python dependencies (if needed)
└── tests/
    ├── test_parser.py              # Parser unit tests
    └── sample_data.csv             # Test fixture (optional)
```

## 6. Implementation Timeline

**Phase 1: Parser Development (Steps 1-2)**
- Parse CSV structure
- Extract and transform data
- Generate JSON output
- **Deliverable:** `parse_data.py`, `data.json`

**Phase 2: HTML Structure (Step 3)**
- Create HTML skeleton
- Add dropdown and chart container
- Link external libraries
- **Deliverable:** `index.html`

**Phase 3: Visualization Logic (Steps 4-6)**
- Implement data loading
- Implement chart rendering
- Add interactivity (dropdown, hover, legend)
- **Deliverable:** `app.js`

**Phase 4: Styling (Step 7)**
- Design modern UI
- Add responsive layout
- Polish appearance
- **Deliverable:** `styles.css`

**Phase 5: Testing (Steps 8-9)**
- Write unit tests
- Run parser tests
- Manual testing of UI
- Bug fixes
- **Deliverable:** `test_parser.py`, bug-free application

**Phase 6: Documentation (Step 10)**
- Write README
- Document data update process
- Add inline code comments
- **Deliverable:** `README.md`

## 7. Key Design Decisions & Rationale

### 7.1 Why Separate Parser?

**Pros:**
- Clean separation of concerns
- Can be run independently when CSV updates
- Easier to test and debug
- Can be scheduled as cron job for daily updates
- Faster HTML page load (pre-processed JSON)

**Cons:**
- Two-step process (parse → visualize)
- Requires running parser when data changes

**Decision:** Use separate parser - benefits outweigh drawbacks

### 7.2 Why JSON Intermediate Format?

**Pros:**
- Fast parsing in browser
- Human-readable for debugging
- Easy to version control
- Can be consumed by other tools
- Smaller file size than CSV for this structure

**Cons:**
- Additional file to manage

**Decision:** Use JSON - industry standard, optimal for web

### 7.3 Why Plotly.js over Chart.js?

**Comparison:**

| Feature | Plotly.js | Chart.js |
|---------|-----------|----------|
| Interactive hover | ✓ Excellent | ✓ Good |
| Legend toggle | ✓ Built-in | ✓ Built-in |
| Categorical X-axis | ✓ Native | ⚠ Requires config |
| Appearance | Modern, professional | Clean, simple |
| File size | ~3MB | ~200KB |
| Learning curve | Moderate | Easy |
| Reference similarity | ✓ Similar to InferenceMAX | Different |

**Decision:** Use Plotly.js - better match for requirements and reference site

### 7.4 Data Update Strategy

**Requirement:** Support daily data changes

**Approach:**
1. Update `inference51results.csv` with new data
2. Run `python parse_data.py`
3. Refresh browser to see new data

**Automation Option:**
```bash
# Cron job example (daily at 2 AM)
0 2 * * * cd /path/to/project && python parse_data.py
```

## 8. Expected Challenges & Solutions

### Challenge 1: Complex CSV Structure
**Issue:** Multi-row headers, grouped data rows
**Solution:** 
- Parse header separately to build column map
- Group data rows by Public ID
- Extract only "Avg. Result" rows for metrics

### Challenge 2: Missing Data
**Issue:** Not all systems test all benchmarks
**Solution:**
- Use `null` for missing values
- Skip null values when rendering chart
- Handle gracefully in hover template

### Challenge 3: Different Units
**Issue:** Tokens/s vs Samples/s vs Queries/s
**Solution:**
- Store unit metadata per benchmark
- Update Y-axis label dynamically
- Display unit in hover tooltip

### Challenge 4: Many Systems (Cluttered Chart)
**Issue:** 50+ systems could crowd the chart
**Solution:**
- Use Plotly's built-in legend toggle
- Consider adding "Top N" filter option
- Use distinct colors (Plotly handles automatically)
- Allow users to hide/show via legend

### Challenge 5: Numeric Parsing
**Issue:** CSV has comma-separated numbers (e.g., "27,803.90")
**Solution:**
- Remove commas before parsing to float
- Handle empty strings and invalid values
- Validate numeric conversion

### Challenge 6: Scenario Ordering
**Issue:** Scenarios may appear in different orders
**Solution:**
- Define fixed order: ["Offline", "Server", "Interactive"]
- Sort data according to this order
- Ensure consistent X-axis across all charts

## 9. Future Enhancements (Out of Scope)

Potential features for future iterations:

1. **Filtering Options:**
   - Filter by organization
   - Filter by accelerator type
   - Filter by accelerator count

2. **Multiple Benchmark Comparison:**
   - Show multiple benchmarks simultaneously
   - Normalize metrics for cross-benchmark comparison

3. **Table View:**
   - Alternate view with sortable table
   - Export to CSV functionality

4. **Statistical Analysis:**
   - Show mean/median/percentiles
   - Highlight best performers

5. **Time Series:**
   - Compare across MLPerf versions
   - Show performance improvements over time

6. **Advanced Interactions:**
   - Zoom and pan
   - Custom color selection
   - Save favorite configurations

## 10. Success Criteria

The implementation will be considered successful when:

- ✓ All benchmarks can be selected and visualized
- ✓ Chart clearly shows performance across scenarios
- ✓ Hover displays complete system information
- ✓ Legend click toggles system visibility
- ✓ Interface is intuitive and responsive
- ✓ Parser handles CSV correctly with 100% accuracy
- ✓ All unit tests pass
- ✓ Manual testing checklist completed
- ✓ Data can be updated by simply replacing CSV and re-parsing
- ✓ Documentation is complete and clear

## 11. Deliverables Summary

**Code Files:**
1. `parse_data.py` - CSV parser with error handling
2. `data.json` - Structured data output
3. `index.html` - Main visualization page
4. `styles.css` - Modern, responsive styling
5. `app.js` - Interactive chart logic
6. `test_parser.py` - Comprehensive unit tests

**Documentation:**
1. `README.md` - User guide and setup instructions
2. Inline code comments
3. This implementation plan

**Testing:**
1. Unit test suite with >90% coverage
2. Manual test results documented
3. Sample test data

## 12. Requirements Confirmed

The following decisions have been confirmed:

1. **Benchmark Selection:** ✓ Focus on LLM benchmarks only (deepseek-r1, llama2-70b-99, llama2-70b-99.9, llama3.1-8b-datacenter, llama3.1-405b, mixtral-8x7b)

2. **Default View:** ✓ Llama2-70B (llama2-70b-99) will be shown by default when page loads

3. **Color Scheme:** ✓ Dark theme for easier reading

4. **System Name Display:** ✓ Truncate system names in legend, show full name on hover

5. **Performance:** ✓ Implement pagination for benchmarks with many submissions

6. **Data Source:** ✓ Include link to MLPerf official results page in footer

7. **Additional Metadata:** ✓ Accelerator count shown in hover tooltip only (not in legend)

8. **Scenario Filtering:** ✓ All scenarios shown by default (no scenario filtering needed)

---

**Plan Status:** Approved - Ready for Implementation
**Next Step:** Begin implementation starting with parser
**Estimated Implementation Time:** 6-8 hours for complete solution with tests

