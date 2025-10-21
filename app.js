/**
 * MLPerf Inference Results Visualization
 * Interactive chart using Plotly.js with pagination support
 */

// Global state
let data = null;
let currentBenchmark = 'llama2-70b-99';
let currentPage = 1;
let pageSize = 20;
let filteredSystems = [];

// Scenario order for consistent X-axis
const SCENARIO_ORDER = ['Offline', 'Server', 'Interactive'];

/**
 * Initialize the application
 */
async function init() {
    try {
        await loadData();
        populateBenchmarkDropdown();
        setupEventListeners();
        updateChart();
        hideLoading();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load data. Please check that data.json exists.');
    }
}

/**
 * Load data from JSON file
 */
async function loadData() {
    const response = await fetch('data.json');
    data = await response.json();
    
    // Update metadata display
    document.getElementById('data-timestamp').textContent = data.metadata.generated_date;
}

/**
 * Populate benchmark dropdown
 */
function populateBenchmarkDropdown() {
    const select = document.getElementById('benchmark-select');
    select.innerHTML = '';
    
    data.benchmarks.forEach(benchmark => {
        const option = document.createElement('option');
        option.value = benchmark.name;
        option.textContent = formatBenchmarkName(benchmark.name);
        if (benchmark.name === currentBenchmark) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Format benchmark name for display
 */
function formatBenchmarkName(name) {
    // Convert benchmark names to more readable format
    const nameMap = {
        'deepseek-r1': 'DeepSeek-R1',
        'llama2-70b-99': 'Llama2-70B-99',
        'llama2-70b-99.9': 'Llama2-70B-99.9',
        'llama3.1-8b-datacenter': 'Llama3.1-8B (Datacenter)',
        'llama3.1-405b': 'Llama3.1-405B',
        'mixtral-8x7b': 'Mixtral-8x7B'
    };
    return nameMap[name] || name;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Benchmark selection
    document.getElementById('benchmark-select').addEventListener('change', (e) => {
        currentBenchmark = e.target.value;
        currentPage = 1;  // Reset to first page
        updateChart();
    });
    
    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateChart();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredSystems.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            updateChart();
        }
    });
    
    document.getElementById('page-size').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        if (pageSize === -1) {
            pageSize = filteredSystems.length;  // Show all
        }
        currentPage = 1;  // Reset to first page
        updateChart();
    });
}

/**
 * Filter systems by benchmark and prepare data
 */
function filterSystemsByBenchmark(benchmarkName) {
    return data.systems.filter(system => {
        const results = system.results[benchmarkName];
        if (!results) return false;
        
        // Check if system has at least one non-null result for this benchmark
        return Object.values(results).some(value => value !== null);
    });
}

/**
 * Get paginated systems
 */
function getPaginatedSystems(systems, page, size) {
    if (size === -1 || size >= systems.length) {
        return systems;
    }
    const startIdx = (page - 1) * size;
    const endIdx = startIdx + size;
    return systems.slice(startIdx, endIdx);
}

/**
 * Update pagination controls
 */
