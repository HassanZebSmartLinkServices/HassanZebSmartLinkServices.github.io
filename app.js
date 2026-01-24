// PWA Installation
let deferredPrompt;
const installButton = document.createElement('button');
installButton.id = 'installButton';
installButton.innerHTML = '📱 ایپ انسٹال کریں';
installButton.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 30px;
    background: linear-gradient(135deg, #25D366, #128C7E);
    color: white;
    padding: 12px 24px;
    border-radius: 30px;
    border: none;
    font-weight: bold;
    font-family: 'Noto Sans Arabic', sans-serif;
    box-shadow: 0 4px 20px rgba(37, 211, 102, 0.5);
    z-index: 9999;
    display: none;
    cursor: pointer;
    transition: all 0.3s ease;
`;

installButton.addEventListener('mouseenter', () => {
    installButton.style.transform = 'scale(1.05)';
});

installButton.addEventListener('mouseleave', () => {
    installButton.style.transform = 'scale(1)';
});

// Add install button to body
document.body.appendChild(installButton);

// Before install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button after 5 seconds
    setTimeout(() => {
        if (deferredPrompt) {
            installButton.style.display = 'block';
        }
    }, 5000);
});

// Install button click
installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        installButton.style.display = 'none';
    } else {
        console.log('User dismissed the install prompt');
    }
    
    deferredPrompt = null;
});

// Check if app is installed
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    installButton.style.display = 'none';
    
    // Show welcome message
    showNotification('SmartLink 5G ایپ انسٹال ہو گئی!', 'اب آپ آف لائن بھی استعمال کر سکتے ہیں۔');
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registered: ', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Offline/Online detection
window.addEventListener('online', () => {
    showNotification('آپ آن لائن ہیں', 'انٹرنیٹ کنکشن بحال ہو گیا۔');
});

window.addEventListener('offline', () => {
    showNotification('آپ آف لائن ہیں', 'براہ کرم انٹرنیٹ کنکشن چیک کریں۔');
});

// Push Notifications Permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
                subscribeToNotifications();
            }
        });
    }
}

// Subscribe to push notifications
function subscribeToNotifications() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
            })
            .then(subscription => {
                console.log('User is subscribed:', subscription);
                // Send subscription to your server
                sendSubscriptionToServer(subscription);
            })
            .catch(err => {
                console.log('Failed to subscribe:', err);
            });
        });
    }
}

// Helper function for VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Send subscription to server
function sendSubscriptionToServer(subscription) {
    fetch('/save-subscription', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save subscription');
        }
        return response.json();
    })
    .then(data => {
        console.log('Subscription saved:', data);
    })
    .catch(err => {
        console.error('Error saving subscription:', err);
    });
}

// Show update notification
function showUpdateNotification() {
    const updateNotification = document.createElement('div');
    updateNotification.id = 'updateNotification';
    updateNotification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #0066cc, #00a8ff);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            font-family: 'Noto Sans Arabic', sans-serif;
            max-width: 300px;
        ">
            <h4 style="margin-bottom: 10px;">🔄 نیا اپ ڈیٹ دستیاب ہے</h4>
            <p style="margin-bottom: 15px;">تازہ ترین فیچرز حاصل کرنے کے لیے ریفریش کریں۔</p>
            <button onclick="location.reload()" style="
                background: #ff6b35;
                color: white;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">ریفریش</button>
            <button onclick="this.parentElement.remove()" style="
                background: transparent;
                color: white;
                border: 1px solid white;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
            ">بعد میں</button>
        </div>
    `;
    
    document.body.appendChild(updateNotification);
    
    // Auto remove after 30 seconds
    setTimeout(() => {
        if (updateNotification.parentElement) {
            updateNotification.remove();
        }
    }, 30000);
}

