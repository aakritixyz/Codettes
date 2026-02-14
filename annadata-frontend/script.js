async function analyze() {
    const dish = document.getElementById('dishSelect').value;
    const priceStr = document.getElementById('priceInput').value;
    
    if(!priceStr || parseFloat(priceStr) <= 0) return alert("Bhai, price toh dalo!");
    const vendorPrice = parseFloat(priceStr);

    console.log("--- New Audit Started ---");
    console.log("Dish:", dish, "| Vendor Price:", vendorPrice);

    // UI Reset
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
        const honestPrice = data.honest_cost;
        console.log("Backend Honest Price:", honestPrice);

        // --- CALCULATION LOGIC ---
        let priceRatio = vendorPrice / honestPrice;
        let integrityScore = (priceRatio >= 0.9) ? (85 + Math.random() * 10) : 
                             (priceRatio >= 0.6) ? (50 + priceRatio * 30) : 
                             (20 + priceRatio * 20);
        
        integrityScore = parseFloat(integrityScore).toFixed(1);
        console.log("Calculated Integrity:", integrityScore + "%");

        let riskLevel = (integrityScore > 80) ? "LOW" : (integrityScore > 50) ? "MEDIUM" : "HIGH";
        let riskColor = (riskLevel === "LOW") ? "#10b981" : (riskLevel === "MEDIUM") ? "#f59e0b" : "#ef4444";

        // --- UI UPDATE (Ye tabhi dikhega agar IDs match hongi) ---
        const integrityEl = document.getElementById('integrityVal');
        const riskEl = document.getElementById('riskVal');
        const honestPriceEl = document.getElementById('honestPrice');

        if(integrityEl && riskEl && honestPriceEl) {
            integrityEl.innerText = integrityScore + "%";
            integrityEl.style.color = riskColor;
            riskEl.innerText = riskLevel;
            riskEl.style.color = riskColor;
            honestPriceEl.innerText = "₹" + honestPrice;
        } else {
            console.error("IDs mismatch! Check if 'integrityVal', 'riskVal' and 'honestPrice' exist in HTML.");
        }

        // Breakdown Update
        document.getElementById('breakdownUl').innerHTML = data.breakdown.map(b => `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-[10px] font-bold text-slate-500 uppercase">${b.item}</span>
                <span class="text-[10px] font-black text-slate-900">₹${b.cost}</span>
            </div>
        `).join('');

        document.getElementById('scanLoader').classList.add('hidden');
        document.getElementById('analysisContent').classList.remove('hidden');
        document.getElementById('resultTabs').classList.remove('hidden');
        
        if(data.status === "SAFE") confetti();

    } catch (e) {
        console.error("Audit Failed:", e);
        document.getElementById('scanLoader').classList.add('hidden');
    }
}