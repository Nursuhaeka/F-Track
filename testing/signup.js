// signup.js
document.getElementById('signup-form').onsubmit = function(event) {
    event.preventDefault();
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let role = document.getElementById('role').value;

    // Call your backend to create the user in Firebase Authentication and save their role
    fetch('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => console.log('User created:', data))
    .catch(error => console.error('Error:', error));
};
