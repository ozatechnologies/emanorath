// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push,
    get,
    child,
    remove,
    query,
    orderByChild,
    equalTo 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDc-evVek_OOEuI4D1QK6TDZctxnS56q5s",
    authDomain: "bangtanmessenger-e2c5b.firebaseapp.com",
    databaseURL: "https://bangtanmessenger-e2c5b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bangtanmessenger-e2c5b",
    storageBucket: "bangtanmessenger-e2c5b.firebasestorage.app",
    messagingSenderId: "1099466510344",
    appId: "1:1099466510344:web:43c7e9ee2ea68036dcc1bd",
    measurementId: "G-2SHGYXFB9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Test database connection and write permissions
const testRef = ref(db, 'test');
set(testRef, {
    timestamp: new Date().toISOString(),
    message: 'Testing database connection'
})
.then(() => {
    console.log('✅ Database write test successful');
    return get(testRef);
})
.then((snapshot) => {
    console.log('✅ Database read test successful', snapshot.val());
})
.catch((error) => {
    console.error('❌ Database test failed:', error);
});

// UI Functions
function addManorathEntry() {
    const manorathList = document.getElementById('manorathList');
    const newEntry = document.createElement('div');
    newEntry.className = 'manorath-entry mb-2';
    newEntry.innerHTML = `
        <div class="row">
            <div class="col-5">
                <input type="text" class="form-control" placeholder="Manorath/Seva Name" required>
            </div>
            <div class="col-5">
                <input type="number" class="form-control" placeholder="Price" required>
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-danger btn-sm" onclick="removeManorathEntry(this)">Remove</button>
            </div>
        </div>
    `;
    manorathList.appendChild(newEntry);
};

function removeManorathEntry(button) {
    button.closest('.manorath-entry').remove();
};

function showLoginForm() {
    document.querySelectorAll('.auth-section').forEach(section => section.classList.remove('active'));
    document.getElementById('authorityLogin').classList.add('active');
};

function showRegisterForm() {
    document.querySelectorAll('.auth-section').forEach(section => section.classList.remove('active'));
    document.getElementById('authorityRegister').classList.add('active');
};

// Make functions globally available
window.addManorathEntry = addManorathEntry;
window.removeManorathEntry = removeManorathEntry;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        document.getElementById('authNav').style.display = 'none';
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('adminControls').style.display = 'block';
        document.querySelectorAll('.auth-section').forEach(section => section.classList.remove('active'));
        
        // Get user details and update UI
        const userRef = ref(db, 'authorities/' + user.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            document.getElementById('welcomeMessage').textContent = `Welcome, ${userData.name} (${userData.position})`;
        }
        
        // Load managed havelis
        loadManagedHavelis(user.uid);
    } else {
        // User is signed out
        document.getElementById('authNav').style.display = 'block';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('adminControls').style.display = 'none';
        document.getElementById('welcomeMessage').textContent = '';
        document.getElementById('managedHavelisList').innerHTML = '';
    }
});

// Authority Registration
document.getElementById('authorityRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value;
    const position = document.getElementById('regPosition').value;
    const contact = document.getElementById('regContact').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save additional user data
        await set(ref(db, 'authorities/' + user.uid), {
            name,
            email,
            position,
            contact,
            timestamp: new Date().toISOString()
        });

        alert('Registration successful!');
        document.getElementById('authorityRegisterForm').reset();
        showLoginForm();
    } catch (error) {
        alert('Registration error: ' + error.message);
    }
});

// Authority Login
document.getElementById('authorityLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById('authorityLoginForm').reset();
    } catch (error) {
        alert('Login error: ' + error.message);
    }
});

