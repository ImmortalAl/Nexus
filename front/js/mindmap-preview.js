/**
 * Mindmap Preview for Front Page
 * Simplified version of the full mindmap functionality
 */
class MindmapPreview {
    constructor() {
        this.container = document.getElementById('mindmapPreview');
        this.nodesContainer = document.getElementById('mindmapPreviewNodes');
        this.connectionsContainer = document.getElementById('mindmapPreviewConnections');
        this.tooltip = document.getElementById('mindmapPreviewTooltip');
        this.searchInput = document.getElementById('mindmapPreviewSearch');
        this.searchBtn = document.getElementById('mindmapPreviewSearchBtn');
        this.statsContainer = document.getElementById('mindmapStats');

        this.data = null;
        this.selectedNode = null;

        // Pan/drag state
        this.isPanning = false;
        this.startPanX = 0;
        this.startPanY = 0;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;

        this.init();
    }
    
    async init() {
        try {
            // Load preview data
            await this.loadPreviewData();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Hide loading indicator
            const loading = this.container.querySelector('.mindmap-loading');
            if (loading) {
                loading.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Failed to initialize mindmap preview:', error);
            this.showError('Failed to load Nexus preview');
        }
    }
    
    async loadPreviewData() {
        try {
            const apiBaseUrl = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';
            const response = await fetch(`${apiBaseUrl}/mindmap/preview`, {
                signal: AbortSignal.timeout(10000) // 10 second timeout
            }).catch(err => {
                // Handle network errors gracefully
                if (err.name === 'AbortError') {
                    console.warn('[Mindmap Preview] Request timed out, API may be offline');
                } else {
                    console.warn('[Mindmap Preview] Network error:', err.message);
                }
                return null;
            });

            if (!response || !response.ok) {
                console.warn('[Mindmap Preview] Using fallback mock data');
                // Use mock data for preview/testing
                this.data = this.getMockData();
            } else {
                this.data = await response.json();
            }

            // Render the preview
            this.renderNodes();
            this.renderConnections();
            this.renderStats();

        } catch (error) {
            console.warn('[Mindmap Preview] Error loading data:', error.message);
            // Use mock data as fallback
            this.data = this.getMockData();
            this.renderNodes();
            this.renderConnections();
            this.renderStats();
        }
    }

    getMockData() {
        // Mock data for preview/testing when API is unavailable
        return {
            nodes: [
                {
                    _id: '1',
                    title: 'Israel',
                    position: { x: 50, y: 100 },
                    content: 'Middle Eastern country',
                    credibility: { score: 75 },
                    creator: { username: 'ImmortalAl' }
                },
                {
                    _id: '2',
                    title: 'Express VPN',
                    position: { x: 300, y: 80 },
                    content: 'VPN service provider',
                    credibility: { score: 60 },
                    creator: { username: 'System' }
                },
                {
                    _id: '3',
                    title: 'Privacy',
                    position: { x: 180, y: 200 },
                    content: 'Digital privacy concept',
                    credibility: { score: 85 },
                    creator: { username: 'ImmortalAl' }
                },
                {
                    _id: '4',
                    title: 'Technology',
                    position: { x: 400, y: 200 },
                    content: 'Modern technology trends',
                    credibility: { score: 70 },
                    creator: { username: 'System' }
                }
            ],
            edges: [
                {
                    sourceNode: '1',
                    targetNode: '2',
                    relationshipLabel: 'Uses'
                },
                {
                    sourceNode: '2',
                    targetNode: '3',
                    relationshipLabel: 'Protects'
                },
                {
                    sourceNode: '3',
                    targetNode: '4',
                    relationshipLabel: 'Enabled by'
                }
            ],
            stats: {
                totalNodes: 4,
                totalConnections: 3,
                recentActivity: 'Latest: Express VPN'
            }
        };
    }

    showOfflineMessage() {
        if (this.nodesContainer) {
            this.nodesContainer.innerHTML = `
                <div class="mindmap-offline-message">
                    <i class="fas fa-wifi-slash"></i>
                    <p>Mindmap preview temporarily unavailable</p>
                </div>
            `;
        }
    }
    
    renderNodes() {
        if (!this.data || !this.data.nodes) return;

        this.nodesContainer.innerHTML = '';

        // Handle empty state
        if (this.data.nodes.length === 0) {
            this.showEmptyState();
            return;
        }

        // Calculate smart layout for preview
        const layout = this.calculateCompactLayout();

        // Apply positions from layout
        layout.nodes.forEach(nodeLayout => {
            const node = nodeLayout.node;
            const nodeElement = document.createElement('div');
            nodeElement.className = 'mindmap-preview-node';
            nodeElement.dataset.nodeId = node._id;

            // Use calculated layout positions
            nodeElement.style.left = nodeLayout.x + 'px';
            nodeElement.style.top = nodeLayout.y + 'px';

            // Mark central node
            if (nodeLayout.isCenter) {
                nodeElement.classList.add('central-node');
            }

            // Set credibility class
            const credibilityClass = this.getCredibilityClass(node.credibility.score);
            nodeElement.classList.add(credibilityClass);

            // Set content
            nodeElement.innerHTML = `
                <div class="node-content">
                    <h4>${node.title}</h4>
                </div>
            `;

            // Add event listeners
            nodeElement.addEventListener('mouseenter', (e) => this.showTooltip(e, node));
            nodeElement.addEventListener('mouseleave', () => this.hideTooltip());
            nodeElement.addEventListener('click', () => this.selectNode(node));

            this.nodesContainer.appendChild(nodeElement);
        });

        // Store layout for connection rendering
        this.layout = layout;

        // Center the canvas initially
        this.centerCanvas();
    }

    calculateCompactLayout() {
        // Constants for preview layout
        const nodeWidth = 140;
        const nodeHeight = 70;

        // Get container dimensions - fallback to computed style if needed
        const containerRect = this.container.getBoundingClientRect();
        let viewWidth = containerRect.width;
        let viewHeight = containerRect.height;

        // If container has no dimensions yet, use the parent or defaults
        if (!viewWidth || viewWidth < 100) {
            const computedStyle = window.getComputedStyle(this.container);
            viewWidth = parseInt(computedStyle.width) || 600;
        }
        if (!viewHeight || viewHeight < 100) {
            const computedStyle = window.getComputedStyle(this.container);
            viewHeight = parseInt(computedStyle.height) || 500;
        }

        // Calculate node degrees (connection count)
        const nodeDegrees = new Map();
        this.data.nodes.forEach(node => {
            const connections = this.data.edges.filter(
                edge => edge.sourceNode === node._id || edge.targetNode === node._id
            );
            nodeDegrees.set(node._id, connections.length);
        });

        // Find central node (most connected, or first if tie)
        let centralNode = this.data.nodes[0];
        let maxDegree = -1;
        this.data.nodes.forEach(node => {
            const degree = nodeDegrees.get(node._id);
            if (degree > maxDegree) {
                maxDegree = degree;
                centralNode = node;
            }
        });

        // Position central node at center of view
        const centerX = viewWidth / 2 - nodeWidth / 2;
        const centerY = viewHeight / 2 - nodeHeight / 2;

        const positions = [];

        // Add central node
        positions.push({
            node: centralNode,
            x: centerX,
            y: centerY,
            isCenter: true
        });

        // Position other nodes in a compact circle around center
        const otherNodes = this.data.nodes.filter(n => n._id !== centralNode._id);
        const radius = 150; // Compact radius for "at a glance" view
        const angleStep = (Math.PI * 2) / Math.max(otherNodes.length, 1);

        otherNodes.forEach((node, index) => {
            const angle = angleStep * index;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            positions.push({
                node: node,
                x: x,
                y: y,
                isCenter: false
            });
        });

        return {
            nodes: positions,
            centerX: centerX + nodeWidth / 2,
            centerY: centerY + nodeHeight / 2,
            width: viewWidth,
            height: viewHeight
        };
    }

    centerCanvas() {
        if (!this.layout) return;

        // Layout is already centered to viewport, just set container sizes
        this.nodesContainer.style.width = this.layout.width + 'px';
        this.nodesContainer.style.height = this.layout.height + 'px';

        // Initialize pan state (nodes already positioned optimally)
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;

        this.nodesContainer.style.transform = 'translate(0px, 0px)';
        this.connectionsContainer.style.transform = 'translate(0px, 0px)';
    }
    
    renderConnections() {
        if (!this.data || !this.data.edges || !this.layout) return;

        // Clear existing connections
        this.connectionsContainer.innerHTML = '';

        // Set SVG dimensions to match the layout
        const { width, height } = this.layout;

        this.connectionsContainer.setAttribute('width', width);
        this.connectionsContainer.setAttribute('height', height);
        this.connectionsContainer.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.connectionsContainer.style.width = width + 'px';
        this.connectionsContainer.style.height = height + 'px';

        // Create a map of node positions from layout
        const nodePositions = new Map();
        this.layout.nodes.forEach(nodeLayout => {
            nodePositions.set(nodeLayout.node._id, {
                x: nodeLayout.x + 70, // Center of node (width/2)
                y: nodeLayout.y + 35  // Center of node (height/2)
            });
        });

        this.data.edges.forEach(edge => {
            const sourcePos = nodePositions.get(edge.sourceNode);
            const targetPos = nodePositions.get(edge.targetNode);

            if (sourcePos && targetPos) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

                line.setAttribute('x1', sourcePos.x);
                line.setAttribute('y1', sourcePos.y);
                line.setAttribute('x2', targetPos.x);
                line.setAttribute('y2', targetPos.y);
                line.setAttribute('stroke', 'rgba(233, 69, 96, 0.6)');
                line.setAttribute('stroke-width', '2');
                line.classList.add('mindmap-connection');

                this.connectionsContainer.appendChild(line);

                // Add relationship label (only if label exists and is meaningful)
                if (edge.relationshipLabel && edge.relationshipLabel.trim()) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    const midX = (sourcePos.x + targetPos.x) / 2;
                    const midY = (sourcePos.y + targetPos.y) / 2;
                    text.setAttribute('x', midX);
                    text.setAttribute('y', midY - 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', '#f1f1f1');
                    text.setAttribute('font-size', '12px');
                    text.setAttribute('font-weight', '500');
                    text.textContent = edge.relationshipLabel;
                    text.classList.add('mindmap-label');

                    this.connectionsContainer.appendChild(text);
                }
            }
        });
    }
    
