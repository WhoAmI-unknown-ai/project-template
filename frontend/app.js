// Frontend JavaScript
console.log('Project Template Frontend');

// Example DOM manipulation
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Add your frontend logic here
    const heading = document.querySelector('h1');
    if (heading) {
        heading.addEventListener('click', function() {
            console.log('Heading clicked!');
        });
    }
});
