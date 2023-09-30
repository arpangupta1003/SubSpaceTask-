const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();

// Create an empty cache object
const cache = {};

// Define a function to fetch and analyze blog data
const fetchAndAnalyzeBlogData = async () => {
  try {
    // Check if data is already cached
    if (cache.blogStats) {
      return cache.blogStats;
    }

    // Define the curl request as an Axios GET request
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    // Extract the blog data from the response
    const blogData = response.data;

    // Calculate the total number of blogs
    const totalBlogs = blogData.blogs.length;

    // Find the blog with the longest title
    const blogWithLongestTitle =_.maxBy(blogData.blogs, (blog) => blog.title.length);

    // Determine the number of blogs with titles containing the word "privacy"
    const blogsWithPrivacyInTitle = _.filter(blogData.blogs, (blog) =>
      _.includes(blog.title.toLowerCase(), 'privacy')
    );

    // Create an array of unique blog titles (no duplicates)
    const uniqueBlogTitles = _.uniqBy(blogData.blogs, 'title');

    // Prepare the analytics data
    const analyticsData = {
      totalBlogs,
      longestBlogTitle:blogWithLongestTitle.title,
      numberOfBlogsWithPrivacyInTitle: blogsWithPrivacyInTitle.length,
      uniqueBlogTitles,
    };

    // Store the data in the cache
    cache.blogStats = analyticsData;

    return analyticsData;
  } catch (error) {
    throw error;
  }
};

// Define a memoized function for fetching and analyzing blog data
const memoizedFetchAndAnalyzeBlogData = _.memoize(fetchAndAnalyzeBlogData);

// Define a route for /api/blog-stats using the memoized function
app.get('/api/blog-stats', async (req, res) => {
  try {
    const analyticsData = await memoizedFetchAndAnalyzeBlogData();
    res.json(analyticsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching or analyzing blog data' });
  }
});

// Define a function to perform a blog search
const searchBlog = async (query) => {
  try {
    if (!query) {
      throw new Error('Please provide a valid search query');
    }

    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    const blogData = response.data;

    // Implement search functionality
    const searchResults = blogData.blogs.filter((blog) => {
      if (blog.title) {
        return blog.title.toLowerCase().includes(query.toLowerCase());
      } else {
        return false;
      }
    });

    return searchResults;
  } catch (error) {
    throw error;
  }
};

// Define a memoized function for blog search
const memoizedBlogSearch = _.memoize(searchBlog);

// Define a route for /api/blog-search using the memoized function
app.get('/api/blog-search', async (req, res) => {
  try {
    const query = req.query.query;
    const searchResults = await memoizedBlogSearch(query);
    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching for blog data' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
