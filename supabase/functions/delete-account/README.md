# Supabase delete-account function

This function is intended to be deployed in a Supabase Edge Function or a compatible Deno runtime.

## Environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Usage

Send a POST request with JSON body:

```json
{
  "userId": "<supabase-user-id>"
}
```

Example:

```bash
curl -X POST https://<your-supabase-project>.functions.supabase.co/delete-account \
  -H "Content-Type: application/json" \
  -d '{"userId":"<user-id>"}'
```
