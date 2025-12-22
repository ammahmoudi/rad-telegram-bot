# API Schema Generator

Automatically discovers and tests all Planka API functions, generating comprehensive schemas.

## Features

- **Automatic Discovery**: Scans all API modules in `src/api/` directory
- **Dynamic Testing**: Tests each API with real data when possible
- **Schema Generation**: Creates structured JSON schema with:
  - Function names and modules
  - Parameter definitions  
  - Request/response examples
  - Error information

## Usage

```bash
npm run schema:generate
```

Or directly:

```bash
npx tsx generate-api-schemas.ts
```

## Output

Generates `api-schemas.json` with the following structure:

```json
{
  "generatedAt": "2025-12-22T08:47:33.876Z",
  "plankaInstance": "https://pm-dev.rastar.dev",
  "totalAPIs": 35,
  "modules": ["attachments", "boards", "cards", ...],
  "schemas": [
    {
      "name": "getBoard",
      "module": "boards",
      "parameters": [
        {
          "name": "boardId",
          "type": "string",
          "required": true
        }
      ],
      "hasResponse": true,
      "requestExample": { "args": ["board-123"] },
      "responseSample": {
        "keys": ["item", "included"],
        "sample": "{\"item\":{\"id\":\"...\"}...}"
      }
    }
  ]
}
```

## How It Works

1. **Discovery**: Scans `src/api/` directory for TypeScript modules
2. **Analysis**: Extracts function names and parameter information
3. **Test Data Creation**: Creates temporary test resources (lists, cards, labels, etc.)
4. **Testing**: Calls each API function with appropriate test data
5. **Schema Recording**: Captures request/response structure
6. **Cleanup**: Removes all test resources
7. **Output**: Saves complete schema to JSON file

## Automatic Updates

When you add new API functions:
- Just add them to any module in `src/api/`
- Run the generator again
- The new APIs will automatically be discovered and tested

## Configuration

Edit these values in `generate-api-schemas.ts`:

```typescript
const PLANKA_BASE_URL = 'https://pm-dev.rastar.dev';
const USERNAME = 'your-username';
const PASSWORD = 'your-password';
```

## Test Board

The generator uses the "Maniject" board for testing. Make sure you have editor permissions on a board in your Planka instance.

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "schema:generate": "tsx generate-api-schemas.ts"
  }
}
```

## Error Handling

- Missing test data: API is skipped
- Network errors: Logged but doesn't stop generation
- Permission errors: Logged and marked in schema
- Cleanup errors: Ignored (test data may remain)

## Output Summary

After completion, shows:
- Total APIs discovered
- Successfully tested count
- Failed tests count
- Number of modules

Example:
```
📊 Summary:
   Total APIs: 35
   Successful: 4
   Failed: 31
   Modules: 9
```

## Notes

- Some APIs may fail due to rapid requests (server throttling)
- Test resources are created with `[SCHEMA_TEST]` prefix
- Cleanup happens automatically but may fail on network issues
- Schemas are continuously updated - just re-run the generator
