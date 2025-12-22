# Planka API 2.0.0-rc.3 - Complete API List

## Access Tokens
- `POST /api/access-tokens/accept-terms` - Accept terms and conditions
- `POST /api/access-tokens` - User login
- `DELETE /api/access-tokens/me` - User logout
- `POST /api/access-tokens/exchange-with-oidc` - Exchange OIDC code for access token
- `POST /api/access-tokens/revoke-pending-token` - Revoke pending token

## Actions
- `GET /api/boards/{boardId}/actions` - Get board actions
- `GET /api/cards/{cardId}/actions` - Get card actions

## Attachments
- `POST /api/cards/{cardId}/attachments` - Create attachment
- `DELETE /api/attachments/{id}` - Delete attachment
- `PATCH /api/attachments/{id}` - Update attachment

## Background Images
- `POST /api/projects/{projectId}/background-images` - Upload background image
- `DELETE /api/background-images/{id}` - Delete background image

## Base Custom Field Groups
- `POST /api/projects/{projectId}/base-custom-field-groups` - Create base custom field group
- `DELETE /api/base-custom-field-groups/{id}` - Delete base custom field group
- `PATCH /api/base-custom-field-groups/{id}` - Update base custom field group

## Board Links
- `GET /api/boards/{boardId}/links` - Get board links
- `DELETE /api/board-links/{id}` - Delete board link
- `PATCH /api/board-links/{id}` - Update board link

## Board Memberships
- `POST /api/boards/{boardId}/board-memberships` - Create board membership
- `DELETE /api/board-memberships/{id}` - Delete board membership
- `PATCH /api/board-memberships/{id}` - Update board membership

## Board Releases
- `POST /api/boards/{boardId}/releases` - Create a new release
- `GET /api/boards/{boardId}/releases` - Get all releases for a board
- `DELETE /api/boards/{boardId}/releases/{id}` - Delete a release
- `PUT /api/boards/{boardId}/releases/{id}` - Update a release
- `GET /api/boards/{boardId}/releases/{id}/snapshot` - Get release snapshot
- `PATCH /api/boards/{boardId}/releases/{id}/status` - Update release status

## Board Teams
- `POST /api/boards/{boardId}/board-teams` - Add team to board
- `GET /api/boards/{boardId}/board-teams` - Get board teams
- `DELETE /api/board-teams/{id}` - Remove team from board
- `PATCH /api/board-teams/{id}` - Update board team

## Board Templates
- `POST /api/board-templates` - Create board template
- `GET /api/board-templates` - Get all board templates
- `GET /api/board-templates/{id}` - Get board template
- `PATCH /api/board-templates/{id}` - Update board template
- `DELETE /api/board-templates/{id}` - Delete board template
- `POST /api/board-templates/{id}/card-types` - Add card type to board template
- `DELETE /api/board-templates/{id}/card-types/{typeId}` - Delete template card type
- `POST /api/board-templates/{id}/lists` - Add list to board template
- `PATCH /api/board-templates/{id}/lists/{listId}` - Update template list
- `DELETE /api/board-templates/{id}/lists/{listId}` - Delete template list

## Board Versions
- `POST /api/boards/{boardId}/versions` - Create board version
- `GET /api/boards/{boardId}/versions` - List board versions
- `DELETE /api/boards/{boardId}/versions/{versionId}` - Delete board version
- `POST /api/boards/{boardId}/versions/{versionId}/restore` - Restore board version

## Boards
- `POST /api/projects/{projectId}/boards` - Create board
- `GET /api/boards/{id}` - Get board details
- `PATCH /api/boards/{id}` - Update board
- `DELETE /api/boards/{id}` - Delete board
- `POST /api/boards/{boardId}/duplicate` - Duplicate board
- `PATCH /api/boards/{id}/transfer` - Transfer board to another project
- `POST /api/projects/{projectId}/boards/import` - Import board from another project with sync

## Card Dependencies
- `POST /api/cards/{cardId}/card-dependencies` - Add dependency to card
- `DELETE /api/cards/{cardId}/card-dependencies/dependsOnCardId:{dependsOnCardId}` - Remove dependency from card

## Card Labels
- `POST /api/cards/{cardId}/card-labels` - Add label to card
- `DELETE /api/cards/{cardId}/card-labels/labelId:{labelId}` - Remove label from card

## Card Memberships
- `POST /api/cards/{cardId}/card-memberships` - Add user to card
- `DELETE /api/cards/{cardId}/card-memberships/userId:{userId}` - Remove user from card

## Cards
- `POST /api/lists/{listId}/cards` - Create card
- `GET /api/lists/{listId}/cards` - Get cards in list
- `GET /api/cards/{id}` - Get card details
- `PATCH /api/cards/{id}` - Update card
- `DELETE /api/cards/{id}` - Delete card
- `POST /api/cards/{id}/duplicate` - Duplicate card
- `GET /api/cards/filter` - Filter cards across projects
- `GET /api/cards/{id}/children` - Get child cards
- `POST /api/cards/import-and-sync` - Import and sync card
- `POST /api/cards/{id}/read-notifications` - Mark card notifications as read
- `PATCH /api/cards/{cardId}/release` - Update card release

