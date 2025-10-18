/**
 * Immortal Poll System
 * Interactive public polling for unlogged users with IP-based vote limiting
 */
class ImmortalPoll {
    constructor() {
        this.pollId = 'censorship-justified'; // Unique poll identifier
        this.apiBaseUrl = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';
        this.hasVoted = false;
        this.userVote = null;

        this.init();
    }

    async init() {
        try {
            // Load current poll results
            await this.loadPollResults();

            // Setup event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('[ImmortalPoll] Failed to initialize:', error);
            this.showError('Failed to load poll');
        }
    }

    async loadPollResults() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/poll/${this.pollId}`, {
                signal: AbortSignal.timeout(10000)
            }).catch(err => {
                console.warn('[ImmortalPoll] Network error:', err.message);
                return null;
            });

            if (!response || !response.ok) {
                console.warn('[ImmortalPoll] Failed to load results, using defaults');
                this.renderPollResults({ yes: 0, no: 0, total: 0 });
                return;
            }

            const data = await response.json();

            // Check if user has already voted
            this.hasVoted = data.hasVoted || false;
            this.userVote = data.userVote || null;

            // Render the results
            this.renderPollResults(data);

            // If user has voted, highlight their choice (but keep voting enabled for changes)
            if (this.hasVoted && this.userVote) {
                this.highlightUserVote(this.userVote);
            }

        } catch (error) {
            console.error('[ImmortalPoll] Error loading results:', error);
            this.renderPollResults({ yes: 0, no: 0, total: 0 });
        }
    }

    renderPollResults(data) {
        const yesVotes = data.yes || 0;
        const noVotes = data.no || 0;
        const totalVotes = data.total || 0;

        // Calculate percentages
        const yesPercentage = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0;
        const noPercentage = totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 0;

        // Update NO option (Free Speech)
        const noOption = document.getElementById('pollOptionNo');
        if (noOption) {
            const noFill = noOption.querySelector('.poll-option-fill');
            const noPercent = noOption.querySelector('.poll-percentage');
            const noCount = noOption.querySelector('.poll-count');

            if (noFill) noFill.style.width = noPercentage + '%';
            if (noPercent) noPercent.textContent = noPercentage + '%';
            if (noCount) noCount.textContent = `${noVotes} vote${noVotes !== 1 ? 's' : ''}`;
        }

        // Update YES option (Some Speech Harms)
        const yesOption = document.getElementById('pollOptionYes');
        if (yesOption) {
            const yesFill = yesOption.querySelector('.poll-option-fill');
            const yesPercent = yesOption.querySelector('.poll-percentage');
            const yesCount = yesOption.querySelector('.poll-count');

            if (yesFill) yesFill.style.width = yesPercentage + '%';
            if (yesPercent) yesPercent.textContent = yesPercentage + '%';
            if (yesCount) yesCount.textContent = `${yesVotes} vote${yesVotes !== 1 ? 's' : ''}`;
        }

        // Update total votes
        const totalElement = document.getElementById('pollTotalVotes');
        if (totalElement) {
            totalElement.textContent = totalVotes;
        }
    }

    setupEventListeners() {
        const pollOptions = document.querySelectorAll('.poll-option');

        pollOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                const vote = option.dataset.vote;

                // If user already voted, allow them to change their vote
                if (this.hasVoted) {
                    // Check if they're clicking the same option they already voted for
                    if (this.userVote === vote) {
                        this.showMessage('You already voted for this option', 'info');
                        return;
                    }

                    // User is changing their vote
                    await this.changeVote(vote);
                    return;
                }

                // First time voting
                await this.submitVote(vote);
            });
        });
    }

    async submitVote(vote) {
        if (this.hasVoted) return;

        try {
            // Show loading state
            this.showMessage('Casting your eternal vote...', 'loading');

            const response = await fetch(`${this.apiBaseUrl}/poll/${this.pollId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vote }),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit vote');
            }

            const data = await response.json();

            // Update state
            this.hasVoted = true;
            this.userVote = vote;

            // Update UI
            this.renderPollResults(data.results);
            this.highlightUserVote(vote);
            this.showMessage('Your eternal voice has been heard! 🔥', 'success');

        } catch (error) {
            console.error('[ImmortalPoll] Vote submission failed:', error);
            this.showMessage('Failed to cast vote. Please try again.', 'error');
        }
    }

    async changeVote(newVote) {
        try {
            // Show loading state
            this.showMessage('Changing your eternal vote...', 'loading');

            const response = await fetch(`${this.apiBaseUrl}/poll/${this.pollId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vote: newVote }),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to change vote');
            }

            const data = await response.json();

            // Update state
            this.userVote = newVote;

            // Update UI
            this.renderPollResults(data.results);
            this.highlightUserVote(newVote);
            this.showMessage('Vote changed! Your new voice echoes through eternity 🔄', 'success');

        } catch (error) {
            console.error('[ImmortalPoll] Vote change failed:', error);
            this.showMessage('Failed to change vote. Please try again.', 'error');
        }
    }

    highlightUserVote(vote) {
        // Remove any existing highlights
        document.querySelectorAll('.poll-option').forEach(opt => {
            opt.classList.remove('poll-option-selected');
        });

        // Highlight the user's choice
        const selectedOption = document.querySelector(`.poll-option[data-vote="${vote}"]`);
        if (selectedOption) {
            selectedOption.classList.add('poll-option-selected');
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('pollMessage');
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.className = `poll-message poll-message-${type}`;
        messageEl.style.display = 'block';

        // Auto-hide success/error messages after 5 seconds
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        } else if (type === 'loading') {
            // Loading messages stay until replaced
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize poll when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pollOptions')) {
        window.immortalPoll = new ImmortalPoll();
    }
});
