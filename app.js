// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, push, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDc-evVek_OOEuI4D1QK6TDZctxnS56q5s",
    authDomain: "bangtanmessenger-e2c5b.firebaseapp.com",
    databaseURL: "https://bangtanmessenger-e2c5b-default-rtdb.firebaseio.com",
    projectId: "bangtanmessenger-e2c5b",
    storageBucket: "bangtanmessenger-e2c5b.firebasestorage.app",
    messagingSenderId: "1099466510344",
    appId: "1:1099466510344:web:43c7e9ee2ea68036dcc1bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Debug function to check form elements
function debugFormElements() {
    console.log('Checking form elements...');
    const elements = ['haveliName', 'haveliLocation', 'haveliAddress', 'pithadhishwar', 'gruh', 'history', 'manorathList'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`Element ${id}: ${element ? 'Found' : 'Not Found'}`);
    });
}

// Initialize forms and UI
function initializeForms() {
    console.log('Initializing forms...');
    
    // Debug form elements
    debugFormElements();
    
    // Set up form event listeners
    const registrationForm = document.getElementById('registrationForm');
    const authorityRegisterForm = document.getElementById('authorityRegisterForm');
    const authorityLoginForm = document.getElementById('authorityLoginForm');
    
    if (registrationForm) {
        console.log('Found registration form, adding event listener');
        registrationForm.addEventListener('submit', handleHaveliRegistration);
    } else {
        console.log('Registration form not found');
    }
    
    if (authorityRegisterForm) {
        authorityRegisterForm.addEventListener('submit', handleRegistration);
    }
    
    if (authorityLoginForm) {
        authorityLoginForm.addEventListener('submit', handleLogin);
    }
}

// Make UI functions globally accessible
window.showLoginForm = function() {
    const loginForm = document.getElementById('authorityLogin');
    const registerForm = document.getElementById('authorityRegister');
    if (loginForm && registerForm) {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    }
};

window.showRegisterForm = function() {
    const loginForm = document.getElementById('authorityLogin');
    const registerForm = document.getElementById('authorityRegister');
    if (loginForm && registerForm) {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }
};

