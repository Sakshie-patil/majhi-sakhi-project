    

    
        // Password Toggle Function => for password eye functionality
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('passwordToggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        }

       // Login Handler Function - (when we click on login button it will call tot his func)
async function handleLogin() {
    const submitBtn = document.querySelector('.btn-login');
    const btnText = document.querySelector('.btn-text');
    const btnIcon = document.querySelector('.btn-icon');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get form values
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    
    // Basic validation
    if (!username || !password) {
        errorMessage.textContent = 'Please fill in all fields.';
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Signing In...';
    btnIcon.className = 'fas fa-spinner fa-spin btn-icon';
    errorMessage.textContent = '';

    // making API call to backend
    // Sends a POST request to the /login route (backend)
    // await waits for the response before moving on
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        console.log('Login response:', data); // DEBUG LOG

        if (response.ok) {
            // Store user data in localStorage => Useful to keep the user logged in across pages
            const userData = {
                _id: data.user._id,                   
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                email: data.user.email,
                phoneNumber: data.user.phoneNumber,   
                username: data.user.username         
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('Saved userData:', userData); // DEBUG LOG
            
            // Success state => shows success on ui 
            btnText.textContent = 'Success!';
            btnIcon.className = 'fas fa-check btn-icon';
            
            // Redirect after delay of 1s to profile of user
            setTimeout(() => {
                window.location.href = `/profile.html?id=${data.user._id}`;
            }, 1000);
        } else {
            throw new Error(data.error || "Login failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during login:", error);
        errorMessage.textContent = error.message || "An error occurred. Please try again later.";
        
        // Reset button state
        submitBtn.disabled = false;
        btnText.textContent = 'Sign In';
        btnIcon.className = 'fas fa-arrow-right btn-icon';
    }
}