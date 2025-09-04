# nano-banana-server

```
{
  "servers": {
    "nano-banana-server-remote": {
      "command": "npx",
      "args": [
        "--package=github:cpsloal/nano-banana-server",
        "npm",
        "run",
        "start"
      ],
      "properties": {
        "gemini_api_key": "${env:GEMINI_API_KEY}"
      }
    }
  }
}
```