    renderStats() {
        if (!this.data || !this.data.stats) return;
        
        this.statsContainer.innerHTML = `
            <div class="stats-item">
                <i class="fas fa-circle"></i>
                <span>${this.data.stats.totalNodes} nodes</span>
            </div>
            <div class="stats-item">
                <i class="fas fa-link"></i>
                <span>${this.data.stats.totalConnections} connections</span>
            </div>
            <div class="stats-activity">
                <i class="fas fa-clock"></i>
                <span>${this.data.stats.recentActivity}</span>
            </div>
        `;
    }
    
    getCredibilityClass(score) {
        if (score >= 70) return 'high-credibility';
        if (score >= 40) return 'medium-credibility';
        return 'low-credibility';
    }
    
    showTooltip(event, node) {
        this.tooltip.querySelector('.tooltip-title').textContent = node.title;
        this.tooltip.querySelector('.tooltip-score').textContent = `Score: ${node.credibility.score}`;
        this.tooltip.querySelector('.tooltip-content').textContent = node.content.substring(0, 100) + '...';
        this.tooltip.querySelector('.tooltip-creator').textContent = `By ${node.creator.username}`;
        
        const connections = this.data.edges.filter(e => e.sourceNode === node._id || e.targetNode === node._id);
        this.tooltip.querySelector('.tooltip-connections').textContent = `${connections.length} connections`;
        
        // Position tooltip
        const rect = this.container.getBoundingClientRect();
        this.tooltip.style.left = (event.pageX - rect.left + 10) + 'px';
        this.tooltip.style.top = (event.pageY - rect.top - 10) + 'px';
        this.tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
    
    selectNode(node) {
        this.selectedNode = node;
        
        // Update explore button
        const exploreBtn = document.getElementById('exploreNodeBtn');
        exploreBtn.onclick = () => {
            // Redirect to full mindmap with this node selected
            window.location.href = `/pages/mindmap.html?node=${node._id}`;
        };
        
        // Highlight selected node
        this.highlightNode(node._id);
    }
    
    highlightNode(nodeId) {
        // Remove previous highlights
        const nodes = this.nodesContainer.querySelectorAll('.mindmap-preview-node');
        nodes.forEach(n => n.classList.remove('selected'));
        
        // Add highlight to selected node
        const selectedNode = this.nodesContainer.querySelector(`[data-node-id="${nodeId}"]`);
        if (selectedNode) {
            selectedNode.classList.add('selected');
        }
    }
    
    setupEventHandlers() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Hide tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.tooltip.contains(e.target) && !this.nodesContainer.contains(e.target)) {
                this.hideTooltip();
            }
        });

        // Pan/drag functionality for desktop
        this.container.addEventListener('mousedown', (e) => {
            // Don't pan if clicking on a node or search input
            if (e.target.closest('.mindmap-preview-node') || e.target.closest('.mindmap-search-container')) {
                return;
            }
            this.startPan(e.clientX, e.clientY);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.pan(e.clientX, e.clientY);
                e.preventDefault();
            }
        });

        document.addEventListener('mouseup', () => {
            this.endPan();
        });

        // Touch support for mobile
        this.container.addEventListener('touchstart', (e) => {
            // Don't pan if touching a node or search input
            if (e.target.closest('.mindmap-preview-node') || e.target.closest('.mindmap-search-container')) {
                return;
            }
            if (e.touches.length === 1) {
                this.startPan(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        });

        this.container.addEventListener('touchmove', (e) => {
            if (this.isPanning && e.touches.length === 1) {
                this.pan(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        });

        this.container.addEventListener('touchend', () => {
            this.endPan();
        });
    }

    startPan(x, y) {
        this.isPanning = true;
        this.startPanX = x;
        this.startPanY = y;
        this.container.style.cursor = 'grabbing';
        // Add visual feedback
        this.container.classList.add('panning');
    }

    pan(x, y) {
        if (!this.isPanning) return;

        const deltaX = x - this.startPanX;
        const deltaY = y - this.startPanY;

        this.currentTranslateX = this.panOffsetX + deltaX;
        this.currentTranslateY = this.panOffsetY + deltaY;

        // Apply transform to both nodes and connections
        this.nodesContainer.style.transform = `translate(${this.currentTranslateX}px, ${this.currentTranslateY}px)`;
        this.connectionsContainer.style.transform = `translate(${this.currentTranslateX}px, ${this.currentTranslateY}px)`;
    }

    endPan() {
        if (!this.isPanning) return;

        this.isPanning = false;
        this.panOffsetX = this.currentTranslateX;
        this.panOffsetY = this.currentTranslateY;
        this.container.style.cursor = 'grab';
        this.container.classList.remove('panning');
    }
    
    handleSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;
        
        // For preview, just redirect to full mindmap with search
        window.location.href = `/pages/mindmap.html?search=${encodeURIComponent(query)}`;
    }
    
    showEmptyState() {
        this.container.innerHTML = `
            <div class="mindmap-empty">
                <i class="fas fa-project-diagram"></i>
                <h3>The Infinite Nexus Awaits</h3>
                <p>No nodes have been created yet. Be the first to contribute to the eternal knowledge web.</p>
                <a href="/pages/mindmap.html" class="btn btn-primary">Create First Node</a>
            </div>
        `;
    }
    
    showError(message) {
        this.container.innerHTML = `
            <div class="mindmap-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page with the mindmap preview
    if (document.getElementById('mindmapPreview')) {
        window.mindmapPreview = new MindmapPreview();
    }
});