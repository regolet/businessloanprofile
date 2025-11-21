# PHP API Endpoints Mapping

This document shows the mapping from Node.js endpoints to PHP endpoints.

## Node.js → PHP Endpoint Changes

### Public Endpoints:
- `/api/questions` → `/api/questions.php`
- `/api/submit` → `/api/submit.php`

### Admin Auth Endpoints:
- `/api/admin/login` → `/api/admin-login.php`
- `/api/admin/verify` → `/api/admin-verify.php`
- `/api/admin/logout` → `/api/admin-logout.php`

### Admin Data Endpoints:
- GET `/api/admin/leads` → GET `/api/admin-leads.php`
- GET `/api/admin/leads/:id` → GET `/api/admin-leads.php?id=123`

### Admin Question Management:
- POST `/api/admin/questions` → POST `/api/admin-questions.php`
- PUT `/api/admin/questions/:id` → PUT `/api/admin-questions.php?id=123`
- DELETE `/api/admin/questions/:id` → DELETE `/api/admin-questions.php?id=123`

## Files That Need Updating in admin.js:

Search and replace these patterns in `public/admin.js`:

1. `/admin/leads` → `/admin-leads.php`
2. `/admin/leads/${id}` → `/admin-leads.php?id=${id}`
3. `/admin/questions` → `/admin-questions.php`
4. `/admin/questions/${id}` → `/admin-questions.php?id=${id}`
5. `/questions` → `/questions.php`

## Session Handling Difference:

**Node.js**: Uses Bearer token in Authorization header
**PHP**: Uses PHP sessions automatically, but still accepts Bearer token for compatibility

The PHP version is backward compatible with the existing JavaScript code.
