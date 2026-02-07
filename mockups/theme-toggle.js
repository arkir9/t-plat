// Theme Toggle Script
(function() {
    const themeToggle = document.createElement('button');
    themeToggle.innerHTML = '🌙';
    themeToggle.className = 'theme-toggle';
    themeToggle.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: #FFFFFF;
        font-size: 20px;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s;
    `;
    
    let isDark = true;
    
    themeToggle.addEventListener('click', () => {
        isDark = !isDark;
        document.body.classList.toggle('light-mode');
        themeToggle.innerHTML = isDark ? '🌙' : '☀️';
    });
    
    document.body.appendChild(themeToggle);
})();
