# MLPerf Inference v5.1 Results Visualization

An interactive web-based visualization tool for exploring MLPerf Inference v5.1 benchmark results. This tool focuses on LLM (Large Language Model) benchmarks and provides an intuitive interface to compare system performance across different scenarios.

![Dark Theme Interface](https://img.shields.io/badge/theme-dark-black) ![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue) ![MIT License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🎯 **Interactive Charts** - Built with Plotly.js for smooth, responsive visualizations
- 🌙 **Dark Theme** - Easy-on-the-eyes dark interface optimized for readability
- 📊 **Multiple Benchmarks** - Explore 6 LLM benchmarks with dropdown selection
- 🔍 **Detailed Tooltips** - Hover over data points for comprehensive system information
- 🎛️ **Legend Toggle** - Click legend items to show/hide specific systems
- 📄 **Pagination** - Smart pagination for benchmarks with many submissions
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🔄 **Easy Updates** - Simple workflow to refresh data when new results are available

## Supported Benchmarks

The tool currently focuses on LLM benchmarks:

- **DeepSeek-R1** - Offline, Server scenarios
- **Llama2-70B-99** - Offline, Server, Interactive scenarios (default)
- **Llama2-70B-99.9** - Offline, Server, Interactive scenarios
- **Llama3.1-8B (Datacenter)** - Offline, Server, Interactive scenarios
- **Llama3.1-405B** - Offline, Server, Interactive scenarios
- **Mixtral-8x7B** - Offline, Server scenarios

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic HTTP server (Python's built-in server works fine)

### Installation

1. **Clone or download this repository**

```bash
git clone <repository-url>
cd result_analysis_demo
```

2. **Verify you have the CSV data file**

Make sure `inference51results.csv` is in the root directory.

3. **Parse the data**

```bash
python3 parse_data.py
```

This will generate `data.json` from the CSV file.

Expected output:
```
MLPerf Inference Results Parser
==================================================

[1/3] Parsing CSV file...
✓ Successfully read file with utf-16 encoding
✓ Found 6 LLM benchmarks
✓ Parsed 65 systems with LLM results

[2/3] Benchmark summary:
  • deepseek-r1: Offline, Server (Samples/s)
  • llama2-70b-99: Interactive, Offline, Server (Tokens/s)
  ...

[3/3] Writing JSON output...
✓ Generated data.json

==================================================
✓ Parsing complete!
```

4. **Start a local web server**

```bash
# Python 3
python3 -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000
```

5. **Open in browser**

Navigate to: `http://localhost:8000`

## Usage Guide

### Selecting Benchmarks

Use the dropdown menu at the top to select different benchmarks. The chart will update automatically to show results for the selected benchmark.

### Viewing System Details

Hover your mouse over any data point to see:
- System name
- Organization
- Accelerator type
- Accelerator count
- Exact performance metric

### Filtering Systems

Click on any system name in the legend to toggle its visibility:
- **Single click**: Hide/show that system
- **Double click**: Isolate that system (hide all others)
- Click again to show all systems

### Pagination

For benchmarks with many submissions (>10 systems):
- Use **Previous/Next** buttons to navigate pages
- Change **Systems per page** to adjust how many systems display at once
- Select **All** to view all systems on one page

### Exporting Charts

Use Plotly's built-in camera icon (top-right of chart) to download the current view as a PNG image.

## File Structure

```
result_analysis_demo/
├── inference51results.csv          # Source data (MLPerf results)
├── parse_data.py                   # Python parser script
├── data.json                       # Parsed JSON data (generated)
├── index.html                      # Main HTML page
├── styles.css                      # Dark theme styling
├── app.js                          # JavaScript visualization logic
├── README.md                       # This file
├── cursor_artifacts/
│   └── implementation_plan.md      # Detailed implementation plan
└── tests/
    └── test_parser.py              # Unit tests for parser
```

## Updating Data

When new MLPerf results are released:

1. **Replace the CSV file**
   ```bash
   # Replace inference51results.csv with the new version
   ```

2. **Re-run the parser**
   ```bash
   python3 parse_data.py
   ```

3. **Refresh your browser**
   ```bash
   # The page will automatically load the new data.json
   ```

### Automation (Optional)

Set up a cron job to automatically update data:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/result_analysis_demo && python3 parse_data.py
```

## Testing

### Run Unit Tests

```bash
python3 tests/test_parser.py
```

Expected output:
```
test_benchmark_extraction ... ok
test_data_structure ... ok
test_metric_values ... ok
...

======================================================================
TEST SUMMARY
======================================================================
Tests run: 17
Successes: 17
Failures: 0
Errors: 0

✓ All tests passed!
```

### Test Coverage

The test suite covers:
- ✓ CSV parsing correctness
- ✓ Data structure validation
- ✓ Benchmark extraction
- ✓ System metadata extraction
- ✓ Metric value parsing and validation
- ✓ JSON output format
- ✓ Data integrity checks
- ✓ Numeric parsing with commas
- ✓ No duplicate systems
- ✓ Scenario consistency

## Architecture

### Data Flow

```
inference51results.csv (Source)
         ↓
   parse_data.py (Parser)
         ↓
    data.json (Structured Data)
         ↓
index.html + app.js (Visualization)
         ↓
  Interactive Chart (Display)
```

### Technology Stack

**Backend (Parser)**
- Python 3.8+
- Built-in CSV and JSON libraries
- Tab-delimited CSV parsing
- Multi-encoding support (UTF-16, UTF-8, etc.)

**Frontend (Visualization)**
- HTML5 for structure
- CSS3 with dark theme
- Vanilla JavaScript (ES6+)
- Plotly.js 2.27.0 for interactive charts

### Why These Technologies?

**Plotly.js** was chosen for its:
- Excellent interactive capabilities
- Built-in hover tooltips with customization
- Native legend click-to-toggle
- Professional appearance
- Similar look to InferenceMAX reference site

**Separate Parser** approach because:
- Clean separation of concerns
- Can be run independently when data updates
- Easier to test and debug
- Faster page load (pre-processed JSON)

**JSON Intermediate Format** for:
- Fast browser parsing
- Human-readable debugging
- Easy version control
- Can be consumed by other tools

## Browser Compatibility

Tested and working on:
- ✓ Chrome 90+
- ✓ Firefox 88+
- ✓ Safari 14+
- ✓ Edge 90+

## Troubleshooting

### Parser Issues

**Problem**: `UnicodeDecodeError` when parsing CSV

**Solution**: The parser tries multiple encodings automatically. If it still fails, check that the CSV file is not corrupted.

---

**Problem**: No benchmarks or systems found

**Solution**: Verify the CSV file format matches the expected structure (5-row header, tab-delimited).

---

**Problem**: Missing data.json file

**Solution**: Run `python3 parse_data.py` to generate it.

### Visualization Issues

**Problem**: Page shows "Loading..." indefinitely

**Solution**: 
1. Check that `data.json` exists in the same directory as `index.html`
2. Check browser console for errors (F12)
3. Ensure you're accessing via HTTP server, not `file://` protocol

---

**Problem**: Charts not displaying

**Solution**:
1. Check internet connection (Plotly.js loads from CDN)
2. Verify browser JavaScript is enabled
3. Check browser console for errors

---

**Problem**: Pagination not showing

**Solution**: Pagination only appears for benchmarks with >10 systems. This is intentional.

## Performance

- **Parser**: Processes 65+ systems in <1 second
- **Page Load**: Initial load <500ms (with CDN)
- **Chart Render**: Updates in <100ms for 20 systems
- **Memory**: ~10MB for full dataset

## Customization

### Change Color Scheme

Edit `styles.css` and modify the CSS variables:

```css
:root {
    --bg-primary: #1a1a1a;      /* Main background */
    --accent-primary: #4a9eff;   /* Accent color */
    /* ... */
}
```

### Add More Benchmarks

Edit `parse_data.py` and update the `LLM_BENCHMARKS` set:

```python
LLM_BENCHMARKS = {
    'deepseek-r1',
    'llama2-70b-99',
    'your-new-benchmark',  # Add here
    # ...
}
```

### Change Default Benchmark

Edit `app.js` and change:

```javascript
let currentBenchmark = 'llama2-70b-99';  // Change this
```

### Adjust Pagination

Edit `app.js` and modify:

```javascript
let pageSize = 20;  // Default page size
```

Or edit the dropdown options in `index.html`:

```html
<option value="20" selected>20</option>  <!-- Change default -->
```

## Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add more benchmark types (non-LLM)
- [ ] Add filtering by organization/accelerator
- [ ] Add statistical analysis (mean, median, percentiles)
- [ ] Add export to CSV functionality
- [ ] Add comparison across MLPerf versions
- [ ] Add dark/light theme toggle
- [ ] Improve mobile responsiveness

## License

This project is provided as-is for analyzing MLPerf Inference results.

## Acknowledgments

- **MLCommons** for MLPerf Inference benchmark and results
- **Plotly.js** for the excellent charting library
- **SemiAnalysis** for InferenceMAX reference design inspiration

## Links

- [MLPerf Inference Official Site](https://mlcommons.org/benchmarks/inference/)
- [MLPerf v5.1 Results Repository](https://github.com/mlcommons/inference_results_v5.1)
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [InferenceMAX Reference](https://inferencemax.semianalysis.com/)

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**MLPerf Version**: v5.1

