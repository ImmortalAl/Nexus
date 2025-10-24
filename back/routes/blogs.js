const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Test endpoint to verify router mounting
router.get('/test', (req, res) => res.json({ message: 'Blogs router is working' }));

// Create a new blog post
router.post('/', auth, async (req, res) => {
    const { title, content, status } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const blog = new Blog({
            title,
            content,
            author: req.user.id,
            status: status || 'published'
        });
        await blog.save();
        const populatedBlog = await Blog.findById(blog._id).populate('author', 'username displayName avatar online');
        res.status(201).json(populatedBlog);
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

// Get all blog posts with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query filter - only show published posts for public view
        const filter = { status: 'published' };

        // Handle author filtering
        if (req.query.author) {
            const mongoose = require('mongoose');

            if (mongoose.Types.ObjectId.isValid(req.query.author)) {
                filter.author = req.query.author;
            } else {
                const user = await User.findOne({ username: req.query.author });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                filter.author = user._id;
            }
        }

        // Handle search query
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { title: searchRegex },
                { content: searchRegex }
            ];
        }

        // Handle date range filtering
        if (req.query.createdAfter) {
            filter.createdAt = { $gte: new Date(req.query.createdAfter) };
        }

        // Parse sort parameter (format: "field:direction")
        let sortOption = { createdAt: -1 }; // default sort
        let sortByComments = false;

        if (req.query.sort) {
            const [sortField, sortDirection] = req.query.sort.split(':');
            const direction = sortDirection === 'asc' ? 1 : -1;

            if (sortField === 'commentsCount') {
                // We'll handle comment count sorting after fetching
                sortByComments = true;
                sortOption = null; // Don't sort in the query
            } else if (sortField === 'likes') {
                // Sort by number of likes (array length)
                sortOption = { likes: direction };
            } else if (sortField === 'author.username') {
                sortOption = { 'author.username': direction };
            } else if (sortField === 'title') {
                sortOption = { title: direction };
            } else {
                sortOption = { [sortField]: direction };
            }
        }

        const totalBlogs = await Blog.countDocuments(filter);
        const totalPages = Math.ceil(totalBlogs / limit);

        // Build query
        let query = Blog.find(filter).populate('author', 'username displayName avatar online');

        // Apply sort if not sorting by comments
        if (sortOption) {
            query = query.sort(sortOption);
        }

        // Don't apply pagination yet if sorting by comments
        if (!sortByComments) {
            query = query.skip(skip).limit(limit);
        }

        let blogs = await query;

        // Add comment counts to each blog
        const Comment = require('../models/Comment');
        let blogsWithCommentCounts = await Promise.all(blogs.map(async (blog) => {
            const commentsCount = await Comment.countDocuments({
                targetType: 'blog',
                targetId: blog._id.toString()
            });

            const blogObj = blog.toObject();
            blogObj.commentsCount = commentsCount;
            return blogObj;
        }));

        // If sorting by comments, do it now and then paginate
        if (sortByComments) {
            const [, sortDirection] = req.query.sort.split(':');
            const direction = sortDirection === 'asc' ? 1 : -1;

            blogsWithCommentCounts.sort((a, b) => {
                return direction * (a.commentsCount - b.commentsCount);
            });

            // Apply pagination manually
            blogsWithCommentCounts = blogsWithCommentCounts.slice(skip, skip + limit);
        }

        // Return paginated response
        res.json({
            docs: blogsWithCommentCounts,
            totalDocs: totalBlogs,
            totalPages: totalPages,
            page: page,
            limit: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});

// Get a single blog post by ID
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'username displayName avatar online');
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        
        res.json(blog);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Invalid blog post ID' });
        }
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

// Get user's blog posts
router.get('/my', auth, async (req, res) => {
    try {
        const filter = { author: req.user.id };
        
        // Allow filtering by status (published, draft, or all)
        if (req.query.status && req.query.status !== 'all') {
            filter.status = req.query.status;
        }
        
        const blogs = await Blog.find(filter)
            .populate('author', 'username displayName avatar online')
            .sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching user blogs:', error);
        res.status(500).json({ error: 'Failed to fetch your blog posts' });
    }
});

// Get user's drafts specifically
router.get('/my/drafts', auth, async (req, res) => {
    try {
        const drafts = await Blog.find({ 
            author: req.user.id, 
            status: 'draft' 
        })
            .populate('author', 'username displayName avatar')
            .sort({ updatedAt: -1 });
        res.json(drafts);
    } catch (error) {
        console.error('Error fetching user drafts:', error);
        res.status(500).json({ error: 'Failed to fetch your drafts' });
    }
});

// Get user's blog posts by username
router.get('/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const blogs = await Blog.find({ 
            author: user._id,
            status: 'published' // Only show published posts on public profiles
        })
            .populate('author', 'username displayName avatar online')
            .sort({ createdAt: -1 });
            
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching user blogs by username:', error);
        res.status(500).json({ error: 'Failed to fetch user blog posts' });
    }
});

