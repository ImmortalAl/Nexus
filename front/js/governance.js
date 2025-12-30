/**
 * Echoes Unbound - Governance Page JavaScript
 */

(function() {
    'use strict';

    const API_BASE = window.NexusConfig?.API_BASE || 'https://nexus-ytrg.onrender.com/api';
    
    let proposals = [];
    let currentFilter = 'all';
    let currentUser = null;

    // DOM Elements
    const proposalsGrid = document.getElementById('proposalsGrid');
    const emptyState = document.getElementById('emptyState');
    const submitProposalBtn = document.getElementById('submitProposalBtn');
    const emptySubmitBtn = document.getElementById('emptySubmitBtn');
    const submitProposalModal = document.getElementById('submitProposalModal');
    const closeSubmitModal = document.getElementById('closeSubmitModal');
    const cancelSubmit = document.getElementById('cancelSubmit');
    const submitProposalForm = document.getElementById('submitProposalForm');
    const proposalDetailModal = document.getElementById('proposalDetailModal');
    const closeDetailModal = document.getElementById('closeDetailModal');
    const proposalDetailBody = document.getElementById('proposalDetailBody');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        currentUser = await getCurrentUser();
        setupEventListeners();
        await loadProposals();
    }

    async function getCurrentUser() {
        try {
            const token = localStorage.getItem('nexus_token');
            if (!token) return null;
            
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.user;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
        return null;
    }

    function setupEventListeners() {
        // Submit buttons
        submitProposalBtn?.addEventListener('click', openSubmitModal);
        emptySubmitBtn?.addEventListener('click', openSubmitModal);
        
        // Modal close
        closeSubmitModal?.addEventListener('click', closeSubmitModalFn);
        cancelSubmit?.addEventListener('click', closeSubmitModalFn);
        closeDetailModal?.addEventListener('click', closeDetailModalFn);
        
        // Form submit
        submitProposalForm?.addEventListener('submit', handleSubmitProposal);
        
        // Filters
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderProposals();
            });
        });

        // Close modals on backdrop click
        submitProposalModal?.addEventListener('click', (e) => {
            if (e.target === submitProposalModal) closeSubmitModalFn();
        });
        proposalDetailModal?.addEventListener('click', (e) => {
            if (e.target === proposalDetailModal) closeDetailModalFn();
        });
    }

    async function loadProposals() {
        try {
            const response = await fetch(`${API_BASE}/governance/proposals`);
            const data = await response.json();
            proposals = data.proposals || [];
            renderProposals();
        } catch (error) {
            console.error('Error loading proposals:', error);
            proposalsGrid.innerHTML = '<p class="error">Failed to load proposals</p>';
        }
    }

    function renderProposals() {
        let filtered = proposals;
        
        if (currentFilter !== 'all') {
            filtered = proposals.filter(p => p.status === currentFilter);
        }

        if (filtered.length === 0) {
            proposalsGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        proposalsGrid.innerHTML = filtered.map(p => createProposalCard(p)).join('');
        
        // Add click listeners
        proposalsGrid.querySelectorAll('.proposal-card').forEach(card => {
            card.addEventListener('click', () => openProposalDetail(card.dataset.id));
        });

        // Add second button listeners
        proposalsGrid.querySelectorAll('.second-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleSecond(btn.dataset.id);
            });
        });
    }

    function createProposalCard(proposal) {
        const secondsCount = proposal.seconds?.length || 0;
        const secondsNeeded = proposal.secondsRequired || 3;
        const secondsPercent = Math.min(100, (secondsCount / secondsNeeded) * 100);
        
        const canSecond = currentUser && 
                          proposal.status === 'discussion' && 
                          proposal.author?._id !== currentUser._id &&
                          !proposal.seconds?.some(s => s.user?._id === currentUser._id || s.user === currentUser._id);

        return `
            <div class="proposal-card" data-id="${proposal._id}">
                <div class="proposal-header">
                    <h3 class="proposal-title">${escapeHtml(proposal.title)}</h3>
                    <span class="proposal-status ${proposal.status}">${proposal.status}</span>
                </div>
                <p class="proposal-description">${escapeHtml(proposal.description)}</p>
                <div class="proposal-meta">
                    <span class="proposal-author">
                        <i class="fas fa-user"></i>
                        ${proposal.author?.displayName || proposal.author?.username || 'Unknown'}
                    </span>
                    <div class="proposal-stats">
                        ${proposal.status === 'voting' || proposal.status === 'passed' || proposal.status === 'failed' ? `
                            <span class="stat"><i class="fas fa-check"></i> ${proposal.votes?.approve || 0}</span>
                            <span class="stat"><i class="fas fa-times"></i> ${proposal.votes?.reject || 0}</span>
                        ` : ''}
                    </div>
                </div>
                ${proposal.status === 'discussion' ? `
                    <div class="seconds-progress">
                        <div class="seconds-bar">
                            <div class="seconds-fill" style="width: ${secondsPercent}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="seconds-text">${secondsCount}/${secondsNeeded} seconds to open voting</span>
                            ${canSecond ? `<button class="btn btn-sm btn-secondary second-btn" data-id="${proposal._id}">Second</button>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async function openProposalDetail(id) {
        const proposal = proposals.find(p => p._id === id);
        if (!proposal) return;

        const secondsCount = proposal.seconds?.length || 0;
        const secondsNeeded = proposal.secondsRequired || 3;

        const canVote = currentUser && proposal.status === 'voting';
        const hasVoted = false; // TODO: Check if user already voted

        proposalDetailBody.innerHTML = `
            <div class="proposal-detail">
                <div class="proposal-header" style="margin-bottom: 1rem;">
                    <span class="proposal-status ${proposal.status}">${proposal.status}</span>
                    <span style="color: var(--text-tertiary); font-size: 0.9rem;">
                        by ${proposal.author?.displayName || proposal.author?.username || 'Unknown'}
                    </span>
                </div>
                
                <h2 style="margin-bottom: 1rem;">${escapeHtml(proposal.title)}</h2>
                
                <div style="white-space: pre-wrap; margin-bottom: 1.5rem; color: var(--text-secondary);">
                    ${escapeHtml(proposal.description)}
                </div>

                ${proposal.status === 'discussion' ? `
                    <div class="seconds-progress" style="margin-bottom: 1.5rem;">
                        <h4>Community Support</h4>
                        <div class="seconds-bar" style="height: 10px; margin: 0.5rem 0;">
                            <div class="seconds-fill" style="width: ${(secondsCount / secondsNeeded) * 100}%"></div>
                        </div>
                        <p>${secondsCount} of ${secondsNeeded} seconds needed to open voting</p>
                    </div>
                ` : ''}

                ${proposal.status === 'voting' ? `
                    <div class="voting-section" style="margin-bottom: 1.5rem;">
                        <h4>Cast Your Vote</h4>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button class="btn btn-success vote-btn" data-vote="approve" data-id="${proposal._id}">
                                <i class="fas fa-check"></i> Approve (${proposal.votes?.approve || 0})
                            </button>
                            <button class="btn btn-danger vote-btn" data-vote="reject" data-id="${proposal._id}">
                                <i class="fas fa-times"></i> Reject (${proposal.votes?.reject || 0})
                            </button>
                        </div>
                        ${proposal.votingEndDate ? `
                            <p style="margin-top: 1rem; color: var(--text-tertiary);">
                                Voting ends: ${new Date(proposal.votingEndDate).toLocaleDateString()}
                            </p>
                        ` : ''}
                    </div>
                ` : ''}

                ${proposal.threadId ? `
                    <a href="/pages/messageboard.html?thread=${proposal.threadId}" class="btn btn-secondary">
                        <i class="fas fa-comments"></i> View Discussion
                    </a>
                ` : ''}
            </div>
        `;

        // Add vote button listeners
        proposalDetailBody.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', () => handleVote(btn.dataset.id, btn.dataset.vote));
        });

        proposalDetailModal.classList.add('open');
        proposalDetailModal.setAttribute('aria-hidden', 'false');
    }

    async function handleSecond(proposalId) {
        if (!currentUser) {
            alert('Please log in to second proposals');
            return;
        }

        try {
            const token = localStorage.getItem('nexus_token');
            const response = await fetch(`${API_BASE}/governance/proposals/${proposalId}/second`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                await loadProposals();
            } else {
                alert(data.error || 'Failed to second proposal');
            }
        } catch (error) {
            console.error('Error seconding proposal:', error);
            alert('Failed to second proposal');
        }
    }

    async function handleVote(proposalId, choice) {
        if (!currentUser) {
            alert('Please log in to vote');
            return;
        }

        try {
            const token = localStorage.getItem('nexus_token');
            const voteChoice = choice === 'approve' ? 'yes' : 'no';
            
            const response = await fetch(`${API_BASE}/governance/vote`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ proposalId, choice: voteChoice })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Vote recorded!');
                await loadProposals();
                closeDetailModalFn();
            } else {
                alert(data.error || 'Failed to vote');
            }
        } catch (error) {
            console.error('Error voting:', error);
            alert('Failed to vote');
        }
    }

    async function handleSubmitProposal(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please log in to submit proposals');
            return;
        }

        const formData = new FormData(submitProposalForm);
        const data = {
            title: formData.get('title'),
            type: formData.get('type'),
            description: formData.get('description'),
            votingDuration: parseInt(formData.get('votingPeriodDays'))
        };

        try {
            const token = localStorage.getItem('nexus_token');
            const response = await fetch(`${API_BASE}/governance/propose`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok) {
                alert('Proposal submitted! It needs 3 community seconds before voting opens.');
                closeSubmitModalFn();
                submitProposalForm.reset();
                await loadProposals();
            } else {
                alert(result.error || 'Failed to submit proposal');
            }
        } catch (error) {
            console.error('Error submitting proposal:', error);
            alert('Failed to submit proposal');
        }
    }

    function openSubmitModal() {
        if (!currentUser) {
            alert('Please log in to submit proposals');
            return;
        }
        submitProposalModal.classList.add('open');
        submitProposalModal.setAttribute('aria-hidden', 'false');
    }

    function closeSubmitModalFn() {
        submitProposalModal.classList.remove('open');
        submitProposalModal.setAttribute('aria-hidden', 'true');
    }

    function closeDetailModalFn() {
        proposalDetailModal.classList.remove('open');
        proposalDetailModal.setAttribute('aria-hidden', 'true');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
