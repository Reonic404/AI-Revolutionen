document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile specific menu toggle
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            nav.classList.toggle('open');
            // Change icon
            const isOpened = nav.classList.contains('open');
            hamburger.innerHTML = isOpened ? '&times;' : '&#9776;';
        });
    }

    // 2. Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal');

    function checkReveal() {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        reveals.forEach(reveal => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', checkReveal);
    checkReveal(); // Trigger once on load

    // 3. FAQ Accordion Logic
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        // Init accessibility attributes
        question.setAttribute('aria-expanded', 'false');

        question.addEventListener('click', () => {
            const item = question.parentNode;
            
            // Close other open faqs
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if(otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherBtn = otherItem.querySelector('.faq-question');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current
            const isCurrentlyActive = item.classList.contains('active');
            item.classList.toggle('active');
            question.setAttribute('aria-expanded', !isCurrentlyActive);
        });
    });

    // 4. Cool Neural Network Background Effect
    initNeuralBackground();

    // 5. Hidden Admin Access
    initHiddenAdmin();
});

function initHiddenAdmin() {
    let keys = '';
    let timeout;
    window.addEventListener('keydown', (e) => {
        // Only track single characters (ignore Shift, Control, etc.)
        if (e.key.length === 1) {
            keys += e.key.toLowerCase();
            clearTimeout(timeout);
            
            if (keys.endsWith('admin')) {
                window.location.href = 'admin.html';
            }

            // Reset after 3 seconds of no typing
            timeout = setTimeout(() => { keys = ''; }, 3000);
            
            if (keys.length > 10) keys = keys.substring(1);
        }
    });

    // Method 2: Clicking copyright 5 times
    const copyright = document.querySelector('footer p');
    if (copyright) {
        let clicks = 0;
        copyright.style.cursor = 'default';
        copyright.addEventListener('click', () => {
            clicks++;
            if (clicks >= 5) {
                window.location.href = 'admin.html';
            }
            // Reset clicks after 2 seconds of inactivity
            setTimeout(() => { clicks = 0; }, 2000);
        });
    }
}

function initNeuralBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'neural-canvas';
    document.body.prepend(canvas);
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const computedStyle = getComputedStyle(document.body);
    const particleRgb = computedStyle.getPropertyValue('--bg-particle').trim() || '59, 130, 246';

    const particles = [];
    const properties = {
        bgColor: 'rgba(13, 15, 20, 1)',
        particleColor: `rgba(${particleRgb}, 0.8)`,
        particleRadius: 2,
        particleCount: 60,
        particleMaxVelocity: 0.5,
        lineLength: 150,
        particleLife: 6
    };

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.velocityX = Math.random() * (properties.particleMaxVelocity * 2) - properties.particleMaxVelocity;
            this.velocityY = Math.random() * (properties.particleMaxVelocity * 2) - properties.particleMaxVelocity;
        }
        position() {
            this.x += this.velocityX;
            this.y += this.velocityY;
            if (this.x > width || this.x < 0) this.velocityX *= -1;
            if (this.y > height || this.y < 0) this.velocityY *= -1;
        }
        reDraw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, properties.particleRadius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = properties.particleColor;
            ctx.fill();
        }
    }

    function reDrawLines() {
        let x1, y1, x2, y2, length, opacity;
        for (let i in particles) {
            for (let j in particles) {
                x1 = particles[i].x;
                y1 = particles[i].y;
                x2 = particles[j].x;
                y2 = particles[j].y;
                length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                if (length < properties.lineLength) {
                    opacity = 1 - length / properties.lineLength;
                    ctx.lineWidth = '0.5';
                    ctx.strokeStyle = `rgba(${particleRgb}, ${opacity})`;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }
    }

    for (let i = 0; i < properties.particleCount; i++) {
        particles.push(new Particle());
    }

    function loop() {
        ctx.clearRect(0, 0, width, height);
        for (let i in particles) {
            particles[i].position();
            particles[i].reDraw();
        }
        reDrawLines();
        requestAnimationFrame(loop);
    }
    loop();
}
