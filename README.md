# nano-banana-server

```
{
  "servers": {
    "nano-banana-server-remote": {
      "command": "npx",
      "args": [
        "github:cpsloal/nano-banana-server"
      ],
      "properties": {
        "gemini_api_key": "${env:GEMINI_API_KEY}"
      }
    }
  }
}
```