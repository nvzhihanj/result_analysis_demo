# MLPerf Visualization - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Parse the Data
```bash
python3 parse_data.py
```
Expected output: ✓ Generated data.json

### Step 2: Start Web Server
```bash
python3 -m http.server 8000
```
Server will run on port 8000

### Step 3: Open in Browser
```
http://localhost:8000
```

---

## 📊 Using the Visualization

### Select a Benchmark
- Use the dropdown at the top
- Default: Llama2-70B-99

### View Details
- **Hover** over any point → See system details
- **Click** legend item → Toggle system visibility
- **Double-click** legend → Isolate one system

### Navigate Large Datasets
- Use **Previous/Next** buttons for pagination
- Change **Systems per page** dropdown
- Select **All** to view everything

---

## 🔄 Update Data (When New Results Available)

```bash
# 1. Replace CSV file
cp new_results.csv inference51results.csv

# 2. Re-parse
python3 parse_data.py

# 3. Refresh browser (Ctrl+R or Cmd+R)
```

---

## ✅ Verify Everything Works

```bash
# Run validation
python3 validate.py

# Run tests
python3 tests/test_parser.py
```

Both should show all ✓ checks passing.

---

## 📁 Project Structure

```
result_analysis_demo/
├── inference51results.csv    → Source data (MLPerf CSV)
├── parse_data.py             → Parser script
├── data.json                 → Parsed data (auto-generated)
├── index.html                → Main page
├── styles.css                → Dark theme
├── app.js                    → Chart logic
├── README.md                 → Full documentation
├── QUICKSTART.md             → This file
├── validate.py               → Validation script
└── tests/
    └── test_parser.py        → Unit tests
```

---

## 🎯 Features Summary

✅ 6 LLM benchmarks  
✅ 65+ systems visualized  
✅ Dark theme interface  
✅ Interactive hover tooltips  
✅ Legend click-to-toggle  
✅ Smart pagination  
✅ Responsive design  

---

## 🆘 Troubleshooting

**Problem**: Page shows "Loading..." forever  
**Solution**: Check `data.json` exists, run `python3 parse_data.py`

**Problem**: Parser fails  
**Solution**: Verify `inference51results.csv` exists and is not corrupted

**Problem**: Charts not showing  
**Solution**: Check internet connection (Plotly.js loads from CDN)

---

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Implementation Details**: See `cursor_artifacts/implementation_plan.md`
- **Completion Report**: See `cursor_artifacts/COMPLETION_SUMMARY.md`

---

## 🌐 Links

- [MLPerf Inference Official](https://mlcommons.org/benchmarks/inference/)
- [MLPerf v5.1 Results](https://github.com/mlcommons/inference_results_v5.1)
- [Plotly.js Docs](https://plotly.com/javascript/)

---

**Version**: 1.0.0  
**MLPerf**: v5.1  
**Last Updated**: October 20, 2025