## Comments
- `POST /api/cards/{cardId}/comments` - Create comment
- `GET /api/cards/{cardId}/comments` - Get card comments
- `DELETE /api/comments/{id}` - Delete comment
- `PATCH /api/comments/{id}` - Update comment

## Config
- `GET /api/config` - Get application configuration

## Custom Field Groups
- `POST /api/boards/{boardId}/custom-field-groups` - Create board custom field group
- `POST /api/cards/{cardId}/custom-field-groups` - Create card custom field group
- `GET /api/custom-field-groups/{id}` - Get custom field group details
- `PATCH /api/custom-field-groups/{id}` - Update custom field group
- `DELETE /api/custom-field-groups/{id}` - Delete custom field group

## Custom Field Values
- `PATCH /api/cards/{cardId}/custom-field-values/customFieldGroupId:{customFieldGroupId}:customFieldId:{customFieldId}` - Create or update custom field value
- `DELETE /api/cards/{cardId}/custom-field-value/customFieldGroupId:{customFieldGroupId}:customFieldId:{customFieldId}` - Delete custom field value

## Custom Fields
- `POST /api/base-custom-field-groups/{baseCustomFieldGroupId}/custom-fields` - Create custom field in base custom field group
- `POST /api/custom-field-groups/{customFieldGroupId}/custom-fields` - Create custom field in custom field group
- `DELETE /api/custom-fields/{id}` - Delete custom field
- `PATCH /api/custom-fields/{id}` - Update custom field

## Document Activities
- `GET /api/document-activities` - Get document activities

## Files
- `GET /api/files/{id}` - Get file metadata
- `PATCH /api/files/{id}` - Update file
- `DELETE /api/files/{id}` - Delete file
- `GET /api/files/{id}/download` - Download file
- `POST /api/spaces/{spaceId}/upload` - Upload file to space

## Folders
- `POST /api/spaces/{spaceId}/folders` - Create a new folder
- `GET /api/spaces/{spaceId}/folders` - List folders in a space
- `GET /api/folders/{id}` - Get folder details
- `PATCH /api/folders/{id}` - Update folder
- `DELETE /api/folders/{id}` - Delete folder
- `GET /api/folders/{id}/download` - Download folder as ZIP

## Labels
- `POST /api/boards/{boardId}/labels` - Create label
- `GET /api/labels` - Get all labels
- `DELETE /api/labels/{id}` - Delete label
- `PATCH /api/labels/{id}` - Update label

## Lists
- `POST /api/boards/{boardId}/lists` - Create list
- `GET /api/lists/{id}` - Get list details
- `PATCH /api/lists/{id}` - Update list
- `DELETE /api/lists/{id}` - Delete list
- `POST /api/lists/{id}/clear` - Clear list
- `POST /api/lists/{id}/move-cards` - Move cards
- `POST /api/lists/{id}/sort` - Sort cards in list

## Notification Services
- `POST /api/boards/{boardId}/notification-services` - Create notification service for board
- `POST /api/users/{userId}/notification-services` - Create notification service for user
- `DELETE /api/notification-services/{id}` - Delete notification service
- `PATCH /api/notification-services/{id}` - Update notification service
- `POST /api/notification-services/{id}/test` - Test notification service

## Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/{id}` - Get notification details
- `PATCH /api/notifications/{id}` - Update notification
- `POST /api/notifications/read-all` - Mark all notifications as read

## Permissions
- `POST /api/permissions` - Grant permission
- `GET /api/permissions/{resourceType}/{resourceId}` - List permissions
- `GET /api/permissions/my` - Get current user's permissions
- `DELETE /api/permissions/{id}` - Revoke permission

## Project Categories
- `POST /api/project-categories` - Create project category
- `GET /api/project-categories` - Get all project categories
- `GET /api/project-categories/{id}` - Get project category
- `PATCH /api/project-categories/{id}` - Update project category
- `DELETE /api/project-categories/{id}` - Delete project category

## Project Managers
- `POST /api/projects/{projectId}/project-managers` - Create project manager
- `DELETE /api/project-managers/{id}` - Delete project manager

## Project Profile Fields
- `POST /api/project-profile-sections/{sectionId}/fields` - Create a new field
- `DELETE /api/project-profile-fields/{id}` - Delete a field
- `PATCH /api/project-profile-fields/{id}` - Update a field

## Project Profile People
- `POST /api/projects/{projectId}/profile-people/{fieldId}` - Add a person to a profile field
- `GET /api/projects/{projectId}/profile-people/{fieldId}` - Get people assigned to a profile field
- `DELETE /api/project-profile-people/{id}` - Remove a person from a profile field
- `PATCH /api/project-profile-people/{id}` - Update a person's role in a profile field

