# API Schema Generator

This document explains how the API schema generator works and how to use it.

## Purpose

The schema generator automatically:
1. Discovers all API modules and functions
2. Extracts function signatures and parameters
3. Makes test API calls with real data
4. Documents request/response examples
5. Categorizes APIs (auth, read, create, delete)

## Usage

**Prerequisites:**
1. Configure `.env.test` with valid credentials (see `.env.test.example`)
2. Build the project: `npm run build`

**Generate schemas:**
```bash
npm run schema:generate
```

**Output:**
- Creates `api-schemas.json` with comprehensive API documentation
- Includes request examples, response samples, and error information

## How It Works

### 1. Discovery Phase

The generator scans `src/api/` for TypeScript files and imports all exported functions.

### 2. Analysis Phase

For each function:
- Parses the function signature
- Extracts parameter names and requirements
- Categorizes the function (auth, read, create, delete)

### 3. Testing Phase

Makes real API calls in order:
1. **Auth**: Tests login and token operations
2. **Read**: Tests get/list operations (non-destructive)
3. **Create**: Tests creation operations (stores IDs for cleanup)
4. **Delete**: Tests deletion operations

### 4. Cleanup Phase

Automatically deletes any created test resources to keep the database clean.

## Schema Output Format

```json
{
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "rastarInstance": "https://my-api.rastar.company",
  "totalAPIs": 7,
  "modules": ["auth", "menu"],
  "schemas": [
    {
      "name": "login",
      "module": "auth",
      "category": "auth",
      "parameters": [
        { "name": "email", "type": "string", "required": true },
        { "name": "password", "type": "string", "required": true }
      ],
      "hasResponse": true,
      "requestExample": {
        "args": ["test@example.com", "password"]
      },
      "responseSample": {
        "keys": ["access_token", "refresh_token", "user"],
        "sample": "{\"access_token\":\"eyJ...\",\"refresh_token\":\"...\""
      }
    }
  ]
}
```

## Categories

- **auth**: Authentication operations (login, refresh token)
- **read**: Read operations (get, list) - safe to run multiple times
- **create**: Create operations - generates new resources
- **delete**: Delete operations - removes resources

## Customization

To add test data for new APIs, edit the `testData` object in `generate-api-schemas.ts`:

```typescript
const testData: any = {
  email: EMAIL,
  password: PASSWORD,
  userId: userId,
  menuScheduleId: testScheduleId,
  // Add your custom test data here
};
```

## Troubleshooting

**"Missing required test data"**
- The API requires a parameter that isn't in the `testData` object
- Add the missing parameter to `testData`

**"Authentication failed"**
- Check your `.env.test` credentials
- Ensure the Rastar instance is accessible

**"Failed to delete resource"**
- Resource might be already deleted
- Check for database constraints preventing deletion

## Benefits

1. **Automatic Documentation**: No manual documentation needed
2. **Real Data**: Examples based on actual API responses
3. **Always Up-to-Date**: Regenerate after API changes
4. **Error Detection**: Catches API issues early
5. **Clean Testing**: Automatic cleanup prevents test data accumulation
