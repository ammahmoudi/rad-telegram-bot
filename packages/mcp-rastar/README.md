# MCP Rastar

Model Context Protocol (MCP) server for Rastar company integration.

## Features

- **Authentication**: OAuth2-based authentication with password and refresh token grants
- **Food Menu Management**: View available lunch menus and make selections

## API Endpoints

- `POST /auth/v1/token?grant_type=password` - Login with email/password
- `POST /auth/v1/token?grant_type=refresh_token` - Refresh access token
- `GET /rest/v1/menu_schedule` - Get available food menu
- `GET /rest/v1/user_menu_selections` - Get user's food selections
- `POST /rest/v1/user_menu_selections` - Select food item
- `DELETE /rest/v1/user_menu_selections` - Remove food selection

## Configuration

Required environment variables:

```
RASTAR_BASE_URL=https://hhryfmueyrkbnjxgjzlf.supabase.co
RASTAR_API_KEY=<your-api-key>
```
