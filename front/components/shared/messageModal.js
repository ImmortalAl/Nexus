// front/components/shared/messageModal.js v1.5 - Standardized Module Pattern
// v1.5: Now dynamically injects modal HTML for true component sharing

(function() {
    window.NEXUS = window.NEXUS || {};

let messageModal, recipientNameElement, messageInputElement, messageHistoryElement, sendMessageBtnElement, closeMessageModalBtnElement;
    let currentBackdropListener = null;
    let currentRecipientUsername = null;
    let typingTimeout = null;
    let isInitialized = false;

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    let scrollTimeout = null;
    let DISABLE_ALL_SCROLLING = false; // Re-enabled since scrolling wasn't the problem

    function scrollToBottom() {
        // Simplified scroll - just scroll to bottom immediately
        if (messageHistoryElement) {
            messageHistoryElement.scrollTop = messageHistoryElement.scrollHeight;
        }
    }

    function addMessageToUI(content, isSent, isError = false, timestamp = new Date(), shouldScroll = true) {
        if(!messageHistoryElement) return;
        
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'} ${isError ? 'error' : ''}`;
        const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.innerHTML = `<span class="message-text">${escapeHTML(content)}</span><span class="message-time">${time}</span>`;
        messageHistoryElement.appendChild(messageDiv);
        
        
        // Use debounced scroll only for new messages
        if (shouldScroll) {
            scrollToBottom();
        }
    }

    async function handleSendMessage() {
        if (!messageInputElement || !messageInputElement.value.trim() || !currentRecipientUsername) return;
        const messageText = messageInputElement.value.trim();
        messageInputElement.value = '';
        addMessageToUI(messageText, true, false, new Date());
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No auth token');
            await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/messages/send`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientUsername: currentRecipientUsername, content: messageText })
            });
        } catch (error) {
            console.error('[MessageModal] Error sending message:', error);
            addMessageToUI('Failed to send message.', true, true);
        }
    }
    
    function displayMessages(messages) {
        if(!messageHistoryElement) return;
        
        
        messageHistoryElement.innerHTML = '';
        if (messages.length === 0) {
            messageHistoryElement.innerHTML = '<p class="modal-info">No messages yet.</p>';
            return;
        }
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) return;
        const currentUserId = currentUser.id || currentUser._id;
        
        messages.forEach((message, index) => {
            addMessageToUI(message.content, (message.sender._id || message.sender.id) === currentUserId, false, new Date(message.timestamp), false);
        });
        // Use the same debounced scroll for consistency
        scrollToBottom();
    }
    
    async function loadConversation(username) {
        try {
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('No auth token');
            const response = await fetch(`${window.NEXUS_CONFIG.API_BASE_URL}/messages/conversation/${username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const messages = await response.json();
            displayMessages(messages);
        } catch (error) {
            console.error('[MessageModal] Error loading conversation:', error);
            if(messageHistoryElement) messageHistoryElement.innerHTML = '<p class="modal-error">Failed to load.</p>';
        }
    }

    function close() {
        if (!isInitialized || !messageModal) return;
        messageModal.classList.remove('active');
        messageModal.setAttribute('aria-hidden', 'true');
        
        // Simple body overflow restoration
        document.body.style.overflow = '';
        
        currentRecipientUsername = null;
        if (currentBackdropListener) {
            messageModal.removeEventListener('click', currentBackdropListener);
            currentBackdropListener = null;
        }
        
    }

function initMessageModal() {
    // Inject the Message Modal HTML if it doesn't exist
    if (!document.getElementById('messageModal')) {
        const modalHTML = `
            <div id="messageModal" class="modal" aria-hidden="true">
                <div class="message-modal-content" role="dialog" aria-labelledby="messageTitle">
                    <h3 id="messageTitle">Direct Message</h3>
                    <p id="recipientName">To: Username</p>
                    <div class="message-history" id="messageHistory"></div>
                    <div>
                        <input type="text" id="messageInput" placeholder="Inscribe your eternal message..." required>
                        <div class="modal-actions">
                            <button type="submit" id="sendMessageBtn">Send Whisper</button>
                            <button type="button" id="closeMessageModal">Close Nexus</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML.trim();
        const modalElement = modalContainer.firstElementChild;
        if (modalElement) {
            document.body.appendChild(modalElement);
        }
    }

    messageModal = document.getElementById('messageModal');
        recipientNameElement = document.getElementById('recipientName');
        messageInputElement = document.getElementById('messageInput');
        messageHistoryElement = document.getElementById('messageHistory');
        sendMessageBtnElement = document.getElementById('sendMessageBtn');
        closeMessageModalBtnElement = document.getElementById('closeMessageModal');

        if (!messageModal || !closeMessageModalBtnElement) {
            console.warn('[messageModal.js] Core modal elements not found. Modal may not function correctly.');
        return;
    }

        closeMessageModalBtnElement.addEventListener('click', close);

    if (sendMessageBtnElement) {
        sendMessageBtnElement.addEventListener('click', handleSendMessage);
    }

    if (messageInputElement) {
        messageInputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        messageInputElement.addEventListener('input', handleTyping);
    }

    // Removed scroll event listeners - they were contributing to scrollbar issues

    // Set up WebSocket message listeners to handle incoming messages properly
    if (window.NEXUS && window.NEXUS.websocket) {
        window.NEXUS.websocket.on('newMessage', handleIncomingMessage);
    }

    // Escape key handler for closing modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && messageModal && messageModal.classList.contains('active')) {
            close();
        }
    });

    isInitialized = true;
}

async function openMessageModal(username) {
        if (!messageModal) {
            // Let's auto-init if needed, this makes it more robust
        initMessageModal();
            if(!messageModal) {
                 console.error('[messageModal.js] Modal not found even after auto-init.');
            return;
        }
    }


    currentRecipientUsername = username;
        if(recipientNameElement) recipientNameElement.textContent = `To: ${username}`;
        if(messageHistoryElement) messageHistoryElement.innerHTML = '<p class="modal-loading">Loading eternal whispers...</p>';

    // DON'T close active users sidebar - CSS now handles z-index properly
    // Sidebar stays visible and above modal for easy access to other users

    messageModal.classList.add('active');
    messageModal.setAttribute('aria-hidden', 'false');
    // DON'T set inline z-index - let CSS z-index system handle it properly
    document.body.style.overflow = 'hidden';

    if (messageInputElement) {
        setTimeout(() => messageInputElement.focus(), 100);
    }

    await loadConversation(username);
    
    setTimeout(() => {
        if (currentBackdropListener) {
            messageModal.removeEventListener('click', currentBackdropListener);
        }
        currentBackdropListener = (event) => {
            if (event.target === messageModal) {
                close();
            }
        };
        messageModal.addEventListener('click', currentBackdropListener);
        }, 300);
    }

    function handleTyping() {
        if (!currentRecipientUsername || !window.NEXUS || !window.NEXUS.websocket) return;
        if (typingTimeout) clearTimeout(typingTimeout);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
        window.NEXUS.websocket.sendTypingIndicator(currentRecipientUsername, true);
        typingTimeout = setTimeout(() => {
            window.NEXUS.websocket.sendTypingIndicator(currentRecipientUsername, false);
        }, 2000);
    }
}

    function handleIncomingMessage(data) {
        
        // Only handle messages if modal is open and it's for the current conversation
        if (!messageModal || !messageModal.classList.contains('active') || !currentRecipientUsername) {
            return;
        }
        
        // Check if message is part of current conversation
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
            return;
        }
        
        const currentUserId = currentUser.id || currentUser._id;
        const isFromCurrentRecipient = data.sender._id === currentRecipientUsername || data.sender.username === currentRecipientUsername;
        const isToCurrentUser = data.recipient._id === currentUserId || data.recipient.id === currentUserId;
        
        if (isFromCurrentRecipient && isToCurrentUser) {
            // Add the incoming message using our proper debounced scroll system
            addMessageToUI(data.content, false, false, new Date(data.timestamp), true);
        }
    }

// Mobile keyboard detection removed - was causing scrollbar issues

// Expose to global Nexus object
window.NEXUS.initMessageModal = initMessageModal;
    window.NEXUS.openMessageModal = openMessageModal; // Still useful to expose for direct calls if needed

// Auto-initialize when DOM is ready (as backup if nexus-core doesn't do it)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMessageModal);
} else {
    // DOM is already ready
    setTimeout(initMessageModal, 0);
}
})(); 