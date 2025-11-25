# Permissions & Groups Router

> **Complete Documentation for Permission and Group Management Endpoints**

This router handles all permission and group management operations including CRUD operations for permissions and groups, assigning permissions to groups, and managing user-group relationships.

## 📋 Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [Permissions](#permissions)
  - [Groups](#groups)
  - [User Permissions & Groups](#user-permissions--groups)
- [Workflows](#workflows)
- [Error Handling](#error-handling)

## Overview

The Permissions & Groups router provides comprehensive role-based access control (RBAC) functionality including:
- **Permission Management**: Create, read, update, and delete permissions
- **Group Management**: Create, read, update, and delete groups
- **Permission Assignment**: Assign permissions to groups
- **User-Group Assignment**: Assign groups to users
- **Permission Queries**: Get user permissions and groups

**Base Path:** `/{MODE}/permissions`, `/{MODE}/groups`, `/{MODE}/users`

**Authentication:** All endpoints require authentication

**Permissions:** Various permissions required (see each endpoint)

## Endpoints

### Permissions

#### Get All Permissions

**Endpoint:** `GET /{MODE}/permissions`

**Description:** Get list of all permissions in the system.

**Authentication:** Required
**Permission:** `view_permission`

**Response:**
```json
{
  "success": true,
  "message": "Permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "permission_id": "uuid",
        "name": "View Dashboard",
        "codename": "view_dashboard",
        "description": "Permission to view dashboard",
        "category": "dashboard"
      }
    ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_permission)
   │
   ├─► Get All Permissions
   │   └─► prisma.permission.findMany()
   │
   └─► Return Permissions List
```

---

#### Get Permission by ID

**Endpoint:** `GET /{MODE}/permissions/:permission_id`

**Description:** Get a specific permission by ID.

**Authentication:** Required
**Permission:** `view_permission`

**Parameters:**
- `permission_id` (path): Permission UUID

**Response:**
```json
{
  "success": true,
  "message": "Permission retrieved successfully",
  "data": {
    "permission": {
      "permission_id": "uuid",
      "name": "View Dashboard",
      "codename": "view_dashboard",
      "description": "Permission to view dashboard",
      "category": "dashboard"
    }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_permission)
   │
   ├─► Get Permission by ID
   │   └─► prisma.permission.findUnique()
   │
   └─► Return Permission Data
```

---

#### Create Permission

**Endpoint:** `POST /{MODE}/permissions`

**Description:** Create a new permission.

**Authentication:** Required
**Permission:** `add_permission`

**Request Body:**
```json
{
  "name": "View Dashboard",
  "codename": "view_dashboard",
  "description": "Permission to view dashboard",
  "category": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "permission": {
      "permission_id": "uuid",
      "name": "View Dashboard",
      "codename": "view_dashboard",
      "description": "Permission to view dashboard",
      "category": "dashboard"
    }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (add_permission)
   │
   ├─► Validate Request Data
   │   ├─► name required
   │   ├─► codename required
   │   └─► codename must be unique
   │
   ├─► Create Permission
   │   └─► prisma.permission.create()
   │
   └─► Return Created Permission
```

---

#### Update Permission

**Endpoint:** `PUT /{MODE}/permissions/:permission_id`

**Description:** Update an existing permission.

**Authentication:** Required
**Permission:** `edit_permission`

**Parameters:**
- `permission_id` (path): Permission UUID

**Request Body:**
```json
{
  "name": "View Dashboard Updated",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission updated successfully",
  "data": {
    "permission": { ... }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_permission)
   │
   ├─► Update Permission
   │   └─► prisma.permission.update()
   │
   └─► Return Updated Permission
```

---

#### Delete Permission

**Endpoint:** `DELETE /{MODE}/permissions/:permission_id`

**Description:** Delete a permission. Removes permission from all groups.

**Authentication:** Required
**Permission:** `delete_permission`

**Parameters:**
- `permission_id` (path): Permission UUID

**Response:**
```json
{
  "success": true,
  "message": "Permission deleted successfully",
  "data": { ... }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (delete_permission)
   │
   ├─► Delete Permission
   │   └─► prisma.permission.delete()
   │       └─► Cascade deletes GroupPermission entries
   │
   └─► Return Success Response
```

---

### Groups

#### Get All Groups

**Endpoint:** `GET /{MODE}/groups`

**Description:** Get list of all groups with their permissions.

**Authentication:** Required
**Permission:** `view_group`

**Response:**
```json
{
  "success": true,
  "message": "Groups retrieved successfully",
  "data": {
    "groups": [
      {
        "group_id": "uuid",
        "name": "Admin",
        "codename": "admin",
        "description": "Administrator group",
        "is_system": true,
        "is_active": true,
        "permissions": [
          {
            "permission_id": "uuid",
            "name": "View Dashboard",
            "codename": "view_dashboard"
          }
        ]
      }
    ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_group)
   │
   ├─► Get All Groups with Permissions
   │   └─► prisma.group.findMany({ include: { permissions } })
   │
   └─► Return Groups List
```

---

#### Get Group by ID

**Endpoint:** `GET /{MODE}/groups/:group_id`

**Description:** Get a specific group with its permissions.

**Authentication:** Required
**Permission:** `view_group`

**Parameters:**
- `group_id` (path): Group UUID

**Response:**
```json
{
  "success": true,
  "message": "Group retrieved successfully",
  "data": {
    "group": {
      "group_id": "uuid",
      "name": "Admin",
      "codename": "admin",
      "permissions": [ ... ]
    }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_group)
   │
   ├─► Get Group by ID with Permissions
   │   └─► prisma.group.findUnique({ include: { permissions } })
   │
   └─► Return Group Data
```

---

#### Create Group

**Endpoint:** `POST /{MODE}/groups`

**Description:** Create a new group.

**Authentication:** Required
**Permission:** `add_group`

**Request Body:**
```json
{
  "name": "Moderator",
  "codename": "moderator",
  "description": "Moderator group",
  "is_system": false,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "group": { ... }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (add_group)
   │
   ├─► Validate Request Data
   │   ├─► name required
   │   ├─► codename required
   │   └─► codename must be unique
   │
   ├─► Create Group
   │   └─► prisma.group.create()
   │
   └─► Return Created Group
```

---

#### Update Group

**Endpoint:** `PUT /{MODE}/groups/:group_id`

**Description:** Update an existing group.

**Authentication:** Required
**Permission:** `edit_group`

**Parameters:**
- `group_id` (path): Group UUID

**Request Body:**
```json
{
  "name": "Moderator Updated",
  "description": "Updated description",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Group updated successfully",
  "data": {
    "group": { ... }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_group)
   │
   ├─► Update Group
   │   └─► prisma.group.update()
   │
   └─► Return Updated Group
```

---

#### Delete Group

**Endpoint:** `DELETE /{MODE}/groups/:group_id`

**Description:** Delete a group. System groups cannot be deleted.

**Authentication:** Required
**Permission:** `delete_group`

**Parameters:**
- `group_id` (path): Group UUID

**Response:**
```json
{
  "success": true,
  "message": "Group deleted successfully",
  "data": {
    "group_id": "uuid"
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (delete_group)
   │
   ├─► Check if System Group
   │   └─► If is_system = true, reject deletion
   │
   ├─► Delete Group
   │   └─► prisma.group.delete()
   │       └─► Cascade deletes GroupPermission and UserGroup entries
   │
   └─► Return Success Response
```

**Note:** System groups (is_system = true) cannot be deleted.

---

#### Assign Permissions to Group

**Endpoint:** `POST /{MODE}/groups/:group_id/permissions`

**Description:** Assign permissions to a group. Replaces existing permissions.

**Authentication:** Required
**Permission:** `edit_group`

**Parameters:**
- `group_id` (path): Group UUID

**Request Body:**
```json
{
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions assigned successfully",
  "data": {
    "group": {
      "group_id": "uuid",
      "permissions": [ ... ]
    }
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (edit_group)
   │
   ├─► Validate Request
   │   └─► permission_ids must be array
   │
   ├─► Delete Existing Permissions
   │   └─► prisma.groupPermission.deleteMany()
   │
   ├─► Create New Permission Assignments
   │   └─► prisma.groupPermission.createMany()
   │
   ├─► Get Updated Group with Permissions
   │
   └─► Return Updated Group
```

---

### User Permissions & Groups

#### Get User Groups

**Endpoint:** `GET /{MODE}/users/:user_id/groups`

**Description:** Get all groups assigned to a user.

**Authentication:** Required
**Permission:** `view_user`

**Parameters:**
- `user_id` (path): User UUID

**Response:**
```json
{
  "success": true,
  "message": "User groups retrieved successfully",
  "data": {
    "user_id": "uuid",
    "groups": [
      {
        "group_id": "uuid",
        "name": "Admin",
        "codename": "admin"
      }
    ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_user)
   │
   ├─► Get User Groups
   │   └─► getUserGroups(user_id)
   │
   └─► Return User Groups
```

---

#### Get User Permissions

**Endpoint:** `GET /{MODE}/users/:user_id/permissions`

**Description:** Get all permissions for a user (from all groups).

**Authentication:** Required
**Permission:** `view_user`

**Parameters:**
- `user_id` (path): User UUID

**Response:**
```json
{
  "success": true,
  "message": "User permissions retrieved successfully",
  "data": {
    "user_id": "uuid",
    "permissions": [
      {
        "permission_id": "uuid",
        "name": "View Dashboard",
        "codename": "view_dashboard"
      }
    ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_user)
   │
   ├─► Get User Permissions
   │   └─► getUserPermissions(user_id)
   │       └─► Aggregates permissions from all user groups
   │
   └─► Return User Permissions
```

---

#### Assign Groups to User

**Endpoint:** `POST /{MODE}/users/:user_id/groups`

**Description:** Assign groups to a user. Uses group codenames. Updates user role flags.

**Authentication:** Required
**Permission:** `assign_groups`

**Parameters:**
- `user_id` (path): User UUID

**Request Body:**
```json
{
  "group_codenames": ["admin", "user"]
}
```

**Valid Codenames:** `super_admin`, `admin`, `developer`, `business`, `accountant`, `user`

**Response:**
```json
{
  "success": true,
  "message": "Groups assigned successfully (user role flags updated)",
  "data": {
    "user_id": "uuid",
    "groups": [ ... ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (assign_groups)
   │
   ├─► Validate Request
   │   ├─► group_codenames must be array
   │   └─► Validate codenames (must be valid)
   │
   ├─► Get Assigned By User ID
   │   └─► From JWT token
   │
   ├─► Assign Groups to User
   │   ├─► Delete existing UserGroup entries
   │   ├─► Create new UserGroup entries
   │   └─► Update user role flags (is_superuser, is_admin, etc.)
   │
   ├─► Get Updated User Groups
   │
   └─► Return User Groups
```

**Note:** This endpoint updates user role flags (is_superuser, is_admin, etc.) based on assigned groups.

---

#### Get My Groups

**Endpoint:** `GET /{MODE}/users/me/groups`

**Description:** Get all groups for the current authenticated user.

**Authentication:** Required
**Permission:** `view_profile`

**Response:**
```json
{
  "success": true,
  "message": "User groups retrieved successfully",
  "data": {
    "groups": [ ... ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_profile)
   │
   ├─► Get Current User ID
   │   └─► From JWT token
   │
   ├─► Get User Groups
   │   └─► getUserGroups(userId)
   │
   └─► Return User Groups
```

---

#### Get My Permissions

**Endpoint:** `GET /{MODE}/users/me/permissions`

**Description:** Get all permissions for the current authenticated user.

**Authentication:** Required
**Permission:** `view_profile`

**Response:**
```json
{
  "success": true,
  "message": "User permissions retrieved successfully",
  "data": {
    "permissions": [ ... ]
  }
}
```

**Workflow:**
```
1. Authenticated Request
   │
   ├─► Validate JWT Token
   │
   ├─► Check Permission (view_profile)
   │
   ├─► Get Current User ID
   │   └─► From JWT token
   │
   ├─► Get User Permissions
   │   └─► getUserPermissions(userId)
   │
   └─► Return User Permissions
```

---

## Workflows

### Complete Permission Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│          Permission & Group Management Flow                 │
└────────────────────────────┬────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌───────────────┐         ┌───────────────┐
        │  Permissions  │         │    Groups     │
        └───────┬───────┘         └───────┬───────┘
                │                           │
        ┌───────┴───────┐         ┌───────┴───────┐
        │               │         │               │
        ▼               ▼         ▼               ▼
    Create/Read    Update/Delete  Create/Read  Update/Delete
        │               │         │               │
        └───────┬───────┘         └───────┬───────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Assign Permissions│
                    │   to Groups       │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Assign Groups   │
                    │   to Users      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ User Permissions │
                    │   (Aggregated)   │
                    └──────────────────┘
```

### User Permission Resolution Flow

```
1. User Makes Request
   │
   ├─► Extract JWT Token
   │
   ├─► Get User ID from Token
   │
   ├─► Get User Groups
   │   └─► Query UserGroup table
   │
   ├─► Get Group Permissions
   │   └─► Query GroupPermission for each group
   │
   ├─► Aggregate Permissions
   │   └─► Combine all permissions from all groups
   │
   └─► Check Required Permission
       └─► Verify permission exists in aggregated list
```

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid Payload:**
```json
{
  "success": false,
  "message": "Invalid request payload",
  "error": "name and codename are required",
  "statusCode": 400
}
```

**403 Forbidden - Permission Denied:**
```json
{
  "success": false,
  "message": "Permission denied",
  "error": "Insufficient permissions",
  "statusCode": 403
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Group not found",
  "error": "Group with provided ID does not exist",
  "statusCode": 404
}
```

**409 Conflict - Duplicate Entry:**
```json
{
  "success": false,
  "message": "Duplicate entry",
  "error": "Group with this name or codename already exists",
  "statusCode": 409
}
```

---

## Best Practices

1. **Permission Codenames**: Use lowercase with underscores (e.g., `view_dashboard`)
2. **Group Codenames**: Use lowercase (e.g., `admin`, `user`)
3. **System Groups**: Don't delete system groups (is_system = true)
4. **Permission Assignment**: Assign permissions to groups, not directly to users
5. **Group Assignment**: Assign groups to users, not permissions directly
6. **Permission Aggregation**: User permissions are aggregated from all assigned groups
7. **Role Flags**: User role flags are automatically updated when groups are assigned
8. **Validation**: Always validate permission/group codenames before assignment

---

**Last Updated**: January 2025

