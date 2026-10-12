# Rating & Comment System - Presentation Script

## Overview
Our application implements a two-tier user engagement system that allows users to:
1. **Rate recipes** (1-5 stars) with update and delete capabilities
2. **Comment on recipes** with full CRUD functionality

This demonstrates key backend concepts: data modeling, state management, user authorization, and aggregation calculations.

---

## Part 1: Rating System

### Overview & Purpose
The rating system allows authenticated users to:
- Submit ratings (1-5 stars) for recipes
- Update existing ratings
- Delete ratings
- View real-time rating averages and counts

### Key Architecture Decision: User-Based Rating Document

**Problem**: We needed to track individual ratings while calculating recipe-level aggregates efficiently.

**Solution**: Store ratings in a user-centric document structure:

```javascript
// From ratings-controller.js - ratings document structure
{
    userId: "user123",
    userName: "john_doe",
    ratings: [
        {
            recipeId: "recipe456",
            ratingValue: 4,
            isEdited: false
        },
        {
            recipeId: "recipe789",
            ratingValue: 5,
            isEdited: false
        }
    ]
}
```

**Why this matters for teachers**:
- Demonstrates understanding of **document design patterns**
- Shows efficiency: finding user's ratings requires ONE query instead of many
- Maintains audit trail with `isEdited` flag
- Scalable for users with many ratings

---

### Critical Function: Smart Create or Update Logic

**Location**: `ratings-controller.js` - `createRating` function

```javascript
// HIGHLIGHT THIS SECTION
try {
    // Check if user already has a ratings document
    const userRatingsDoc = await Rating.findUserRatingsDoc(userId);

    if (userRatingsDoc) {
        // User already has ratings document, check if they rated this specific recipe
        const existingRecipeRating = userRatingsDoc.ratings.find(r => String(r.recipeId) === recipeId);
        
        if (existingRecipeRating) {
            // UPDATE existing rating for this recipe
            await Rating.updateRatingList(userId, recipeId, ratingValue);
        } else {
            // ADD new recipe rating to their existing ratings array
            await Rating.addRatingToUser(userId, recipeId, ratingValue);
        }
    } else {
        // CREATE new rating document for this user
        const newRatingData = {
            userId: userId,
            userName: userName,
            ratings: [{
                recipeId: recipeId,
                ratingValue: ratingValue,
                isEdited: false }]
        };
        await Rating.createRating(newRatingData);
    }
```

**What makes this important**:
- **Idempotent operations**: Supports creation AND updates from the same endpoint
- **Nested array management**: Demonstrates working with MongoDB arrays
- **Type safety**: Uses `String()` conversion to avoid ObjectId comparison issues
- **Efficiency**: Merges multiple operations into one endpoint

---

### Core Feature: Automatic Aggregate Calculation

**Location**: `ratings-controller.js` - `recalculateRecipeRatings` function

```javascript
// HIGHLIGHT THIS FUNCTION
async function recalculateRecipeRatings(recipeId) {
    try {
        const allRatings = await Rating.retrieveByRecipeId(recipeId);
        
        let totalScore = 0;
        let count = 0;

        // Iterate through all users' rating documents
        for (let userRatingDoc of allRatings) {
           const specificRating = userRatingDoc.ratings.find(r => String(r.recipeId) === recipeId);
           if (specificRating) {
               totalScore += specificRating.ratingValue;
               count++;
           }
        }

        const average = count === 0 ? 0 : totalScore / count;

        // Update recipe document with denormalized aggregates
        const recipeUpdateData = {
            ratingAverage: average,
            ratingCount: count,
            totalRatingScore: totalScore
        };

        await Recipe.updateRecipe(recipeId, recipeUpdateData);
    } catch (error) {
        console.error("Error recalculating ratings:", error);
    }
}
```

**Technical Merit**:
- **Denormalization pattern**: Stores calculated values in Recipe document for fast reads
- **Trade-off understanding**: Slower writes but much faster reads (client-facing views)
- **Consistency handling**: Always recalculates after create/update/delete
- **Error resilience**: Runs in background, won't crash if one calculation fails

---

### Frontend Integration: Display & User Settings

**Location**: `recipe.ejs` - Rating display and form