function updatePaginationControls() {
    const totalSystems = filteredSystems.length;
    const totalPages = Math.ceil(totalSystems / (pageSize === -1 ? totalSystems : pageSize));
    
    // Show/hide pagination based on number of systems
    const paginationDiv = document.getElementById('pagination');
    if (totalSystems > 10) {
        paginationDiv.style.display = 'flex';
    } else {
        paginationDiv.style.display = 'none';
        return;
    }
    
    // Update page info
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Enable/disable buttons
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

/**
 * Truncate system name for legend
 */
function truncateSystemName(name, maxLength = 35) {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
}

/**
 * Update the chart with current benchmark
 */
function updateChart() {
    if (!data) return;
    
    // Find benchmark info
    const benchmark = data.benchmarks.find(b => b.name === currentBenchmark);
    if (!benchmark) return;
    
    // Filter systems by benchmark
    filteredSystems = filterSystemsByBenchmark(currentBenchmark);
    
    // Sort systems by Offline score (highest first)
    filteredSystems.sort((a, b) => {
        const aOffline = a.results[currentBenchmark]['Offline'] || 0;
        const bOffline = b.results[currentBenchmark]['Offline'] || 0;
        return bOffline - aOffline;  // Descending order
    });
    
    // Paginate after sorting
    const paginatedSystems = getPaginatedSystems(filteredSystems, currentPage, pageSize);
    
    // Update info display
    document.getElementById('system-count').textContent = 
        `${filteredSystems.length} systems (sorted by Offline score)`;
    document.getElementById('scenario-info').textContent = 
        `Scenarios: ${benchmark.scenarios.join(', ')}`;
    
    // Update pagination controls
    updatePaginationControls();
    
    // Prepare chart data
    const traces = [];
    const colors = getColorPalette(paginatedSystems.length);
    
    paginatedSystems.forEach((system, idx) => {
        const results = system.results[currentBenchmark];
        
        // Get data for all scenarios in order (use null for missing data)
        // This ensures lines connect in the correct order: Offline -> Server -> Interactive
        const xData = [];
        const yData = [];
        
        // Use consistent scenario order - add ALL scenarios, use null for missing
        benchmark.scenarios.forEach(scenario => {
            xData.push(scenario);
            const value = results[scenario];
            // Add the value if it exists, otherwise add null
            yData.push((value !== null && value !== undefined) ? value : null);
        });
        
        // Skip if ALL values are null (no valid data at all)
        if (yData.every(v => v === null)) return;
        
        // Create hover template with full system info
        const hoverTemplate = 
            '<b>%{fullData.name}</b><br>' +
            'Scenario: %{x}<br>' +
            `Performance: %{y:.2f} ${benchmark.unit}<br>` +
            `Accelerator: ${system.accelerator}<br>` +
            `Count: ${system.num_accelerators}<br>` +
            `Organization: ${system.organization}` +
            '<extra></extra>';
        
        traces.push({
            x: xData,
            y: yData,
            name: truncateSystemName(system.system_name),  // Truncated for legend
            fullName: system.system_name,  // Full name stored for reference
            type: 'scatter',
            mode: 'lines+markers',
            line: {
                color: colors[idx],
                width: 2
            },
            marker: {
                size: 8,
                color: colors[idx],
                line: {
                    color: '#1a1a1a',
                    width: 1
                }
            },
            hovertemplate: hoverTemplate
        });
    });
    
    // Chart layout with dark theme
    const layout = {
        title: {
            text: `${formatBenchmarkName(currentBenchmark)} Performance`,
            font: {
                size: 24,
                color: '#e0e0e0',
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }
        },
        xaxis: {
            title: {
                text: 'Scenario',
                font: { size: 16, color: '#e0e0e0' }
            },
            tickfont: { size: 14, color: '#b0b0b0' },
            gridcolor: '#3a3a3a',
            linecolor: '#404040',
            type: 'category',
            categoryorder: 'array',
            categoryarray: SCENARIO_ORDER
        },
        yaxis: {
            title: {
                text: `Performance (${benchmark.unit})`,
                font: { size: 16, color: '#e0e0e0' }
            },
            tickfont: { size: 14, color: '#b0b0b0' },
            gridcolor: '#3a3a3a',
            linecolor: '#404040'
        },
        plot_bgcolor: '#252525',
        paper_bgcolor: '#2a2a2a',
        hovermode: 'closest',
        showlegend: true,
        legend: {
            orientation: 'v',
            x: 1.02,
            y: 1,
            xanchor: 'left',
            font: { size: 11, color: '#b0b0b0' },
            bgcolor: 'rgba(42, 42, 42, 0.8)',
            bordercolor: '#404040',
            borderwidth: 1
        },
        margin: {
            l: 80,
            r: 200,
            t: 80,
            b: 80
        }
    };
    
    // Chart configuration
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: `mlperf_${currentBenchmark}_page${currentPage}`,
            height: 800,
            width: 1400
        }
    };
    
    // Render chart
    Plotly.newPlot('chart', traces, layout, config);
}

/**
 * Generate color palette for traces
 */
function getColorPalette(count) {
    // Use Plotly's default color palette
    const baseColors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
        '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
        '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173'
    ];
    
    // If we need more colors, generate them
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = `
        <div style="color: #ff5555; font-size: 1.2rem;">
            <p>⚠ ${message}</p>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

