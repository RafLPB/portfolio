// Spatial Portfolio Interaction Script

document.addEventListener('DOMContentLoaded', () => {
    // Star Background Animation
    function createStarfield() {
        const starContainer = document.createElement('div');
        starContainer.style.position = 'fixed';
        starContainer.style.top = '0';
        starContainer.style.left = '0';
        starContainer.style.width = '100%';
        starContainer.style.height = '100%';
        starContainer.style.pointerEvents = 'none';
        starContainer.style.zIndex = '-1';
        document.body.appendChild(starContainer);

        function createStar() {
            const star = document.createElement('div');
            star.style.position = 'absolute';
            star.style.backgroundColor = 'white';
            star.style.borderRadius = '50%';
            star.style.width = `${Math.random() * 2}px`;
            star.style.height = star.style.width;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.opacity = `${Math.random()}`;
            star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite`;
            starContainer.appendChild(star);
        }

        // Create 200 stars
        for (let i = 0; i < 200; i++) {
            createStar();
        }
    }

    // Parallax Effect for Project Cards
    function initParallaxCards() {
        const cards = document.querySelectorAll('.project-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 20;
                const rotateY = -(x - centerX) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                card.style.transition = 'transform 0.1s ease-out';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }

    // Typewriter Effect for Title
    function typewriterEffect() {
        const title = document.querySelector('.title');
        if (!title) return;

        const text = title.textContent;
        title.textContent = '';

        let index = 0;
        function type() {
            if (index < text.length) {
                title.textContent += text.charAt(index);
                index++;
                setTimeout(type, 100);
            }
        }
        type();
    }

    // Navigation Smooth Scrolling
    function smoothScrolling() {
        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    }

    // Cosmic Glow Effect for Buttons
    function cosmicGlowButtons() {
        const buttons = document.querySelectorAll('.btn');

        buttons.forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                const glow = document.createElement('div');
                glow.classList.add('cosmic-glow');
                glow.style.position = 'absolute';
                glow.style.top = '0';
                glow.style.left = '0';
                glow.style.width = '100%';
                glow.style.height = '100%';
                glow.style.background = 'radial-gradient(circle, rgba(76,201,240,0.3) 0%, transparent 70%)';
                glow.style.pointerEvents = 'none';
                glow.style.zIndex = '-1';
                button.style.position = 'relative';
                button.appendChild(glow);
            });

            button.addEventListener('mouseleave', () => {
                const glow = button.querySelector('.cosmic-glow');
                if (glow) {
                    button.removeChild(glow);
                }
            });
        });
    }

    // Add Global Styles for Animations
    function addGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes twinkle {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize All Functions
    createStarfield();
    initParallaxCards();
    typewriterEffect();
    smoothScrolling();
    cosmicGlowButtons();
    addGlobalStyles();
});