// Logout
function logout() {
    try {
        signOut(auth);
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
};
window.logout = logout;

// Load Managed Havelis
async function loadManagedHavelis(uid) {
    try {
        const haveliRef = ref(db, 'havelis');
        const userHavelisQuery = query(haveliRef, orderByChild('authorityId'), equalTo(uid));
        const snapshot = await get(userHavelisQuery);
        
        const managedHavelisList = document.getElementById('managedHavelisList');
        managedHavelisList.innerHTML = '';

        if (snapshot.exists()) {
            const havelis = snapshot.val();
            Object.entries(havelis).forEach(([key, haveli]) => {
                const card = document.createElement('div');
                card.className = 'card mb-3';
                card.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${haveli.haveliName}</h5>
                        <p class="card-text">
                            Location: ${haveli.location}<br>
                            Address: ${haveli.address}
                        </p>
                        <h6>Manorath/Seva List:</h6>
                        <ul class="list-group">
                            ${haveli.manorathList.map(m => `
                                <li class="list-group-item">
                                    ${m.name} - ₹${m.price}
                                </li>
                            `).join('')}
                        </ul>
                        <button class="btn btn-danger btn-sm mt-2" onclick="deleteHaveli('${key}')">Delete</button>
                    </div>
                `;
                managedHavelisList.appendChild(card);
            });
        } else {
            managedHavelisList.innerHTML = '<p>No havelis registered yet.</p>';
        }
    } catch (error) {
        console.error('Error loading havelis:', error);
        alert('Error loading havelis: ' + error.message);
    }
}

// Delete Haveli
window.deleteHaveli = async (haveliId) => {
    if (confirm('Are you sure you want to delete this haveli?')) {
        try {
            await remove(ref(db, 'havelis/' + haveliId));
            loadManagedHavelis(auth.currentUser.uid);
        } catch (error) {
            alert('Error deleting haveli: ' + error.message);
        }
    }
};

// Handle form submissions
window.addEventListener('DOMContentLoaded', () => {
    // Handle Haveli Registration
    document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!auth.currentUser) {
            console.error('❌ No user logged in');
            alert('Please login first');
            return;
        }

        try {
            console.log('👤 Current user:', auth.currentUser.uid);
            
            // Show loading state
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = 'Registering...';

            // Collect all manorath entries
            const manorathEntries = [];
            document.querySelectorAll('.manorath-entry').forEach(entry => {
                const inputs = entry.querySelectorAll('input');
                if (inputs[0].value && inputs[1].value) {
                    manorathEntries.push({
                        name: inputs[0].value,
                        price: parseFloat(inputs[1].value)
                    });
                }
            });

            if (manorathEntries.length === 0) {
                throw new Error('Please add at least one Manorath/Seva entry');
            }

            const haveliData = {
                haveliName: document.getElementById('haveliName').value,
                location: document.getElementById('haveliLocation').value,
                address: document.getElementById('haveliAddress').value,
                authorityId: auth.currentUser.uid,
                manorathList: manorathEntries,
                timestamp: new Date().toISOString()
            };

            console.log('📝 Attempting to save haveli:', haveliData);

            // Save to Firebase Realtime Database
            const haveliRef = ref(db, 'havelis');
            console.log('📍 Created database reference at:', haveliRef.toString());
            
            const newHaveliRef = push(haveliRef);
            console.log('🆕 Generated new haveli reference:', newHaveliRef.key);
            
            await set(newHaveliRef, haveliData);
            console.log('💾 Haveli data saved successfully');

            // Verify the data was saved
            const savedData = await get(newHaveliRef);
            if (savedData.exists()) {
                console.log('✅ Verified saved data:', savedData.val());
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'alert alert-success mt-3';
                successMessage.role = 'alert';
                successMessage.innerHTML = `
                    <h4 class="alert-heading">Haveli Registered Successfully!</h4>
                    <p>The haveli "${haveliData.haveliName}" has been registered with ${manorathEntries.length} Manorath/Seva entries.</p>
                    <small>Reference ID: ${newHaveliRef.key}</small>
                `;
                e.target.insertBefore(successMessage, e.target.firstChild);

                // Reset form
                e.target.reset();
                document.getElementById('manorathList').innerHTML = `
                    <div class="manorath-entry mb-2">
                        <div class="row">
                            <div class="col-5">
                                <input type="text" class="form-control" placeholder="Manorath/Seva Name" required>
                            </div>
                            <div class="col-5">
                                <input type="number" class="form-control" placeholder="Price" required>
                            </div>
                            <div class="col-2">
                                <button type="button" class="btn btn-danger btn-sm" onclick="removeManorathEntry(this)">Remove</button>
                            </div>
                        </div>
                    </div>
                `;

                // Reload managed havelis list
                await loadManagedHavelis(auth.currentUser.uid);

                // Remove success message after 5 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            } else {
                throw new Error('Data was not saved properly');
            }

        } catch (error) {
            console.error('❌ Error saving haveli:', error);
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger mt-3';
            errorMessage.role = 'alert';
            errorMessage.textContent = 'Error registering haveli: ' + error.message;
            e.target.insertBefore(errorMessage, e.target.firstChild);

            // Remove error message after 5 seconds
            setTimeout(() => {
                errorMessage.remove();
            }, 5000);
        } finally {
            // Reset button state
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Register Haveli';
        }
    });

    // Handle Search
    document.getElementById('searchButton')?.addEventListener('click', async () => {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '<p class="mt-3">Searching...</p>';

        try {
            const haveliRef = ref(db, 'havelis');
            const snapshot = await get(haveliRef);
            
            if (!snapshot.exists()) {
                resultsDiv.innerHTML = '<p class="mt-3">No havelis found.</p>';
                return;
            }

            const havelis = snapshot.val();
            const matchedHavelis = Object.values(havelis).filter(haveli => 
                haveli.haveliName.toLowerCase().includes(searchQuery) ||
                haveli.location.toLowerCase().includes(searchQuery) ||
                haveli.address.toLowerCase().includes(searchQuery)
            );

            if (matchedHavelis.length === 0) {
                resultsDiv.innerHTML = '<p class="mt-3">No matching havelis found.</p>';
                return;
            }

            resultsDiv.innerHTML = matchedHavelis.map(haveli => {
                const authorityRef = ref(db, 'authorities/' + haveli.authorityId);
                return get(authorityRef).then(authoritySnapshot => {
                    const authority = authoritySnapshot.val();
                    const manorathHtml = haveli.manorathList.map(m => 
                        `<div class="manorath-item">
                            ${m.name} - ₹${m.price}
                        </div>`
                    ).join('');

                    return `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${haveli.haveliName}</h5>
                                <p class="card-text">
                                    Location: ${haveli.location}<br>
                                    Address: ${haveli.address}<br>
                                    Authority: ${authority.name} (${authority.position})<br>
                                    Contact: <span class="call-button" onclick="callAuthority('${authority.contact}')">${authority.contact}</span>
                                </p>
                                <div class="manorath-list">
                                    <h6>Manorath/Seva List:</h6>
                                    ${manorathHtml}
                                </div>
                            </div>
                        </div>
                    `;
                });
            }).reduce((promise, resultPromise) => 
                promise.then(results => 
                    resultPromise.then(result => [...results, result])
                ), Promise.resolve([])).then(results => {
                    resultsDiv.innerHTML = results.join('');
                });

        } catch (error) {
            resultsDiv.innerHTML = '<p class="mt-3 text-danger">Error searching: ' + error.message + '</p>';
        }
    });
});

// Handle direct call
window.callAuthority = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
};
