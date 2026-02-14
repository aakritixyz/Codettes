const API_URL = "http://127.0.0.1:8080";
let map; // Global Map Variable
let allDishes = [];

// 1. Sidebar/View Switching Logic
function switchView(view) {
    const scanner = document.getElementById('scannerView');
    const mapView = document.getElementById('mapView');
    const navScanner = document.getElementById('navScanner');
    const navMap = document.getElementById('navMap');

    if(view === 'map') {
        scanner.classList.add('hidden');
        mapView.classList.remove('hidden');
        navMap.classList.add('active');
        navScanner.classList.remove('active');
        
        // Fix for Leaflet: Container visibility refresh
        setTimeout(() => {
            if (!map) {
                initMap();
            } else {
                map.invalidateSize(); // Reset map boundaries
            }
        }, 400);
    } else {
        scanner.classList.remove('hidden');
        mapView.classList.add('hidden');
        navScanner.classList.add('active');
        navMap.classList.remove('active');
    }
}

// 2. Initialize Heatmap (Leaflet.js)
async function initMap() {
    // State center (Lucknow/UP example)
    map = L.map('map').setView([26.8467, 80.9462], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    try {
        const res = await fetch(`${API_URL}/get-heatmap-data`);
        const data = await res.json();

        data.forEach(p => {
            const color = p.risk > 0.7 ? '#ef4444' : (p.risk > 0.4 ? '#f59e0b' : '#10b981');
            
            L.circle([p.lat, p.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                radius: 40000 
            })
            .addTo(map)
            .bindPopup(`
                <div style="font-family: sans-serif;">
                    <b style="font-size:14px;">${p.city}</b><br>
                    <span style="color:red; font-weight:bold;">Inflation: ${p.inflation}</span><br>
                    <span>Adulteration Risk: ${Math.round(p.risk * 100)}%</span>
                </div>
            `);
        });
    } catch (e) {
        console.error("Map Data Load Error:", e);
    }
}

// 3. Tab Switching (Report vs Solutions)
function switchTab(tab) {
    document.getElementById('reportView').classList.toggle('hidden', tab !== 'report');
    document.getElementById('flavorView').classList.toggle('hidden', tab !== 'flavor');
    document.getElementById('tabBtnReport').classList.toggle('active', tab === 'report');
    document.getElementById('tabBtnFlavor').classList.toggle('active', tab === 'flavor');
}

// 4. Main Forensic Analysis Engine
async function analyze() {
    const dish = document.getElementById('dishSelect').value;
    const priceStr = document.getElementById('priceInput').value;
    
    if(!priceStr || parseFloat(priceStr) <= 0) return alert("Bhai, menu price toh dalo!");
    const vendorPrice = parseFloat(priceStr);

    // UI State Reset
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('scanLoader').classList.remove('hidden');
    document.getElementById('analysisContent').classList.add('hidden');
    document.getElementById('resultTabs').classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ dish_name: dish, vendor_price: vendorPrice })
        });
        
        const data = await res.json();

        // --- DYNAMIC SCORING LOGIC ---
        const honest = data.honest_cost;
        const ratio = vendorPrice / honest;
        
        let score = ratio >= 0.9 ? (85 + Math.random() * 10) : 
                    (ratio >= 0.6 ? 50 + ratio * 30 : 20 + ratio * 20);
        score = score.toFixed(1);

        const riskLevel = score > 80 ? "LOW" : (score > 50 ? "MEDIUM" : "HIGH");
        const riskColor = score > 80 ? '#10b981' : (score > 50 ? '#f59e0b' : '#ef4444');

        // --- UPDATE UI ---
        document.getElementById('honestPrice').innerText = "₹" + honest;
        
        const integrityEl = document.getElementById('integrityVal');
        integrityEl.innerText = score + "%";
        integrityEl.style.color = riskColor;

        const riskEl = document.getElementById('riskVal');
        riskEl.innerText = riskLevel;
        riskEl.style.color = riskColor;

        // --- NUTRITION GRID UPDATE ---
        const nutriGrid = document.getElementById('nutritionGrid');
        nutriGrid.innerHTML = data.nutrition_impact.map(m => `
            <div class="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div class="text-[7px] font-bold text-slate-400 uppercase mb-1">${m.label}</div>
                <div class="text-[10px] font-black" style="color: ${m.color}">${m.value}</div>
            </div>
        `).join('');

        // Breakdown Table
        document.getElementById('breakdownUl').innerHTML = data.breakdown.map(b => `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-[9px] font-bold text-slate-500 uppercase">${b.item}</span>
                <span class="text-[10px] font-black text-slate-900">₹${b.cost}</span>
            </div>
        `).join('');

        // Adulterant Twins (FlavorDB)
        const altList = document.getElementById('alternativesList');
        altList.innerHTML = data.suggestions.length > 0 ? data.suggestions.map(s => `
            <div class="p-4 bg-white border border-blue-100 rounded-xl shadow-sm">
                <div class="text-[8px] font-bold text-slate-300 line-through uppercase">${s.original}</div>
                <div class="text-sm font-black text-slate-800">${s.substitute}</div>
                <div class="text-[9px] text-slate-500 italic mt-1">${s.science}</div>
            </div>
        `).join('') : "<p class='text-center py-10 text-slate-400 text-xs uppercase font-bold tracking-widest'>No anomalies found</p>";

        // Reveal Content
        document.getElementById('scanLoader').classList.add('hidden');
        document.getElementById('analysisContent').classList.remove('hidden');
        document.getElementById('resultTabs').classList.remove('hidden');
        
        if(score > 80) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    } catch (e) {
        console.error("Audit Fail:", e);
        alert("Backend Offline! main.py check karo.");
    }
}

// 5. Initial Menu Load
async function loadMenu() {
    try {
        const res = await fetch(`${API_URL}/get-menu`);
        const dishes = await res.json();
        document.getElementById('dishSelect').innerHTML = dishes.map(d => `<option value="${d}">${d}</option>`).join('');
    } catch (e) {
        console.error("Menu connection failed");
    }
}

// Start-up scripts
window.onload = () => {
    loadMenu();
    if(window.lucide) lucide.createIcons();
};