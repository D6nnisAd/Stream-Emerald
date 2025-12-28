import { db } from './firebase-init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const docRef = doc(db, "settings", "global");

async function applyGlobalSettings() {
    try {
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // --- Update Global Link (Support Buttons) ---
            // Finds any element with class 'dynamic-support-link' or id 'dynamic-support-link'
            const supportLinks = document.querySelectorAll('.dynamic-support-link, #dynamic-support-link');
            supportLinks.forEach(link => {
                link.href = data.supportLink || '#';
            });

            // --- Update Payment Page Confirmation Button ---
            const confirmBtn = document.getElementById('btn-confirm-payment');
            if (confirmBtn) {
                // Remove the old onclick attribute to prevent conflict
                confirmBtn.removeAttribute('onclick'); 
                confirmBtn.addEventListener('click', () => {
                    if(data.supportLink) {
                        window.location.href = data.supportLink;
                    } else {
                        alert("Support link not configured.");
                    }
                });
            }

            // --- Update Bank Details (Payment Page) ---
            const bankNameEl = document.getElementById('bank-name-display');
            const accNumEl = document.getElementById('account-number-display');
            const accNameEl = document.getElementById('account-name-display');
            const copyBtn = document.getElementById('btn-copy-action');

            if (bankNameEl) bankNameEl.innerText = data.bankName;
            if (accNameEl) accNameEl.innerText = data.accountName;
            if (accNumEl) {
                accNumEl.innerText = data.accountNumber;
                // Update the copy button to copy the dynamic number
                if (copyBtn) {
                    copyBtn.onclick = () => copyToClipboard(data.accountNumber);
                }
            }

        } else {
            console.log("No configuration found in Firestore.");
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
    }
}

// Global Copy Function (Needs to be attached to window for HTML onclick access if not doing event listener)
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        if(toast) {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

// Initialize
document.addEventListener('DOMContentLoaded', applyGlobalSettings);