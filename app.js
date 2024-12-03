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

        // Debug: Log which elements we're trying to find
        console.log('Looking for form elements...');

        // Get form elements with debug logging
        const formElements = {
            haveliName: document.getElementById('haveliName'),
            location: document.getElementById('haveliLocation'),
            address: document.getElementById('haveliAddress'),
            pithadhishwar: document.getElementById('pithadhishwar'),
            gruh: document.getElementById('gruh'),
            history: document.getElementById('history'),
            manorathList: document.getElementById('manorathList')
        };

        // Debug: Log which elements were found/missing
        const missingElements = [];
        Object.entries(formElements).forEach(([name, element]) => {
            if (!element) {
                missingElements.push(name);
                console.log(`Missing element: ${name}`);
            } else {
                console.log(`Found element: ${name}`);
            }
        });

        // Check if any required elements are missing
        if (missingElements.length > 0) {
            alert(`Error: The following form elements are missing: ${missingElements.join(', ')}\nPlease refresh the page and try again.`);
            return;
        }

        // Get form data
        const haveliData = {
            haveliName: formElements.haveliName.value.trim(),
            location: formElements.location.value.trim(),
            address: formElements.address.value.trim(),
            pithadhishwar: formElements.pithadhishwar.value.trim(),
            gruh: formElements.gruh.value.trim(),
            history: formElements.history ? formElements.history.value.trim() : '',
            registeredBy: {
                uid: currentUser.uid,
                email: currentUser.email
            },
            timestamp: new Date().toISOString()
        };

        // Validate required fields
        const emptyFields = [];
        Object.entries(haveliData).forEach(([key, value]) => {
            if (key !== 'history' && key !== 'registeredBy' && key !== 'timestamp' && !value) {
                emptyFields.push(key);
            }
        });

        if (emptyFields.length > 0) {
            alert(`Please fill in the following required fields: ${emptyFields.join(', ')}`);
            return;
        }

        // Get manorath entries
        const manorathEntries = [];
        const manorathElements = formElements.manorathList.querySelectorAll('.manorath-entry');
        
        manorathElements.forEach((entry, index) => {
            const nameInput = entry.querySelector('input[name="manorathName[]"]');
            const priceInput = entry.querySelector('input[name="manorathPrice[]"]');
            
            if (nameInput && priceInput) {
                const name = nameInput.value.trim();
                const price = priceInput.value.trim();
                
                if (name && price) {
                    manorathEntries.push({
                        name: name,
                        price: parseFloat(price)
                    });
                }
            }
        });

        // Validate at least one manorath entry
        if (manorathEntries.length === 0) {
            alert('Please add at least one Manorath/Seva entry');
            return;
        }

        // Add manorath list to haveli data
        haveliData.manorathList = manorathEntries;

        // Save to Firebase under havelis node
        const haveliRef = ref(db, 'havelis');
        const newHaveliRef = push(haveliRef);
        await set(newHaveliRef, haveliData);

        // Also save reference to user's registered havelis
        const userHaveliRef = ref(db, `users/${currentUser.uid}/registeredHavelis/${newHaveliRef.key}`);
        await set(userHaveliRef, {
            haveliId: newHaveliRef.key,
            haveliName: haveliData.haveliName,
            location: haveliData.location,
            timestamp: haveliData.timestamp
        });

        // Show success message
        alert('Haveli registered successfully!');
        
        // Reset form
        e.target.reset();
        
        // Reset manorath list to initial state
        if (formElements.manorathList) {
            formElements.manorathList.innerHTML = `
                <div class="manorath-entry mb-2">
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
                </div>
            `;
        }

        // Refresh the list of managed havelis
        loadManagedHavelis();

    } catch (error) {
        console.error('Error:', error);
        alert('Error registering haveli: ' + error.message);
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