```html
<!-- HIGHLIGHT: Display average rating with fallback -->
<span class="rating-average">
    <%= (typeof ratingAverage === 'number' ? ratingAverage.toFixed(1) : 'New!') %> / 5
</span>
<span class="rating-count-bold">
    (<%= ratingCount || 0 %>)
</span>

<!-- HIGHLIGHT: Dropdown for rating submission -->
<form action="/recipe/<%= recipe._id %>/rate" method="POST" class="rating-form-inline">
    <select name="rating" class="rating-select-small">
        <option value="1" <%= userRating == 1 ? 'selected' : '' %>>1 ⭐</option>
        <option value="2" <%= userRating == 2 ? 'selected' : '' %>>2 ⭐</option>
        <option value="3" <%= userRating == 3 ? 'selected' : '' %>>3 ⭐</option>
        <option value="4" <%= userRating == 4 ? 'selected' : '' %>>4 ⭐</option>
        <option value="5" <%= userRating == 5 ? 'selected' : '' %>>5 ⭐</option>
    </select>
    <button type="submit" class="btn-solid rating-btn-small">
        <%= userRating ? "Update" : "Rate" %>
    </button>
</form>

<!-- HIGHLIGHT: Display current user's rating -->
<% if (user && currentRecipeRating) { %>
    <div>
        <span>
            <% for (let i = 0; i < currentRecipeRating.ratingValue; i++) { %>⭐<% } %> 
            <%= currentRecipeRating.ratingValue %>/5
        </span>
        <div>
            Your rating on <%= currentRecipeRating.dateSaved.toLocaleDateString('en-UK', ...) %>
            <% if (currentRecipeRating.isEdited) { %>
                <span>(updated)</span>
            <% } %>
        </div>
    </div>
<% } %>
```

**Important UX considerations**:
- Pre-fills dropdown with user's current rating
- Shows "Update" or "Rate" dynamically
- Displays edit history with `isEdited` flag
- Graceful fallback for new recipes ("New!" instead of 0)

---

## Part 2: Comment System

### Overview & Purpose
The comment system implements:
- Create comments on recipes
- Edit own comments
- Delete own comments
- Track edit history
- Display all comments with usernames and timestamps

### Data Structure

```javascript
// From comment-model structure
{
    recipeId: "recipe123",
    recipeComments: [
        {
            _id: ObjectId(...),
            userId: "user456",
            username: "jane_doe",
            comment: "This was delicious!",
            createdAt: Date,
            isEdited: false
        }
    ]
}
```

**Design benefit**: All comments for a recipe stored in ONE document → single query to load all comments

---

### Critical Feature: Authorization Check

**Location**: `comment-controller.js` - `renderEditForm` and `editComment`

```javascript
// HIGHLIGHT THIS AUTHORIZATION PATTERN
const sessionUserId = String(req.session.user.id);

// Method 1: Check when rendering edit form
if (String(specificComment.userId) !== sessionUserId) {
     return res.render('error', { message: "Unauthorized to edit this comment." });
}

// Method 2: Double-check on form submission
if (String(commentDoc.recipeComments[commentIndex].userId) !== sessionUserId) {
    return res.render('error', { message: "Unauthorized to edit this comment." });
}
```

**Security lesson**:
- **Server-side validation is critical**: Never trust the client
- **Double-check pattern**: Verify authorization both when rendering form AND processing submission
- **String conversion**: Ensures ObjectId comparison works correctly
- Prevents users from directly editing another user's comments

---

### Error Resilience: Safe ID Matching

**Location**: `comment-controller.js` - `renderEditForm` function

```javascript
// HIGHLIGHT THIS DEBUGGING APPROACH
const specificComment = commentDoc.recipeComments.find(
    c => c._id && c._id.toString() === commentId
);

// If it fails, this prints the exact reason to help debugging
if (!specificComment) {
    commentDoc.recipeComments.forEach(c => console.log(" -> ", c._id.toString()));
    return res.render('error', { message: "Comment not found." });
}
```

**What's noteworthy**:
- Uses `.toString()` on ObjectId (safer than implicit conversion)
- Null-check `c._id &&` prevents crashes
- Debug logging helps identify ID matching issues
- Shows production-ready error handling

---

### Complete Edit Flow: Immutability Pattern

**Location**: `comment-controller.js` - `editComment` function

```javascript
// HIGHLIGHT THIS IMMUTABLE UPDATE PATTERN
exports.editComment = async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const commentId = String(req.params.commentId);
    const updatedText = (req.body.comment ?? "").trim();
    const sessionUserId = String(req.session.user.id);

    // 1. INPUT VALIDATION
    if (!updatedText) return res.render('error', { message: "Comment cannot be empty." });

    try {
        // 2. FETCH CURRENT STATE
        const commentDoc = await Comment.retrieveByRecipeId(recipeId);
        if (!commentDoc) return res.render('error', { message: "Recipe comments not found." });

        // 3. FIND SPECIFIC COMMENT
        const commentIndex = commentDoc.recipeComments.findIndex(
            c => String(c._id) === String(commentId)
        );
        
        // 4. VALIDATE EXISTENCE & AUTHORIZATION
        if (commentIndex === -1) return res.render('error', { message: "Comment not found." });
        if (String(commentDoc.recipeComments[commentIndex].userId) !== sessionUserId) {
            return res.render('error', { message: "Unauthorized to edit this comment." });
        }

        // 5. UPDATE STATE
        commentDoc.recipeComments[commentIndex].comment = updatedText;
        commentDoc.recipeComments[commentIndex].isEdited = true;

        // 6. PERSIST UPDATED STATE
        await Comment.updateCommentArray(recipeId, commentDoc.recipeComments);

        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error("Error updating comment:", err);
        return res.render('error', { message: "Could not update the comment." });
    }
};
```

