// Add manifest link dynamically
document.addEventListener("DOMContentLoaded", function() {
    var link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/admin-manifest.json';
    document.head.appendChild(link);
    
    // Also add iOS specific tags
    var appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = '/static/pwa/icon-192x192.png';
    document.head.appendChild(appleTouchIcon);
    
    var appleMobileWebAppCapable = document.createElement('meta');
    appleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
    appleMobileWebAppCapable.content = 'yes';
    document.head.appendChild(appleMobileWebAppCapable);
    
    var appleMobileWebAppStatusBarStyle = document.createElement('meta');
    appleMobileWebAppStatusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
    appleMobileWebAppStatusBarStyle.content = 'default';
    document.head.appendChild(appleMobileWebAppStatusBarStyle);
});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/admin-sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
