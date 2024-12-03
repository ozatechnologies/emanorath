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
    databaseURL: "https://bangtanmessenger-e2c5b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bangtanmessenger-e2c5b",
    storageBucket: "bangtanmessenger-e2c5b.firebasestorage.app",
    messagingSenderId: "1099466510344",
    appId: "1:1099466510344:web:43c7e9ee2ea68036dcc1bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        document.getElementById('authNav').style.display = 'none';
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.email}`;
        document.getElementById('adminControls').style.display = 'block';
        hideAuthForms();
        // Load managed havelis when user logs in
        loadManagedHavelis();
    } else {
        // User is signed out
        document.getElementById('authNav').style.display = 'block';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('adminControls').style.display = 'none';
        showLoginForm();
    }
});

// Authority Registration
document.getElementById('authorityRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const name = document.getElementById('regName').value;
        const position = document.getElementById('regPosition').value;
        const contact = document.getElementById('regContact').value;

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
        hideAuthForms();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
});

// Authority Login
document.getElementById('authorityLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful!');
        hideAuthForms();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
});

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

// UI Helper functions
window.showLoginForm = function() {
    document.getElementById('authorityLogin').classList.add('active');
    document.getElementById('authorityRegister').classList.remove('active');
};

window.showRegisterForm = function() {
    document.getElementById('authorityLogin').classList.remove('active');
    document.getElementById('authorityRegister').classList.add('active');
};

function hideAuthForms() {
    document.getElementById('authorityLogin').classList.remove('active');
    document.getElementById('authorityRegister').classList.remove('active');
}

// Handle Haveli Registration
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Check if user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login first to register a haveli.');
            return;
        }

        // Get form data
        const haveliData = {
            haveliName: document.getElementById('haveliName').value,
            location: document.getElementById('haveliLocation').value,
            address: document.getElementById('haveliAddress').value,
            pithadhishwar: document.getElementById('pithadhishwarName').value,
            gruh: document.getElementById('gruhName').value,
            history: document.getElementById('haveliHistory').value || '',
            registeredBy: {
                uid: currentUser.uid,
                email: currentUser.email
            },
            timestamp: new Date().toISOString()
        };

        // Get manorath entries
        const manorathEntries = [];
        document.querySelectorAll('.manorath-entry').forEach(entry => {
            const nameInput = entry.querySelector('input[name="manorathName[]"]');
            const priceInput = entry.querySelector('input[name="manorathPrice[]"]');
            
            if (nameInput && priceInput && nameInput.value && priceInput.value) {
                manorathEntries.push({
                    name: nameInput.value,
                    price: parseFloat(priceInput.value)
                });
            }
        });

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
        document.getElementById('manorathList').innerHTML = `
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

        // Refresh the list of managed havelis
        loadManagedHavelis();

    } catch (error) {
        console.error('Error:', error);
        alert('Error registering haveli: ' + error.message);
    }
});

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
