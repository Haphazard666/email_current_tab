// Only showing the changed file (popup.js) - all other files remain the same
document.addEventListener('DOMContentLoaded', async () => {
    const emailInput = document.getElementById('recipientEmail');
    const statusDiv = document.getElementById('status');
    const lastUsedDiv = document.getElementById('lastUsedEmail');

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'error' : 'success';
        statusDiv.style.display = 'block';
        if (!isError) {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    // Load saved emails
    try {
        const { defaultEmail, lastUsedEmail } = await browser.storage.sync.get(['defaultEmail', 'lastUsedEmail']);
        
        if (lastUsedEmail) {
            lastUsedDiv.textContent = `Last used: ${lastUsedEmail}`;
            lastUsedDiv.onclick = () => {
                emailInput.value = lastUsedEmail;
                emailInput.focus();
            };
        }

        emailInput.value = defaultEmail || lastUsedEmail || '';
    } catch (error) {
        console.log('Storage error: ' + error.message);
    }

    document.getElementById('sendEmail').addEventListener('click', async () => {
        const recipientEmail = emailInput.value.trim();
        
        if (!recipientEmail) {
            showStatus('Please enter an email address', true);
            return;
        }

        try {
            showStatus('Processing page...');
            
            // Get current tab
            const tabs = await browser.tabs.query({active: true, currentWindow: true});
            const tab = tabs[0];

            // Simplified content extraction
            const extractContent = `
                (function() {
                    const title = document.title || 'Shared Page';
                    const url = window.location.href;
                    
                    // Try to get main content
                    let content = '';
                    try {
                        const article = document.querySelector('article');
                        const main = document.querySelector('main');
                        const body = document.body;
                        
                        const sourceElement = article || main || body;
                        content = sourceElement.innerText || sourceElement.textContent || '';
                        
                        // Limit content length
                        content = content.substring(0, 5000);
                    } catch (e) {
                        content = "Could not extract page content.";
                    }
                    
                    return { title, url, content };
                })();
            `;

            const [results] = await browser.tabs.executeScript({
                code: extractContent
            });

            // Create email content
            const subject = encodeURIComponent(results.title);
            const body = encodeURIComponent(
                `Check out this page:\n\n` +
                `URL: ${results.url}\n\n` +
                `Content Preview:\n${results.content}\n`
            );

            // Save as last used email
            await browser.storage.sync.set({ lastUsedEmail: recipientEmail });

            // Create and open Gmail URL
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${subject}&body=${body}`;
            
            showStatus('Opening Gmail...');
            await browser.tabs.create({ url: gmailUrl });
            
            // Close popup after success
            setTimeout(() => window.close(), 2000);

        } catch (error) {
            console.error('Error:', error);
            
            // Fallback to simple URL sharing if content extraction fails
            try {
                const tabs = await browser.tabs.query({active: true, currentWindow: true});
                const tab = tabs[0];
                
                const subject = encodeURIComponent(tab.title || 'Shared Page');
                const body = encodeURIComponent(`Check out this page:\n\n${tab.url}`);
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${subject}&body=${body}`;
                
                showStatus('Opening Gmail (URL only)...');
                await browser.tabs.create({ url: gmailUrl });
                setTimeout(() => window.close(), 2000);
            } catch (fallbackError) {
                showStatus('Error: Could not send email. Please try again.', true);
                console.error('Fallback error:', fallbackError);
            }
        }
    });
});