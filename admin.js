import { db, auth } from './firebase-init.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const docRef = doc(db, "settings", "global");

// UI Elements - Views
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');

// UI Elements - Forms
const loginForm = document.getElementById('loginForm');
const settingsForm = document.getElementById('adminSettingsForm');

// UI Elements - Inputs & Buttons
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Settings Inputs
const enablePaystackInput = document.getElementById('enablePaystack');
const supportLinkInput = document.getElementById('supportLink');
const bankNameInput = document.getElementById('bankName');
const accNumInput = document.getElementById('accountNumber');
const accNameInput = document.getElementById('accountName');
const saveBtn = document.getElementById('saveBtn');

// --- AUTHENTICATION STATE OBSERVER ---
// This runs whenever the user logs in, logs out, or app loads.
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("Admin logged in:", user.email);
        loginView.style.display = 'none';
        dashboardView.classList.remove('d-none-custom');
        dashboardView.style.display = 'flex';
        loadSettings(); // Load data only when authenticated
    } else {
        // User is signed out
        console.log("Admin logged out");
        dashboardView.style.display = 'none';
        dashboardView.classList.add('d-none-custom');
        loginView.style.display = 'flex';
    }
});

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

// --- FIRESTORE LOGIC (Protected) ---
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