window.hideAuthForms = function() {
    const loginForm = document.getElementById('authorityLogin');
    const registerForm = document.getElementById('authorityRegister');
    if (loginForm && registerForm) {
        loginForm.classList.remove('active');
        registerForm.classList.remove('active');
    }
};

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        const authNav = document.getElementById('authNav');
        const userInfo = document.getElementById('userInfo');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const adminControls = document.getElementById('adminControls');
        
        if (authNav) authNav.style.display = 'none';
        if (userInfo) userInfo.style.display = 'block';
        if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${user.email}`;
        if (adminControls) {
            adminControls.style.display = 'block';
            // Re-initialize forms when admin controls become visible
            setTimeout(initializeForms, 100);
        }
        
        window.hideAuthForms();
        loadManagedHavelis();
    } else {
        // User is signed out
        const authNav = document.getElementById('authNav');
        const userInfo = document.getElementById('userInfo');
        const adminControls = document.getElementById('adminControls');
        
        if (authNav) authNav.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (adminControls) adminControls.style.display = 'none';
        
        window.showLoginForm();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    window.showLoginForm();
    initializeForms();
});

// Handle Registration
async function handleRegistration(e) {
    e.preventDefault();
    
    try {
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const name = document.getElementById('regName')?.value;
        const position = document.getElementById('regPosition')?.value;
        const contact = document.getElementById('regContact')?.value;

        if (!email || !password || !name || !position || !contact) {
            alert('Please fill in all required fields');
            return;
        }

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional user data to Realtime Database
        await set(ref(db, 'users/' + user.uid), {
            name: name,
            email: email,
            position: position,
            contact: contact,
            role: 'authority',
            timestamp: new Date().toISOString()
        });

        alert('Registration successful!');
        window.hideAuthForms();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    try {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful!');
        window.hideAuthForms();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Logout function
window.logout = async function() {
    try {
        await signOut(auth);
        alert('Logged out successfully!');
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
};

// Handle Haveli Registration
async function handleHaveliRegistration(e) {
    e.preventDefault();
    
    try {
        // Check if user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first to register a haveli.');
            return;
        }

        // Get form elements
        const form = document.getElementById('registrationForm');
        if (!form) {
            console.error('Registration form not found');
            return;
        }

        // Get all required form values
        const formData = {
            haveliName: form.querySelector('#haveliName').value,
            location: form.querySelector('#haveliLocation').value,
            address: form.querySelector('#haveliAddress').value,
            pithadhishwar: form.querySelector('#pithadhishwar').value,
            gruh: form.querySelector('#gruh').value,
            history: form.querySelector('#history').value,
            manorathList: []
        };

        // Validate required fields
        const requiredFields = ['haveliName', 'location', 'address', 'pithadhishwar', 'gruh'];
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!formData[field]) {
                missingFields.push(field);
            }
        }
        
        if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Get Manorath entries
        const manorathEntries = form.querySelectorAll('.manorath-entry');
        manorathEntries.forEach(entry => {
            const name = entry.querySelector('input[name="manorathName[]"]').value;
            const price = entry.querySelector('input[name="manorathPrice[]"]').value;
            if (name && price) {
                formData.manorathList.push({ name, price: Number(price) });
            }
        });

        // Generate a unique ID for the haveli
        const haveliRef = push(ref(db, 'havelis'));
        const haveliId = haveliRef.key;

        // Prepare haveli data
        const haveliData = {
            ...formData,
            registeredBy: {
                uid: currentUser.uid,
                email: currentUser.email
            },
            timestamp: new Date().toISOString()
        };

        // Save haveli data
        await set(haveliRef, haveliData);

        // Update user's registered havelis
        const userHaveliRef = ref(db, `users/${currentUser.uid}/registeredHavelis/${haveliId}`);
        await set(userHaveliRef, {
            haveliId,
            haveliName: formData.haveliName,
            location: formData.location,
            timestamp: haveliData.timestamp
        });

        alert('Haveli registered successfully!');
        form.reset();
        loadManagedHavelis();

    } catch (error) {
        console.error('Error registering haveli:', error);
        alert('Failed to register haveli: ' + error.message);
    }
}

// Function to load managed havelis
async function loadManagedHavelis() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userHavelisRef = ref(db, `users/${currentUser.uid}/registeredHavelis`);
        const snapshot = await get(userHavelisRef);
        
        const managedHavelisDiv = document.getElementById('managedHavelis');
        managedHavelisDiv.innerHTML = '';

        if (snapshot.exists()) {
            const havelis = snapshot.val();
            Object.entries(havelis).forEach(([key, haveli]) => {
                const haveliCard = document.createElement('div');
                haveliCard.className = 'card mb-3';
                haveliCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${haveli.haveliName}</h5>
                        <p class="card-text">Location: ${haveli.location}</p>
                        <p class="card-text"><small class="text-muted">Registered: ${new Date(haveli.timestamp).toLocaleDateString()}</small></p>
                    </div>
                `;
                managedHavelisDiv.appendChild(haveliCard);
            });
        } else {
            managedHavelisDiv.innerHTML = '<p>No registered havelis yet.</p>';
        }
    } catch (error) {
        console.error('Error loading managed havelis:', error);
    }
}

// UI Functions for managing Manorath entries
window.addManorathEntry = function() {
    const manorathList = document.getElementById('manorathList');
    const newEntry = document.createElement('div');
    newEntry.className = 'manorath-entry mb-2';
    newEntry.innerHTML = `
        <div class="row">
            <div class="col-5">
                <input type="text" class="form-control" name="manorathName[]" placeholder="Manorath/Seva Name" required>
            </div>
            <div class="col-5">
                <input type="number" class="form-control" name="manorathPrice[]" placeholder="Price" required>
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-danger btn-sm" onclick="removeManorathEntry(this)">Remove</button>
            </div>
        </div>
    `;
    manorathList.appendChild(newEntry);
};

window.removeManorathEntry = function(button) {
    const entry = button.closest('.manorath-entry');
    if (document.querySelectorAll('.manorath-entry').length > 1) {
        entry.remove();
    }
};


