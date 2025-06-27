  // Password Toggle Function
        function togglePassword(fieldId) {
            const passwordInput = document.getElementById(fieldId);
            const toggleIcon = document.getElementById(fieldId + 'ToggleIcon');
            
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

        // Password Strength Checker
        document.getElementById('password').addEventListener('input', function() {
            const password = this.value;
            const strengthFill = document.getElementById('strengthFill');
            const strengthText = document.getElementById('strengthText');
            
            let strength = 0;
            let text = '';
            let color = '';
            
            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            switch (strength) {
                case 0:
                case 1:
                    text = 'Very Weak';
                    color = '#ff4757';
                    break;
                case 2:
                    text = 'Weak';
                    color = '#ff6b7a';
                    break;
                case 3:
                    text = 'Fair';
                    color = '#ffa502';
                    break;
                case 4:
                    text = 'Good';
                    color = '#3742fa';
                    break;
                case 5:
                    text = 'Strong';
                    color = '#2ed573';
                    break;
            }
            
            strengthFill.style.width = (strength * 20) + '%';
            strengthFill.style.backgroundColor = color;
            strengthText.textContent = text;
            strengthText.style.color = color;
        });

        // File Upload Handler
        document.getElementById('idProofImage').addEventListener('change', function() {
            const file = this.files[0];
            const filePreview = document.getElementById('filePreview');
            const fileName = document.getElementById('fileName');
            
            if (file) {
                fileName.textContent = file.name;
                filePreview.style.display = 'block';
                document.querySelector('.file-upload-area').style.display = 'none';
            }
        });

        // Remove File Function
        function removeFile() {
            document.getElementById('idProofImage').value = '';
            document.getElementById('filePreview').style.display = 'none';
            document.querySelector('.file-upload-area').style.display = 'block';
        }

        // Form Validation
        function validateForm() {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phoneNumber').value;
          
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please enter a valid email address');
            }
            
            // Phone validation
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
                throw new Error('Please enter a valid 10-digit phone number');
            }
            
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            return true;
        }

        // Register Handler Function
        async function handleRegister() {
            const submitBtn = document.querySelector('.btn-register');
            const btnText = document.querySelector('.btn-text');
            const btnIcon = document.querySelector('.btn-icon');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            
            // Clear previous messages
            errorMessage.textContent = '';
            successMessage.textContent = '';
            
            try {
                // Validate form
                validateForm();
                
                // Show loading state
                submitBtn.disabled = true;
                btnText.textContent = 'Creating Account...';
                btnIcon.className = 'fas fa-spinner fa-spin btn-icon';
                
                // Prepare form data
                const formData = new FormData();
                formData.append('firstName', document.getElementById('firstName').value);
                formData.append('lastName', document.getElementById('lastName').value);
                formData.append('username', document.getElementById('username').value);
                formData.append('email', document.getElementById('email').value);
                formData.append('phoneNumber', document.getElementById('phoneNumber').value);
                formData.append('address', document.getElementById('address').value);
                formData.append('password', document.getElementById('password').value);
                formData.append('idProofImage', document.getElementById('idProofImage').files[0]);

                const response = await fetch('/register', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Success state
                    btnText.textContent = 'Account Created!';
                    btnIcon.className = 'fas fa-check btn-icon';
                    successMessage.textContent = data.message || 'Account created successfully!';
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    throw new Error(data.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during registration:', error);
                errorMessage.textContent = error.message;
                
                // Reset button state
                submitBtn.disabled = false;
                btnText.textContent = 'Create Account';
                btnIcon.className = 'fas fa-arrow-right btn-icon';
            }
        }

        // Allow Enter key to submit
        document.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleRegister();
            }
        });