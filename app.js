// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
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
    projectId: "bangtanmessenger-e2c5b",
    storageBucket: "bangtanmessenger-e2c5b.firebasestorage.app",
    messagingSenderId: "1099466510344",
    appId: "1:1099466510344:web:43c7e9ee2ea68036dcc1bd",
    measurementId: "G-2SHGYXFB9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// UI Functions
window.showLoginForm = () => {
    document.querySelectorAll('.auth-section').forEach(section => section.classList.remove('active'));
    document.getElementById('authorityLogin').classList.add('active');
};

window.showRegisterForm = () => {
    document.querySelectorAll('.auth-section').forEach(section => section.classList.remove('active'));
    document.getElementById('authorityRegister').classList.add('active');
};

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        document.getElementById('authNav').style.display = 'none';
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('adminControls').style.display = 'block';
        document.querySelectorAll('.auth-section').forEach(section => section.classList.remove('active'));
        
        // Get user details and update UI
        const userDoc = await getDocs(query(collection(db, 'authorities'), where('email', '==', user.email)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            document.getElementById('welcomeMessage').textContent = `Welcome, ${userData.name}`;
        }
        
        // Load managed havelis
        loadManagedHavelis(user.uid);
    } else {
        // User is signed out
        document.getElementById('authNav').style.display = 'block';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('adminControls').style.display = 'none';
        document.getElementById('managedHavelis').innerHTML = '';
    }
});

// Authority Registration
document.getElementById('authorityRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Store additional user data
        await addDoc(collection(db, 'authorities'), {
            uid: userCredential.user.uid,
            name: document.getElementById('regName').value,
            email: email,
            position: document.getElementById('regPosition').value,
            contactNumber: document.getElementById('regContact').value,
            timestamp: new Date().toISOString()
        });
        
        alert('Registration successful!');
        e.target.reset();
    } catch (error) {
        alert('Error registering: ' + error.message);
    }
});

// Authority Login
document.getElementById('authorityLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        await signInWithEmailAndPassword(auth, email, password);
        e.target.reset();
    } catch (error) {
        alert('Error logging in: ' + error.message);
    }
});

// Logout
window.logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
};

// Add Manorath Entry
window.addManorathEntry = () => {
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

// Remove Manorath Entry
window.removeManorathEntry = (button) => {
    button.closest('.manorath-entry').remove();
};

// Load Managed Havelis
async function loadManagedHavelis(uid) {
    const managedHavelis = document.getElementById('managedHavelis');
    managedHavelis.innerHTML = '';
    
    try {
        const querySnapshot = await getDocs(query(collection(db, 'havelis'), where('authorityId', '==', uid)));
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const haveliCard = document.createElement('div');
            haveliCard.className = 'card mb-3';
            haveliCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${data.haveliName}</h5>
                    <p class="card-text">
                        <strong>Location:</strong> ${data.location}<br>
                        <strong>Address:</strong> ${data.address}
                    </p>
                    <button class="btn btn-sm btn-primary" onclick="editHaveli('${doc.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHaveli('${doc.id}')">Delete</button>
                </div>
            `;
            managedHavelis.appendChild(haveliCard);
        });
    } catch (error) {
        console.error('Error loading havelis:', error);
    }
}

// Handle Haveli Registration
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submission started');
    
    if (!auth.currentUser) {
        console.log('No user logged in');
        alert('Please login first');
        return;
    }
    console.log('User is logged in:', auth.currentUser.email);

    // Collect all manorath entries
    const manorathEntries = [];
    const manorathElements = document.querySelectorAll('.manorath-entry');
    console.log('Found manorath entries:', manorathElements.length);
    
    manorathElements.forEach((entry, index) => {
        const inputs = entry.querySelectorAll('input');
        console.log(`Processing manorath entry ${index + 1}:`, inputs[0]?.value, inputs[1]?.value);
        manorathEntries.push({
            name: inputs[0]?.value || '',
            price: parseFloat(inputs[1]?.value || '0')
        });
    });

    const haveliName = document.getElementById('haveliName')?.value;
    const haveliLocation = document.getElementById('haveliLocation')?.value;
    const haveliAddress = document.getElementById('haveliAddress')?.value;

    console.log('Collected form data:', {
        haveliName,
        haveliLocation,
        haveliAddress,
        manorathEntries
    });

    const haveliData = {
        haveliName,
        location: haveliLocation,
        address: haveliAddress,
        authorityId: auth.currentUser.uid,
        manorathList: manorathEntries,
        timestamp: new Date().toISOString()
    };

    try {
        console.log('Attempting to save to Firebase...');
        const docRef = await addDoc(collection(db, 'havelis'), haveliData);
        console.log('Document written with ID:', docRef.id);
        alert('Haveli registered successfully!');
        e.target.reset();
        loadManagedHavelis(auth.currentUser.uid);
    } catch (error) {
        console.error('Error registering haveli:', error);
        alert('Error registering haveli: ' + error.message);
    }
});

// Handle direct call
window.callAuthority = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
};

// Handle Search
window.searchHaveli = async () => {
    const locationTerm = document.getElementById('searchLocation').value.toLowerCase();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';

    try {
        let haveliRef = collection(db, 'havelis');
        let querySnapshot;

        if (locationTerm) {
            querySnapshot = await getDocs(query(haveliRef, where('location', '>=', locationTerm), where('location', '<=', locationTerm + '\uf8ff')));
        } else {
            querySnapshot = await getDocs(haveliRef);
        }

        const results = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (!searchTerm || 
                data.haveliName.toLowerCase().includes(searchTerm) ||
                data.manorathList.some(m => m.name.toLowerCase().includes(searchTerm))) {
                results.push(data);
            }
        });

        if (results.length === 0) {
            resultsDiv.innerHTML = '<p class="mt-3">No results found</p>';
            return;
        }

        results.forEach(data => {
            const manorathHtml = data.manorathList.map(m => `
                <div class="manorath-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${m.name}</strong> - ₹${m.price}
                        </div>
                        <div>
                            <i class="bi bi-telephone-fill call-button" onclick="callAuthority('${data.contactNumber}')" title="Call for this Manorath"></i>
                        </div>
                    </div>
                </div>
            `).join('');

            resultsDiv.innerHTML += `
                <div class="card mt-3">
                    <div class="card-body">
                        <h5 class="card-title">${data.haveliName}</h5>
                        <p class="card-text">
                            <strong>Location:</strong> ${data.location}<br>
                            <strong>Address:</strong> ${data.address}
                        </p>
                        <div class="manorath-list">
                            <h6>Manorath/Seva List:</h6>
                            ${manorathHtml}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        resultsDiv.innerHTML = '<p class="mt-3 text-danger">Error searching: ' + error.message + '</p>';
    }
};
