async function loadValueProposition() {

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/value-proposition/mine', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data) {
                // Prefill textareas
    //             const submitBtn = document.getElementById("submitBtn");
    // if (submitBtn) submitBtn.style.display = "none";
                document.getElementById('ta1').value = data.gain_creators || "";
                document.getElementById('ta2').value = data.gains || "";
                document.getElementById('ta3').value = data.products_and_services || "";
                document.getElementById('ta4').value = data.customer_jobs || "";
                document.getElementById('ta5').value = data.pain_relievers || "";
                document.getElementById('ta6').value = data.pains || "";
                // document.getElementById('ta7').value = data.value_proposition || "";
                // document.getElementById('ta8').value = data.customer_segment || "";
            }
        }
    } catch (err) {
        console.error("Error loading Value Proposition:", err);
    }
}

async function submitValueProposition() {
    const fields = [
        'ta1','ta2','ta3','ta4','ta5','ta6'
    ];

    // Check all fields
    for (let id of fields) {
        const value = document.getElementById(id).value.trim();
        if (!value) {
            alert("All fields are mandatory! Please fill them before submitting.");
            return;
        }
        if (value.length > 400) {
            alert("Each field must be within 400 characters.");
            return;
        }
    }
    const data = {
        gain_creators: document.getElementById('ta1').value,
        gains: document.getElementById('ta2').value,
        products_and_services: document.getElementById('ta3').value,
        customer_jobs: document.getElementById('ta4').value,
        pain_relievers: document.getElementById('ta5').value,
        pains: document.getElementById('ta6').value,
        // value_proposition: document.getElementById('ta7').value,
        // customer_segment: document.getElementById('ta8').value
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/value-proposition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Value Proposition saved successfully!');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Something went wrong');
    }
}

// Attach events
document.getElementById('submitBtn').addEventListener('click', submitValueProposition);

// Load data when page loads
window.onload = loadValueProposition;