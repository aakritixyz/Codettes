const API_URL = "http://127.0.0.1:8000";

// 1. Start-up: Dropdown Loading
window.onload = async () => {
    const select = document.getElementById('dishSelect');
    try {
        console.log("Connecting to Annadata Forensic Engine...");
        const res = await fetch(`${API_URL}/get-menu`);
        if (!res.ok) throw new Error("Backend Error");
        
        const dishes = await res.json();
        
        // Populate dropdown
        select.innerHTML = dishes.map(d => 
            `<option value="${d.id}">${d.title}</option>`
        ).join('');

        updateHint();
    } catch (e) {
        console.error("Backend offline:", e);
        select.innerHTML = "<option value=''>Error loading RecipeDB</option>";
    }
};

// 2. Hint system update (Market price estimation hint)
function updateHint() {
    const select = document.getElementById('dishSelect');
    const hintText = document.getElementById('hintCost');
    if(select.value) {
        hintText.innerHTML = "Recipe Data Linked ✅ <span class='text-[10px] block opacity-50 text-slate-500'>Ready for molecular scan</span>";
    } else {
        hintText.innerText = "Select a dish to scan";
    }
}

// 3. Main Analyze Function
async function analyze() {
    const recipeId = document.getElementById('dishSelect').value;
    const price = document.getElementById('priceInput').value;

    if(!price || !recipeId) {
        alert("Bhai, pehle dish select karo aur vendor price daalo!");
        return;
    }

    // UI States: Hide empty/results, show loader
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('analysisContent').classList.add('hidden');
    document.getElementById('scanLoader').classList.remove('hidden');

    try {
        const res = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                recipe_id: recipeId, 
                vendor_price: parseFloat(price) 
            })
        });

        const data = await res.json();
        showResults(data);
        
    } catch (e) {
        console.error("Audit Failed:", e);
        alert("Integrity Engine link failed! Check if Python backend is running.");
        resetUI();
    }
}

// 4. Results Display Logic (Cleaned & Integrated)
function showResults(data) {
    document.getElementById('scanLoader').classList.add('hidden');
    document.getElementById('analysisContent').classList.remove('hidden');

    const banner = document.getElementById('verdictBanner');
    const title = document.getElementById('vTitle');
    const desc = document.getElementById('vDesc');
    const icon = document.getElementById('vIcon');
    const hintText = document.getElementById('hintCost');

    // Display inflation and honest cost in the hint box
    hintText.innerHTML = `₹${data.honest_cost} <span class="ml-2 text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">Inflation: ${data.inflation}</span>`;

    // Reset Classes
    banner.className = "p-6 rounded-3xl flex gap-4 items-center border";

    if(data.status === "SAFE") {
        banner.classList.add("bg-emerald-50", "text-emerald-700", "border-emerald-100");
        title.innerText = "SAFE INTEGRITY";
        icon.innerHTML = "✓";
        desc.innerText = data.verdict || "Price aligns with market standards.";
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#059669', '#10b981'] });
        }
    } else if(data.status === "SUSPICIOUS") {
        banner.classList.add("bg-amber-50", "text-amber-700", "border-amber-100");
        title.innerText = "SUSPICIOUS MARGINS";
        icon.innerHTML = "?";
        desc.innerText = data.verdict || "Thin margins detected. Quality might be compromised.";
    } else {
        banner.classList.add("bg-red-50", "text-red-700", "border-red-100");
        title.innerText = "ADULTERATION RISK";
        icon.innerHTML = "!";
        desc.innerText = data.verdict || "Price is too low. High risk of substandard ingredients.";
    }

    // Molecular Breakdown List
    const list = document.getElementById('breakdownUl');
    if (data.breakdown && data.breakdown.length > 0) {
        list.innerHTML = data.breakdown.map(item => `
            <div class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <span class="font-bold text-slate-600 text-xs uppercase tracking-tight">${item.item}</span>
                <span class="font-extrabold text-slate-900">₹${item.cost}</span>
            </div>
        `).join('');
    } else {
        list.innerHTML = "<p class='text-center py-4 text-slate-400 text-sm'>No high-cost markers detected.</p>";
    }
}

// 5. Utility Functions
function resetUI() {
    document.getElementById('scanLoader').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('analysisContent').classList.add('hidden');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    const targetTab = document.getElementById(tabId);
    if(targetTab) targetTab.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${tabId}`);
    if(activeBtn) activeBtn.classList.add('active');
    
    document.getElementById('current-page').innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}