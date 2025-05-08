document.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY; // Get the vertical scroll position
    const maxScroll = 300; // Adjust this value to control the fade effect
    const opacity = Math.max(1 - scrollPosition / maxScroll, 0); // Calculate opacity
    document.getElementById("grid-background").style.opacity = opacity; // Apply opacity
});