// Animation utilities
const animationUtils = {
    fadeIn: (element, delay = 0) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    },
    
    staggerChildren: (parent, staggerDelay = 100) => {
        const children = parent.children;
        Array.from(children).forEach((child, index) => {
            animationUtils.fadeIn(child, index * staggerDelay);
        });
    },

    initializeObserver: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        return observer;
    }
};

// Add styles
const style = document.createElement('style');
style.innerHTML = `
    .animate-on-load {
        opacity: 0;
        transform: translateY(20px);
    }

    .fade-in {
        animation: fadeIn 0.6s ease forwards;
    }

    .slide-in {
        animation: slideIn 0.6s ease forwards;
    }

    .scale-in {
        animation: scaleIn 0.6s ease forwards;
    }

    .visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }

    .hover-scale {
        transition: transform 0.3s ease;
    }

    .hover-scale:hover {
        transform: scale(1.02);
    }

    .card-shadow {
        transition: box-shadow 0.3s ease, transform 0.3s ease;
    }

    .card-shadow:hover {
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// Authentication functions
const auth = {
    login: async (email, password) => {
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    signup: async (formData) => {
        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            return await response.json();
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    logout: async () => {
        try {
            await fetch('/logout');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    getCurrentUser: async () => {
        try {
            const response = await fetch('/api/user');
            if (response.status === 401) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },

    // New function to update sidebar based on auth state
    updateSidebar: async () => {
        const user = await auth.getCurrentUser();
        const sidebarBottom = document.querySelector('.sidebar-bottom');
        if (!sidebarBottom) return;

        if (user) {
            sidebarBottom.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img class="w-8 h-8 rounded-full mr-2" 
                             src="https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}" 
                             alt="User avatar"/>
                        <span class="text-sm font-medium">${user.first_name} ${user.last_name}</span>
                    </div>
                    <button onclick="logout()" class="text-gray-700 hover:text-gray-900">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            sidebarBottom.innerHTML = `
                <button onclick="window.location.href='/signup'" class="bg-teal-600 text-white py-2 px-4 rounded mb-4 w-full">Sign Up</button>
                <button onclick="window.location.href='/login'" class="text-gray-700 hover:text-gray-900 w-full">Log in</button>
            `;
        }
    }
};

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Immediate load animations
    const elements = document.querySelectorAll('.animate-on-load');
    elements.forEach((element, index) => {
        animationUtils.fadeIn(element, index * 100);
    });

    // Scroll animations
    const observer = animationUtils.initializeObserver();
    document.querySelectorAll('.scroll-animate').forEach(element => {
        observer.observe(element);
    });

    // Grid animations
    document.querySelectorAll('.grid-animate').forEach(grid => {
        animationUtils.staggerChildren(grid);
    });

    // Add hover effects
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('card-shadow');
        card.classList.add('hover-scale');
    });

    // Update sidebar on all pages
    await auth.updateSidebar();

    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = this.querySelector('input[name="email"]').value;
            const password = this.querySelector('input[name="password"]').value;
            
            const result = await auth.login(email, password);
            if (result.success) {
                window.location.href = result.redirect;
            } else {
                alert(result.error || 'Login failed');
            }
        });
    }

    // Handle signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                firstName: this.querySelector('input[name="firstName"]').value,
                lastName: this.querySelector('input[name="lastName"]').value,
                email: this.querySelector('input[name="email"]').value,
                password: this.querySelector('input[name="password"]').value
            };
            
            const result = await auth.signup(formData);
            if (result.success) {
                window.location.href = result.redirect;
            } else {
                alert(result.error || 'Signup failed');
            }
        });
    }

    // Initialize dashboard if on dashboard page
    const dashboardPage = document.getElementById('welcomeName');
    if (dashboardPage) {
        const user = await auth.getCurrentUser();
        if (user) {
            document.getElementById('welcomeName').textContent = user.first_name;
            document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
            document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}`;
        }
    }
});

// Global logout function
function logout() {
    auth.logout();
} 