## Project Profile Sections
- `POST /api/project-profiles/{profileId}/sections` - Create a new section
- `DELETE /api/project-profile-sections/{id}` - Delete a section
- `PATCH /api/project-profile-sections/{id}` - Update a section

## Project Profiles
- `POST /api/project-profiles` - Create a new project profile
- `GET /api/project-profiles` - Get all project profiles
- `GET /api/project-profiles/{id}` - Get a project profile
- `PATCH /api/project-profiles/{id}` - Update a project profile
- `DELETE /api/project-profiles/{id}` - Delete a project profile

## Project Releases
- `POST /api/projects/{projectId}/releases` - Create a new release
- `GET /api/projects/{projectId}/releases` - Get all releases for a project
- `PUT /api/projects/{projectId}/releases/{id}` - Update a release
- `DELETE /api/projects/{projectId}/releases/{id}` - Delete a release
- `PATCH /api/projects/{projectId}/releases/{id}/status` - Update release status

## Project Teams
- `POST /api/projects/{projectId}/project-teams` - Add team to project
- `DELETE /api/project-teams/{id}` - Remove team from project
- `PATCH /api/project-teams/{id}` - Update project team

## Project Versions
- `POST /api/projects/{projectId}/versions` - Create project version
- `GET /api/projects/{projectId}/versions` - List project versions
- `DELETE /api/projects/{projectId}/versions/{versionId}` - Delete project version
- `POST /api/projects/{projectId}/versions/{versionId}/restore` - Restore project version

## Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all accessible projects
- `GET /api/projects/{id}` - Get project details
- `PATCH /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{projectId}/duplicate` - Duplicate project

## Releases
- `POST /api/releases/{releaseId}/cards` - Add a card to a release
- `DELETE /api/releases/{releaseId}/cards/{cardId}` - Remove a card from a release

## Report Phases
- `POST /api/reports/{reportId}/phases` - Create a new phase
- `DELETE /api/report-phases/{id}` - Delete phase
- `PATCH /api/report-phases/{id}` - Update phase

## Reports
- `POST /api/reports` - Create a new report
- `GET /api/reports` - Get all reports
- `GET /api/reports/{id}` - Get report details
- `PATCH /api/reports/{id}` - Update report
- `DELETE /api/reports/{id}` - Delete report

## Public Access
- `GET /api/public/{token}` - Access public share link
- `GET /api/public/{token}/download` - Download via public link
- `GET /api/public/{token}/preview` - Preview file via public link
- `GET /api/public/{token}/file/{fileId}/download` - Download a file within a shared folder/space
- `GET /api/public/{token}/file/{fileId}/preview` - Preview a file within a shared folder/space
- `GET /api/public/{token}/download-folder` - Download folder as ZIP via public link

## Share Links
- `POST /api/share-links` - Create a share link
- `PATCH /api/share-links/{id}` - Update a share link
- `DELETE /api/share-links/{id}` - Revoke share link

## Spaces
- `POST /api/spaces` - Create a new space
- `GET /api/spaces` - Get all spaces
- `GET /api/spaces/{id}` - Get space by ID
- `PATCH /api/spaces/{id}` - Update space
- `DELETE /api/spaces/{id}` - Delete space

## Task Lists
- `POST /api/cards/{cardId}/task-lists` - Create task list
- `GET /api/task-lists/{id}` - Get task list details
- `PATCH /api/task-lists/{id}` - Update task list
- `DELETE /api/task-lists/{id}` - Delete task list

## Tasks
- `POST /api/task-lists/{taskListId}/tasks` - Create task
- `DELETE /api/tasks/{id}` - Delete task
- `PATCH /api/tasks/{id}` - Update task

## Team Memberships
- `POST /api/teams/{teamId}/team-memberships` - Create team membership
- `DELETE /api/team-memberships/{id}` - Delete team membership
- `PATCH /api/team-memberships/{id}` - Update team membership

## Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - Get all teams
- `GET /api/teams/{id}` - Get team
- `PATCH /api/teams/{id}` - Update team
- `DELETE /api/teams/{id}` - Delete team

## Terms
- `GET /api/terms/{type}` - Get terms and conditions

## Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user details
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `POST /api/users/{id}/avatar` - Update user avatar
- `PATCH /api/users/{id}/email` - Update user email
- `PATCH /api/users/{id}/password` - Update user password
- `PATCH /api/users/{id}/username` - Update user username

## Webhooks
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks` - Get all webhooks
- `PATCH /api/webhooks/{id}` - Update webhook
- `DELETE /api/webhooks/{id}` - Delete webhook

---

## Summary Statistics
- **Total Categories**: 41
- **Total Endpoints**: ~180+
- **HTTP Methods**: GET, POST, PATCH, DELETE, PUT