// Show custom notification
function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: 'https://lh3.googleusercontent.com/d/1J2oK1zlysJzYx3lyC2O-g-1lQd69_UR3'
        });
    } else {
        // Fallback notification
        const fallbackNotification = document.createElement('div');
        fallbackNotification.id = 'fallbackNotification';
        fallbackNotification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                background: linear-gradient(135deg, #25D366, #128C7E);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                font-family: 'Noto Sans Arabic', sans-serif;
                max-width: 300px;
            ">
                <h4 style="margin-bottom: 5px;">${title}</h4>
                <p style="margin-bottom: 0;">${message}</p>
            </div>
        `;
        
        document.body.appendChild(fallbackNotification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (fallbackNotification.parentElement) {
                fallbackNotification.remove();
            }
        }, 5000);
    }
}

// Add to Home Screen functionality
function showAddToHomeScreen() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running in standalone mode');
        return;
    }
    
    const addToHomeScreen = document.createElement('div');
    addToHomeScreen.id = 'addToHomeScreen';
    addToHomeScreen.innerHTML = `
        <div style="
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            z-index: 9998;
            font-family: 'Noto Sans Arabic', sans-serif;
            max-width: 250px;
            backdrop-filter: blur(10px);
        ">
            <h4 style="margin-bottom: 10px; color: #00a8ff;">📱 ہوم اسکرین پر شامل کریں</h4>
            <p style="margin-bottom: 15px; font-size: 0.9rem;">
                تیز رسائی کے لیے SmartLink 5G ایپ کو ہوم اسکرین پر شامل کریں۔
            </p>
            <div style="display: flex; gap: 10px;">
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: transparent;
                    color: white;
                    border: 1px solid #666;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.8rem;
                ">نہیں</button>
                <button onclick="showInstallInstructions()" style="
                    background: #00a8ff;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: bold;
                ">ہدایات</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(addToHomeScreen);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (addToHomeScreen.parentElement) {
            addToHomeScreen.remove();
        }
    }, 10000);
}

// Show install instructions
function showInstallInstructions() {
    const instructions = document.createElement('div');
    instructions.id = 'installInstructions';
    instructions.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.7);
            z-index: 9999;
            font-family: 'Noto Sans Arabic', sans-serif;
            max-width: 90%;
            width: 400px;
            backdrop-filter: blur(10px);
            border: 1px solid #00a8ff;
        ">
            <h3 style="color: #00a8ff; margin-bottom: 20px; text-align: center;">📱 ایپ کیسے انسٹال کریں</h3>
            
            <div style="margin-bottom: 20px;">
                <p style="margin-bottom: 10px;"><strong>iOS (آئی فون):</strong></p>
                <ol style="padding-right: 20px; font-size: 0.9rem;">
                    <li>Safari میں ویب سائٹ کھولیں</li>
                    <li>Share بٹن (📤) پر کلک کریں</li>
                    <li>"Add to Home Screen" منتخب کریں</li>
                    <li>"Add" پر کلک کریں</li>
                </ol>
            </div>
            
            <div style="margin-bottom: 25px;">
                <p style="margin-bottom: 10px;"><strong>Android (انڈرائیڈ):</strong></p>
                <ol style="padding-right: 20px; font-size: 0.9rem;">
                    <li>Chrome میں ویب سائٹ کھولیں</li>
                    <li>Menu (⋮) پر کلک کریں</li>
                    <li>"Add to Home screen" منتخب کریں</li>
                    <li>"Add" پر کلک کریں</li>
                </ol>
            </div>
            
            <button onclick="this.parentElement.remove()" style="
                display: block;
                margin: 0 auto;
                background: #ff6b35;
                color: white;
                border: none;
                padding: 10px 30px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">سمجھ گیا</button>
        </div>
    `;
    
    document.body.appendChild(instructions);
}

// Show add to home screen prompt on first visit
if (!localStorage.getItem('homeScreenPromptShown')) {
    setTimeout(() => {
        showAddToHomeScreen();
        localStorage.setItem('homeScreenPromptShown', 'true');
    }, 30000);
}

// Request notification permission on user interaction
document.addEventListener('click', () => {
    requestNotificationPermission();
}, { once: true });

// Export functions for global use
window.showNotification = showNotification;
window.showInstallInstructions = showInstallInstructions;