**This demonstrates professional patterns**:
1. **Explicit validation steps**: Each step has clear purpose
2. **Early returns**: Prevents nested if-clauses
3. **Audit trail**: Sets `isEdited` flag for transparency
4. **Error messages**: Human-readable feedback
5. **Logging**: Stack traces for debugging

---

### Frontend Integration: Comment Form & Display

**Location**: `recipe.ejs` - Comment submission and display

```html
<!-- HIGHLIGHT: Comment form only for authenticated users -->
<% if (user) { %>
    <form action="/recipe/<%= recipe._id %>/comment" method="POST" class="recipe-comment-form">
        <div class="comment-user-display">
            Posting as <strong><%= user.userName %></strong>
        </div>

        <textarea 
            name="comment" 
            class="recipe-comment-textarea" 
            placeholder="Write a comment about this recipe..." 
            required></textarea>

        <button type="submit" class="btn-solid recipe-comment-submit-btn">
            Post Comment
        </button>
    </form>
<% } else { %>
    <!-- HIGHLIGHT: Unauthenticated user prompt -->
    <div class="comment-login-box">
        <p class="comment-login-text">
            You must be logged in to post a comment.
        </p>
        <div class="comment-login-actions">
            <a href="/login" class="btn-solid comment-login-btn">Log In</a>
            <a href="/register" class="btn-solid comment-signup-btn">Sign Up</a>
        </div>
    </div>
<% } %>

<!-- HIGHLIGHT: Display individual comments with edit tracking -->
<% comments.forEach(c => { %>
    <div class="recipe-comment-item">
        <div class="recipe-comment-header">
            <div class="recipe-comment-username"><%= c.username %></div>
            <div class="recipe-comment-meta">
                <%= c.createdAt.toLocaleDateString('en-UK', { day: 'numeric', month: 'short', year: 'numeric' }) %>
                <% if (c.isEdited) { %>
                    <div class="comment-edited-tag">(edited)</div>
                <% } %>
            </div>
        </div>
        <div class="recipe-comment-body"><%= c.comment %></div>
        
        <!-- HIGHLIGHT: Only show edit/delete for comment author -->
        <% if (user && user.id.toString() === c.userId.toString()) { %>
            <div class="recipe-comment-actions">
                <a href="/recipe/<%= recipe._id %>/comment/<%= c._id %>/edit" class="btn-comment-edit">
                    Edit
                </a>
                <form action="/recipe/<%= recipe._id %>/comment/<%= c._id %>/delete" method="POST" style="display: inline;">
                    <button type="submit" class="btn-comment-delete">
                        Delete
                    </button>
                </form>
            </div>
        <% } %>
    </div>
<% }); %>
```

**UX & Security highlights**:
- Conditional rendering for authenticated vs guest users
- Only show edit/delete for comment author
- Displays edit history transparently
- Clean separation of concerns (form, display, actions)

---

## Key Technical Concepts Worth Discussing

### 1. **Data Denormalization**
- Rating averages stored in Recipe document
- Trade-off: Slightly slower writes, much faster reads
- Why? Most views need to display ratings, few users rate

### 2. **Nested Array Management**
- MongoDB arrays within documents (ratings, comments)
- Requires careful use of `.find()`, `.findIndex()`, array spread operators
- More complex than SQL JOINs but better performance for this use case

### 3. **Idempotent Operations**
- Same POST request can create OR update
- Reduces client-side complexity
- Better UX (users don't need separate "update" buttons)

### 4. **Authorization Patterns**
- Server-side authorization checks (never trust client)
- Double validation (render form + process submission)
- Type-safe ID comparison with `.toString()`

### 5. **Audit Trails**
- `isEdited` flag shows when comments/ratings were modified
- `createdAt` timestamps for transparency
- Builds user trust and aids moderation

### 6. **Error Handling Strategy**
- Input validation before database calls
- Clear error messages for users
- Console logging for server-side debugging
- Try-catch blocks for unexpected errors

---

## Discussion Points for Teacher

1. **Why combine create and update into one endpoint?**
   - Reduces API complexity
   - Better user experience (same button for rate/re-rate)
   - Common REST pattern (POST for create-or-update)

2. **Why store rating averages in Recipe document?**
   - Denormalization improves read performance
   - Recipes are viewed 1000x more than they're rated
   - Database optimization vs code complexity trade-off

3. **Why double-check authorization?**
   - Prevents unauthorized edits via URL manipulation
   - Professional security practice
   - Cost of check is minimal vs risk of vulnerability

4. **Could this be done differently?**
   - Use separate create/update endpoints (more RESTful but complex)
   - Calculate averages on-the-fly (slower but simpler)
   - Use database aggregation pipelines instead of application code (possible improvement!)

---

## Potential Improvements (Future Work)

1. **Aggregation Pipeline**: Calculate averages at database level instead of application
2. **Rate Limiting**: Prevent users from spam-rating
3. **Comment Moderation**: Admin ability to hide/delete inappropriate comments
4. **Soft Deletes**: Mark comments as deleted instead of removing them
5. **Pagination**: Load comments in batches as user scrolls
6. **Comment Replies**: Thread-based discussions instead of flat comments

