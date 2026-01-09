
import { db, auth } from './firebase-init.js';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const docRef = doc(db, "settings", "global");

// UI Elements - Views
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const settingsView = document.getElementById('settings-view');
const analyticsView = document.getElementById('analytics-view');

// Navigation
const navSettings = document.getElementById('nav-settings');
const navAnalytics = document.getElementById('nav-analytics');
const pageTitle = document.getElementById('page-title-text');

// UI Elements - Forms
const loginForm = document.getElementById('loginForm');
const settingsForm = document.getElementById('adminSettingsForm');

// UI Elements - Inputs & Buttons
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshAnalyticsBtn = document.getElementById('refresh-analytics');

// Settings Inputs
const enablePaystackInput = document.getElementById('enablePaystack');
const supportLinkInput = document.getElementById('supportLink');
const bankNameInput = document.getElementById('bankName');
const accNumInput = document.getElementById('accountNumber');
const accNameInput = document.getElementById('accountName');
const saveBtn = document.getElementById('saveBtn');

let analyticsInterval = null;

// --- AUTHENTICATION STATE OBSERVER ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("Admin logged in:", user.email);
        loginView.style.display = 'none';
        dashboardView.classList.remove('d-none-custom');
        dashboardView.style.display = 'flex';
        loadSettings(); 
        // Start on Settings View by default
        showSettingsView();
    } else {
        // User is signed out
        console.log("Admin logged out");
        dashboardView.style.display = 'none';
        dashboardView.classList.add('d-none-custom');
        loginView.style.display = 'flex';
        if (analyticsInterval) clearInterval(analyticsInterval);
    }
});

// --- NAVIGATION LOGIC ---
function showSettingsView() {
    settingsView.classList.remove('d-none-custom');
    analyticsView.classList.add('d-none-custom');
    navSettings.classList.add('active');
    navAnalytics.classList.remove('active');
    pageTitle.innerText = "Configuration";
    if (analyticsInterval) clearInterval(analyticsInterval);
}

function showAnalyticsView() {
    settingsView.classList.add('d-none-custom');
    analyticsView.classList.remove('d-none-custom');
    navSettings.classList.remove('active');
    navAnalytics.classList.add('active');
    pageTitle.innerText = "Traffic Analytics";
    loadAnalytics();
    // Auto-refresh every 30s
    analyticsInterval = setInterval(loadAnalytics, 30000); 
}

if(navSettings) navSettings.addEventListener('click', showSettingsView);
if(navAnalytics) navAnalytics.addEventListener('click', showAnalyticsView);
if(refreshAnalyticsBtn) refreshAnalyticsBtn.addEventListener('click', loadAnalytics);


// --- ANALYTICS LOGIC ---
async function loadAnalytics() {
    const tableBody = document.getElementById('analytics-table-body');
    const statHitsAll = document.getElementById('stat-hits-all');
    const statUnique = document.getElementById('stat-unique');
    const statHitsToday = document.getElementById('stat-hits-today');
    const statRegs = document.getElementById('stat-regs');
    const statCheckout = document.getElementById('stat-checkout');
    
    // Show Loading state if manual refresh
    if(refreshAnalyticsBtn) refreshAnalyticsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const logsRef = collection(db, "analytics_logs");
        
        // 1. Get ALL TIME Count
        const allTimeSnapshot = await getCountFromServer(logsRef);
        const allTimeCount = allTimeSnapshot.data().count;

        // 2. Get UNIQUE VISITORS Count (New Users)
        // Tracks logs where 'is_returning' is false
        const uniqueQuery = query(logsRef, where("is_returning", "==", false));
        const uniqueSnapshot = await getCountFromServer(uniqueQuery);
        const uniqueCount = uniqueSnapshot.data().count;

        // 3. Get TODAY'S Count
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        const todayQuery = query(logsRef, where("timestamp", ">", startOfDay));
        const todaySnapshot = await getCountFromServer(todayQuery);
        const todayCount = todaySnapshot.data().count;

        // 4. Get Recent Logs for Table (Limit 50)
        const listQuery = query(logsRef, orderBy("timestamp", "desc"), limit(50));
        const querySnapshot = await getDocs(listQuery);
        
        let regStarts = 0;
        let checkoutStarts = 0;
        let tableRows = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Simple client-side count based on the fetched list for trending stats
            if (data.page_path.includes('register')) regStarts++;
            if (data.page_path.includes('packages')) checkoutStarts++;

            // Format Time
            let timeStr = 'Just now';
            if (data.timestamp && data.timestamp.toDate) {
                timeStr = data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            // Status Badge
            const badgeClass = data.is_returning ? 'badge-returning' : 'badge-visitor';
            const badgeText = data.is_returning ? 'Returning' : 'New';

            tableRows += `
                <tr>
                    <td style="color: #aaa;">${timeStr}</td>
                    <td>${data.page_path}</td>
                    <td class="${data.referrer.includes('google') ? 'text-warning' : ''}">${data.referrer}</td>
                    <td><span class="badge-visitor ${badgeClass}">${badgeText}</span> <small style="opacity:0.5">${data.visitor_id.substring(0,8)}...</small></td>
                </tr>
            `;
        });

        // Update Stats with Number Formatting
        statHitsAll.innerText = allTimeCount.toLocaleString();
        statUnique.innerText = uniqueCount.toLocaleString();
        statHitsToday.innerText = todayCount.toLocaleString();
        
        // These are just trending stats from the last 50, so we just show the count
        statRegs.innerText = regStarts; 
        statCheckout.innerText = checkoutStarts;

        // Update Table
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hits recorded yet.</td></tr>';
        } else {
            tableBody.innerHTML = tableRows;
        }

    } catch (error) {
        console.error("Analytics Error:", error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data. Check console.</td></tr>';
    } finally {
        if(refreshAnalyticsBtn) refreshAnalyticsBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Refresh';
    }
}


// --- LOGIN LOGIC ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const originalText = loginBtn.innerText;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    loginBtn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error("Login Error:", error);
        showToast("Invalid Email or Password", true);
    } finally {
        loginBtn.innerText = originalText;
        loginBtn.disabled = false;
    }
});

// --- LOGOUT LOGIC ---
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error("Logout Error:", error);
    }
});

// --- FIRESTORE SETTINGS LOGIC (Protected) ---
async function loadSettings() {
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            enablePaystackInput.checked = data.enablePaystack || false; // Load switch state
            supportLinkInput.value = data.supportLink || '';
            bankNameInput.value = data.bankName || '';
            accNumInput.value = data.accountNumber || '';
            accNameInput.value = data.accountName || '';
        } else {
            console.log("No existing settings document.");
        }
    } catch (error) {
        console.error("Error getting document:", error);
        showToast("Error loading settings.", true);
    }
}

settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    const newData = {
        enablePaystack: enablePaystackInput.checked, // Save switch state
        supportLink: supportLinkInput.value,
        bankName: bankNameInput.value,
        accountNumber: accNumInput.value,
        accountName: accNameInput.value
    };

    try {
        await setDoc(docRef, newData);
        showToast("Settings updated successfully!", false);
    } catch (error) {
        console.error("Error writing document:", error);
        showToast("Failed to save settings.", true);
    } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
    }
});

// Helper: Toast Notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = isError ? 'admin-toast error' : 'admin-toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
