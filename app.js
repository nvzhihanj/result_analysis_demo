/**
 * MLPerf Inference Results Visualization
 * Interactive chart using Plotly.js with pagination support
 */

// Global state
let data = null;
let currentBenchmark = 'llama2-70b-99';

// Separate pagination state for each chart
let perSystemPage = 1;
let perSystemPageSize = 20;
let perAcceleratorPage = 1;
let perAcceleratorPageSize = 20;

let filteredSystemsPerSystem = [];
let filteredSystemsPerAccelerator = [];

// Scenario order for consistent X-axis
const SCENARIO_ORDER = ['Offline', 'Server', 'Interactive'];

/**
 * Initialize the application
 */
async function init() {
    try {
        console.log('1. Loading data...');
        await loadData();
        console.log('2. Data loaded successfully');
        
        console.log('3. Populating dropdown...');
        populateBenchmarkDropdown();
        console.log('4. Dropdown populated');
        
        console.log('5. Setting up event listeners...');
        setupEventListeners();
        console.log('6. Event listeners set up');
        
        console.log('7. Checking Plotly...');
        if (typeof Plotly === 'undefined') {
            throw new Error('Plotly.js is not loaded. Check your internet connection.');
        }
        console.log('7.1. Plotly is loaded');
        
        console.log('7.2. Updating chart...');
        updateChart();
        console.log('8. Chart updated');
        
        hideLoading();
        console.log('✓ Initialization complete!');
    } catch (error) {
        console.error('Error initializing app:', error);
        console.error('Error stack:', error.stack);
        showError(`Failed to load: ${error.message}`);
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
        'dlrm-v2-99': 'DLRM-v2-99',
        'dlrm-v2-99.9': 'DLRM-v2-99.9',
        'llama2-70b-99': 'Llama2-70B-99',
        'llama2-70b-99.9': 'Llama2-70B-99.9',
        'llama3.1-8b-datacenter': 'Llama3.1-8B (Datacenter)',
        'llama3.1-405b': 'Llama3.1-405B',
        'mixtral-8x7b': 'Mixtral-8x7B',
        'retinanet': 'RetinaNet',
        'rgat': 'R-GAT',
        'stable-diffusion-xl': 'Stable Diffusion XL',
        'whisper': 'Whisper'
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
        perSystemPage = 1;  // Reset both to first page
        perAcceleratorPage = 1;
        updateChart();
    });
    
    // Per-System Pagination
    document.getElementById('prev-page-system').addEventListener('click', () => {
        if (perSystemPage > 1) {
            perSystemPage--;
            updateChart();
        }
    });
    
    document.getElementById('next-page-system').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredSystemsPerSystem.length / perSystemPageSize);
        if (perSystemPage < totalPages) {
            perSystemPage++;
            updateChart();
        }
    });
    
    document.getElementById('page-size-system').addEventListener('change', (e) => {
        perSystemPageSize = parseInt(e.target.value);
        if (perSystemPageSize === -1) {
            perSystemPageSize = filteredSystemsPerSystem.length;  // Show all
        }
        perSystemPage = 1;  // Reset to first page
        updateChart();
    });
    
    // Per-Accelerator Pagination
    document.getElementById('prev-page-accelerator').addEventListener('click', () => {
        if (perAcceleratorPage > 1) {
            perAcceleratorPage--;
            updateChart();
        }
    });
    
    document.getElementById('next-page-accelerator').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredSystemsPerAccelerator.length / perAcceleratorPageSize);
        if (perAcceleratorPage < totalPages) {
            perAcceleratorPage++;
            updateChart();
        }
    });
    
    document.getElementById('page-size-accelerator').addEventListener('change', (e) => {
        perAcceleratorPageSize = parseInt(e.target.value);
        if (perAcceleratorPageSize === -1) {
            perAcceleratorPageSize = filteredSystemsPerAccelerator.length;  // Show all
        }
        perAcceleratorPage = 1;  // Reset to first page
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
 * Update pagination controls for both charts
 */
function updatePaginationControls() {
    // Update Per-System pagination
    const totalSystemsPerSystem = filteredSystemsPerSystem.length;
    const totalPagesPerSystem = Math.ceil(totalSystemsPerSystem / (perSystemPageSize === -1 ? totalSystemsPerSystem : perSystemPageSize));
    
    const paginationDivSystem = document.getElementById('pagination-per-system');
    if (totalSystemsPerSystem > 10) {
        paginationDivSystem.style.display = 'flex';
        document.getElementById('page-info-system').textContent = `Page ${perSystemPage} of ${totalPagesPerSystem}`;
        document.getElementById('prev-page-system').disabled = perSystemPage === 1;
        document.getElementById('next-page-system').disabled = perSystemPage === totalPagesPerSystem;
    } else {
        paginationDivSystem.style.display = 'none';
    }
    
    // Update Per-Accelerator pagination
    const totalSystemsPerAccelerator = filteredSystemsPerAccelerator.length;
    const totalPagesPerAccelerator = Math.ceil(totalSystemsPerAccelerator / (perAcceleratorPageSize === -1 ? totalSystemsPerAccelerator : perAcceleratorPageSize));
    
    const paginationDivAccelerator = document.getElementById('pagination-per-accelerator');
    if (totalSystemsPerAccelerator > 10) {
        paginationDivAccelerator.style.display = 'flex';
        document.getElementById('page-info-accelerator').textContent = `Page ${perAcceleratorPage} of ${totalPagesPerAccelerator}`;
        document.getElementById('prev-page-accelerator').disabled = perAcceleratorPage === 1;
        document.getElementById('next-page-accelerator').disabled = perAcceleratorPage === totalPagesPerAccelerator;
    } else {
        paginationDivAccelerator.style.display = 'none';
    }
}

/**
 * Truncate system name for legend
 */
function truncateSystemName(name, maxLength = 35) {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
}

/**
 * Update the charts with current benchmark
 */
function updateChart() {
    if (!data) return;
    
    // Find benchmark info
    const benchmark = data.benchmarks.find(b => b.name === currentBenchmark);
    if (!benchmark) return;
    
    // Filter systems by benchmark (get fresh copy for each chart)
    const baseSystems = filterSystemsByBenchmark(currentBenchmark);
    
    // Per-System: Sort by total Offline score (highest first)
    filteredSystemsPerSystem = [...baseSystems];
    filteredSystemsPerSystem.sort((a, b) => {
        const aOffline = a.results[currentBenchmark]['Offline'] || 0;
        const bOffline = b.results[currentBenchmark]['Offline'] || 0;
        return bOffline - aOffline;  // Descending order
    });
    
    // Per-Accelerator: Sort by per-accelerator Offline score (highest first)
    filteredSystemsPerAccelerator = [...baseSystems];
    filteredSystemsPerAccelerator.sort((a, b) => {
        const aOffline = (a.results[currentBenchmark]['Offline'] || 0) / (a.num_accelerators || 1);
        const bOffline = (b.results[currentBenchmark]['Offline'] || 0) / (b.num_accelerators || 1);
        return bOffline - aOffline;  // Descending order
    });
    
    // Paginate separately for each chart
    const paginatedSystemsPerSystem = getPaginatedSystems(filteredSystemsPerSystem, perSystemPage, perSystemPageSize);
    const paginatedSystemsPerAccelerator = getPaginatedSystems(filteredSystemsPerAccelerator, perAcceleratorPage, perAcceleratorPageSize);
    
    // Update info display
    document.getElementById('system-count').textContent = 
        `${filteredSystemsPerSystem.length} systems`;
    document.getElementById('scenario-info').textContent = 
        `Scenarios: ${benchmark.scenarios.join(', ')}`;
    
    // Update pagination controls for both charts
    updatePaginationControls();
    
    // Render both charts with their respective paginated data
    renderPerSystemChart(benchmark, paginatedSystemsPerSystem);
    renderPerAcceleratorChart(benchmark, paginatedSystemsPerAccelerator);
}

/**
 * Render the per-system performance chart
 */
function renderPerSystemChart(benchmark, paginatedSystems) {
    // Prepare chart data
    const traces = [];
    const colors = getColorPalette(paginatedSystems.length);
    
    paginatedSystems.forEach((system, idx) => {
        const results = system.results[currentBenchmark];
        
        // Get data only for scenarios that have values
        // IMPORTANT: Use SCENARIO_ORDER (not benchmark.scenarios) to ensure correct visual line connections
        // This ensures proper line connections: Offline→Server→Interactive when all present
        const xData = [];
        const yData = [];
        
        // Iterate through scenarios in the correct VISUAL order (Offline, Server, Interactive)
        // Only include scenarios with actual (non-null) values
        SCENARIO_ORDER.forEach(scenario => {
            // Only add if this benchmark actually has this scenario
            if (benchmark.scenarios.includes(scenario)) {
                const value = results[scenario];
                if (value !== null && value !== undefined) {
                    xData.push(scenario);
                    yData.push(value);
                }
            }
        });
        
        // Skip if no valid data at all
        if (yData.length === 0) return;
        
        // Create hover template with full system info
        const hoverTemplate = 
            `<b>${system.system_name}</b><br>` +
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
            fullName: system.system_name,  // Full name for reference
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
            text: `${formatBenchmarkName(currentBenchmark)} Performance (per system)`,
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
            filename: `mlperf_${currentBenchmark}_per_system_page${perSystemPage}`,
            height: 800,
            width: 1400
        }
    };
    
    // Render chart
    Plotly.newPlot('chart-per-system', traces, layout, config);
}

/**
 * Render the per-accelerator performance chart
 */
function renderPerAcceleratorChart(benchmark, paginatedSystems) {
    // Prepare chart data (same as per-system but divided by num_accelerators)
    const traces = [];
    const colors = getColorPalette(paginatedSystems.length);
    
    paginatedSystems.forEach((system, idx) => {
        const results = system.results[currentBenchmark];
        const numAccelerators = system.num_accelerators || 1;  // Default to 1 if not specified
        
        // Get data only for scenarios that have values
        // IMPORTANT: Use SCENARIO_ORDER (not benchmark.scenarios) to ensure correct visual line connections
        // This ensures proper line connections: Offline→Server→Interactive when all present
        const xData = [];
        const yData = [];
        
        // Iterate through scenarios in the correct VISUAL order (Offline, Server, Interactive)
        // Only include scenarios with actual (non-null) values
        SCENARIO_ORDER.forEach(scenario => {
            // Only add if this benchmark actually has this scenario
            if (benchmark.scenarios.includes(scenario)) {
                const value = results[scenario];
                if (value !== null && value !== undefined) {
                    xData.push(scenario);
                    yData.push(value / numAccelerators);  // Divide by number of accelerators
                }
            }
        });
        
        // Skip if no valid data at all
        if (yData.length === 0) return;
        
        // Create hover template with full system info
        const hoverTemplate = 
            `<b>${system.system_name}</b><br>` +
            'Scenario: %{x}<br>' +
            `Performance: %{y:.2f} ${benchmark.unit} per accelerator<br>` +
            `Accelerator: ${system.accelerator}<br>` +
            `Count: ${system.num_accelerators}<br>` +
            `Organization: ${system.organization}` +
            '<extra></extra>';
        
        traces.push({
            x: xData,
            y: yData,
            name: truncateSystemName(system.system_name),  // Truncated for legend
            fullName: system.system_name,  // Full name for reference
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
            text: `${formatBenchmarkName(currentBenchmark)} Performance (per accelerator)`,
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
                text: `Performance (${benchmark.unit} per accelerator)`,
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
            filename: `mlperf_${currentBenchmark}_per_accelerator_page${perAcceleratorPage}`,
            height: 800,
            width: 1400
        }
    };
    
    // Render chart
    Plotly.newPlot('chart-per-accelerator', traces, layout, config);
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

