/**
 * Blog API Module - Handles all API interactions for blog functionality
 * Part of the Immortal Nexus Blog System
 *
 * This module manages:
 * - Blog post fetching (list and individual)
 * - CRUD operations (Create, Read, Update, Delete)
 * - Voting/liking operations
 * - Counterpoint submissions
 * - Debate creation
 */

// API base URL configuration
const BLOG_API_BASE_URL = window.NEXUS_CONFIG?.API_BASE_URL || 'https://nexus-ytrg.onrender.com/api';

// Embedded jwt-decode function
function jwt_decode(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        throw new Error('Invalid JWT token');
    }
}

/**
 * BlogAPI - Centralized API handler for blog operations
 */
class BlogAPI {
    constructor() {
        this.baseUrl = BLOG_API_BASE_URL;
        this.cache = new Map(); // Simple cache for fetched posts
    }

    /**
     * Check if authentication token is valid
     */
    isTokenValid(token) {
        if (!token) return false;
        try {
            const decoded = jwt_decode(token);
            const now = Math.floor(Date.now() / 1000);
            return decoded.exp > now && decoded.id;
        } catch (error) {
            console.error('Token decode error:', error.message);
            return false;
        }
    }

    /**
     * Get current user info from token
     */
    getCurrentUser() {
        const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
        if (!this.isTokenValid(token)) return null;

        try {
            return jwt_decode(token);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Fetch paginated blog posts
     */
    async fetchPosts(page = 1, limit = 10) {
        const url = `${this.baseUrl}/blogs?page=${page}&limit=${limit}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch blog posts`);
            }

            const result = await response.json();

            // Cache individual posts
            const posts = result.docs || result;
            posts.forEach(post => {
                if (post._id) {
                    this.cache.set(post._id, post);
                }
            });

            return result;
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            throw error;
        }
    }

    /**
     * Fetch a single blog post by ID
     */
    async fetchPost(postId) {
        // Check cache first
        if (this.cache.has(postId)) {
            const cached = this.cache.get(postId);
            // If we have full content, return it
            if (cached.content && !cached.excerpt) {
                return cached;
            }
        }

        const url = `${this.baseUrl}/blogs/${postId}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[BlogAPI] Request failed:`, {
                    status: response.status,
                    url: url,
                    error: errorText
                });
                throw new Error(`Failed to fetch blog post: ${response.status} - ${errorText}`);
            }

            const post = await response.json();

            // Update cache
            this.cache.set(post._id, post);

            return post;
        } catch (error) {
            console.error('[BlogAPI] Error fetching post:', error);
            throw error;
        }
    }

    /**
     * Fetch posts by a specific author
     */
    async fetchAuthorPosts(authorId, limit = 5, excludePostId = null) {
        const url = `${this.baseUrl}/blogs?author=${authorId}&limit=${limit}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch author posts');
            }

            const result = await response.json();
            let posts = result.docs || result;

            // Filter out excluded post if specified
            if (excludePostId) {
                posts = posts.filter(post => post._id !== excludePostId);
            }

            return posts;
        } catch (error) {
            console.error('Error fetching author posts:', error);
            throw error;
        }
    }

    /**
     * Create a new blog post
     */
    async createPost(title, content) {
        const token = localStorage.getItem('sessionToken');

        if (!this.isTokenValid(token)) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/blogs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, content })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to create post`);
            }

            const newPost = await response.json();

            // Add to cache
            this.cache.set(newPost._id, newPost);

            return newPost;
        } catch (error) {
            console.error('Error creating blog post:', error);
            throw error;
        }
    }

    /**
     * Update an existing blog post
     */
    async updatePost(postId, title, content) {
        const token = localStorage.getItem('sessionToken');

        if (!this.isTokenValid(token)) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/blogs/${postId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, content })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to update post`);
            }

            const updatedPost = await response.json();

            // Update cache
            this.cache.set(postId, updatedPost);

            return updatedPost;
        } catch (error) {
            console.error('Error updating blog post:', error);
            throw error;
        }
    }

    /**
     * Delete a blog post
     */
    async deletePost(postId) {
        const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');

        if (!this.isTokenValid(token)) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/blogs/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to delete post: ${response.status}`);
            }

            // Remove from cache
            this.cache.delete(postId);

            return true;
        } catch (error) {
            console.error('Error deleting blog post:', error);
            throw error;
        }
    }

    /**
     * Like a blog post
     */
    async likePost(postId) {
        const token = localStorage.getItem('sessionToken');

        if (!this.isTokenValid(token)) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/blogs/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to like post');
            }

            const result = await response.json();

            // Update cached post if exists
            if (this.cache.has(postId)) {
                const post = this.cache.get(postId);
                post.likes = result.likes;
                post.dislikes = result.dislikes;
            }

            return result;
        } catch (error) {
            console.error('Error liking post:', error);
            throw error;
        }
    }

    /**
     * Dislike/downvote a blog post
     */
    async dislikePost(postId) {
        const token = localStorage.getItem('sessionToken');

        if (!this.isTokenValid(token)) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/blogs/${postId}/dislike`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to dislike post');
            }

            const result = await response.json();

            // Update cached post if exists
            if (this.cache.has(postId)) {
                const post = this.cache.get(postId);
                post.likes = result.likes;
                post.dislikes = result.dislikes;
            }

            return result;
        } catch (error) {
            console.error('Error disliking post:', error);
            throw error;
        }
    }

    /**
     * Submit a counterpoint comment
     */
    async submitCounterpoint(postId, counterpointText, sources = '') {
        const token = localStorage.getItem('sessionToken');

        if (!this.isTokenValid(token)) {
            throw new Error('Authentication required');
        }

        // Format comment with counterpoint prefix and sources
        let commentContent = `🗡️ **Counterpoint:**\n\n${counterpointText}`;

        if (sources) {
            const sourcesList = sources.split('\n').filter(s => s.trim());
            if (sourcesList.length > 0) {
                commentContent += '\n\n**Sources:**';
                sourcesList.forEach(source => {
                    commentContent += `\n• ${source.trim()}`;
                });
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: commentContent,
                    targetType: 'blog',
                    targetId: postId,
                    isCounterpoint: true
                })
            });

            if (!response.ok) {
                let errorMessage = 'Failed to submit counterpoint';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Error submitting counterpoint:', error);
            throw error;
        }
    }

    /**
     * Create a formal debate from a blog post
     */
    async createDebate(postId, postTitle, authorId) {
        const token = localStorage.getItem('sessionToken');

        if (!this.isTokenValid(token)) {
            throw new Error('Authentication required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/debates/from-scroll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceScrollId: postId,
                    scrollTitle: postTitle,
                    originalAuthorId: authorId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create debate');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating debate:', error);
            throw error;
        }
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cached post if available
     */
    getCachedPost(postId) {
        return this.cache.get(postId);
    }
}

// Create and export singleton instance
const blogAPI = new BlogAPI();

// Export for use in other modules
window.BlogAPI = blogAPI;

// Also export class for testing or multiple instances
window.BlogAPIClass = BlogAPI;