function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('selectedTheme', theme);
}

window.onload = function () {
    const savedTheme = localStorage.getItem('selectedTheme') || 'light';
    document.body.className = savedTheme;
}