// Update a blog post (for editing drafts or publishing)
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, status } = req.body;
        
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        
        // Check if user owns this blog post
        if (blog.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to edit this post' });
        }
        
        // Update fields
        if (title) blog.title = title;
        if (content) blog.content = content;
        if (status) blog.status = status;
        
        await blog.save();
        
        const updatedBlog = await Blog.findById(blog._id)
            .populate('author', 'username displayName avatar');
        
        res.json(updatedBlog);
    } catch (error) {
        console.error('Error updating blog post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Invalid blog post ID' });
        }
        res.status(500).json({ error: 'Failed to update blog post' });
    }
});

// Delete a blog post
router.delete('/:id', auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        
        // Check if user owns this blog post
        if (blog.author.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }
        
        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Invalid blog post ID' });
        }
        res.status(500).json({ error: 'Failed to delete blog post' });
    }
});

// Like a blog post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author');
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const userId = req.user.id;

        // Prevent self-voting
        if (blog.author._id.toString() === userId) {
            return res.status(400).json({ error: 'You cannot vote on your own blog post' });
        }

        // Remove from dislikes if present
        const wasDisliked = blog.dislikes.some(id => id.toString() === userId);
        blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId);

        // Toggle like
        const likeIndex = blog.likes.findIndex(id => id.toString() === userId);
        if (likeIndex > -1) {
            // Already liked, remove like
            blog.likes.splice(likeIndex, 1);
        } else {
            // Not liked, add like
            blog.likes.push(userId);
        }

        await blog.save();

        // Update user credibility if service available
        if (req.app.locals.CredibilityService) {
            const authorId = blog.author._id.toString();

            // If removing like
            if (likeIndex > -1) {
                await req.app.locals.CredibilityService.updateUserCredibility(
                    authorId, 'blog', 'upvote', -1
                );
            }
            // If adding like
            else {
                await req.app.locals.CredibilityService.updateUserCredibility(
                    authorId, 'blog', 'upvote', 1
                );
                // If was disliked, also remove the downvote
                if (wasDisliked) {
                    await req.app.locals.CredibilityService.updateUserCredibility(
                        authorId, 'blog', 'downvote', -1
                    );
                }
            }
        }
        
        res.json({
            likes: blog.likes.length,
            dislikes: blog.dislikes.length,
            userLiked: blog.likes.some(id => id.toString() === userId),
            userDisliked: blog.dislikes.some(id => id.toString() === userId)
        });
    } catch (error) {
        console.error('Error liking blog post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Invalid blog post ID' });
        }
        res.status(500).json({ error: 'Failed to like blog post' });
    }
});

// Dislike a blog post (supports 3-tier challenge system)
router.post('/:id/dislike', auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author');
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const userId = req.user.id;
        const { challengeType = 'quick' } = req.body; // Support 3-tier: quick, counterpoint, debate

        // Prevent self-voting
        if (blog.author._id.toString() === userId) {
            return res.status(400).json({ error: 'You cannot challenge your own blog post' });
        }

        // Remove from likes if present
        const wasLiked = blog.likes.some(id => id.toString() === userId);
        blog.likes = blog.likes.filter(id => id.toString() !== userId);

        // Toggle dislike
        const dislikeIndex = blog.dislikes.findIndex(id => id.toString() === userId);
        if (dislikeIndex > -1) {
            // Already disliked, remove dislike
            blog.dislikes.splice(dislikeIndex, 1);
        } else {
            // Not disliked, add dislike
            blog.dislikes.push(userId);

            // TODO: Handle counterpoint and debate challenge types
            if (challengeType === 'counterpoint') {
                // Future: Create a counterpoint comment/thread
            } else if (challengeType === 'debate') {
                // Future: Create a formal debate thread
            }
        }

        await blog.save();

        // Update user credibility if service available
        if (req.app.locals.CredibilityService) {
            const authorId = blog.author._id.toString();

            // If removing dislike
            if (dislikeIndex > -1) {
                await req.app.locals.CredibilityService.updateUserCredibility(
                    authorId, 'blog', 'downvote', -1
                );
            }
            // If adding dislike
            else {
                await req.app.locals.CredibilityService.updateUserCredibility(
                    authorId, 'blog', 'downvote', 1
                );
                // If was liked, also remove the upvote
                if (wasLiked) {
                    await req.app.locals.CredibilityService.updateUserCredibility(
                        authorId, 'blog', 'upvote', -1
                    );
                }
            }
        }
        
        res.json({
            likes: blog.likes.length,
            dislikes: blog.dislikes.length,
            userLiked: blog.likes.some(id => id.toString() === userId),
            userDisliked: blog.dislikes.some(id => id.toString() === userId)
        });
    } catch (error) {
        console.error('Error disliking blog post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Invalid blog post ID' });
        }
        res.status(500).json({ error: 'Failed to dislike blog post' });
    }
});

module.exports = router;