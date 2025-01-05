// options.js
document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    
    function showStatus(message) {
        statusDiv.textContent = message;
        statusDiv.className = 'success';
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Load saved email
    try {
        const { defaultEmail } = await browser.storage.sync.get('defaultEmail');
        if (defaultEmail) {
            document.getElementById('defaultEmail').value = defaultEmail;
        }
    } catch (error) {
        console.error('Error loading saved email:', error);
    }

    // Save settings
    document.getElementById('save').addEventListener('click', async () => {
        const defaultEmail = document.getElementById('defaultEmail').value.trim();
        await browser.storage.sync.set({ defaultEmail });
        showStatus('Settings saved!');
    });
});