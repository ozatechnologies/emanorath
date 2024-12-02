// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

// Handle Haveli Registration
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Get form data
        const haveliData = {
            haveliName: document.getElementById('haveliName').value,
            location: document.getElementById('haveliLocation').value,
            address: document.getElementById('haveliAddress').value,
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

        // Save to Firebase
        const haveliRef = ref(db, 'havelis');
        const newHaveliRef = push(haveliRef);
        await set(newHaveliRef, haveliData);

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

    } catch (error) {
        console.error('Error:', error);
        alert('Error registering haveli: ' + error.message);
    }
});

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
