
import { db } from './firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function logVisit() {
    // 1. Identify Visitor (Simple Fingerprint via LocalStorage)
    let visitorId = localStorage.getItem('stream_visitor_id');
    let isReturning = true;
    
    if (!visitorId) {
        // Generate a random ID for new users
        visitorId = 'vis_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('stream_visitor_id', visitorId);
        isReturning = false;
    }

    // 2. Capture Data
    const visitData = {
        page_path: window.location.pathname,
        page_title: document.title,
        referrer: document.referrer || 'Direct', // Crucial for spotting Google Ads vs Direct
        user_agent: navigator.userAgent,
        visitor_id: visitorId,
        is_returning: isReturning,
        timestamp: serverTimestamp(),
        local_time: new Date().toISOString() // Fallback for sorting if serverTimestamp lags in UI
    };

    // 3. Send to Firestore
    try {
        const docRef = await addDoc(collection(db, "analytics_logs"), visitData);
        console.log("Stream Tracker: Visit logged", docRef.id);
    } catch (e) {
        console.error("Stream Tracker Error:", e);
    }
}

// Execute on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logVisit);
} else {
    logVisit();
}
