# FastAPI Service with Envoy HCM (HTTP Connection Manager)

This project demonstrates a FastAPI service fronted by Envoy proxy with comprehensive request/response logging to file.

## Architecture

```
Client → Envoy (Port 8080) → FastAPI Service (Port 8000)
                ↓
         logs/output.txt (Complete request/response logging)
```

## Components

- **FastAPI Service**: A simple REST API that accepts POST requests and writes to a file
- **Envoy HCM**: HTTP Connection Manager with Lua filter that logs EVERYTHING:
  - **Request Headers**: All headers including custom headers, authorization tokens
  - **Request Body**: Complete request payload
  - **Response Headers**: All response headers
  - **Response Body**: Complete response payload
  - **Upstream Info**: Cluster, host, connection details
  - **Metrics**: Durations, bytes sent/received, wire bytes
  - **Request ID**: Unique identifier for each request

## What Gets Logged

Each request generates a detailed log entry in `logs/output.txt` with:

### Request Information
- Unique Request ID (X-Request-ID)
- Timestamp
- HTTP method, path, and protocol
- Remote and local addresses
- All request headers (including authorization, custom headers)
- **Complete request body**

### Response Information
- HTTP status code and details
- Response flags (errors, timeouts, etc.)
- All response headers
- **Complete response body**

### Upstream Information
- Upstream cluster name
- Upstream host IP and port
- Local address used for connection
- Transport failure reason (if any)

### Connection Information
- Connection ID
- Requested server name
- Route name

### Detailed Metrics
- Total duration
- Request duration
- Response duration
- Response TX duration
- Bytes sent and received
- Upstream wire bytes sent/received
- Upstream header bytes sent/received
- Downstream wire bytes sent/received

## Usage

### Start Services

```bash
docker compose up --build -d
```

### Send Request

```bash
curl -X POST http://localhost:8080/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"text":"Hello from Envoy"}'
```

### View Logs

```bash
# View all logs
cat logs/output.txt

# View latest entries
tail -100 logs/output.txt

# Follow logs in real-time
tail -f logs/output.txt

# Search for specific request ID
grep "REQUEST ID: <request-id>" logs/output.txt -A 100
```

## Example Log Entry

```
====================================================================
REQUEST ID: d092d250-c01e-4356-a2c0-37fcb2fe3418
TIMESTAMP: 2026-02-08T09:29:34.301Z
====================================================================

==================== REQUEST DETAILS ====================
METHOD: POST
PATH: /submit
PROTOCOL: HTTP/1.1
REMOTE ADDRESS: 172.23.0.1:35670
LOCAL ADDRESS: 172.23.0.3:8080

==================== REQUEST HEADERS ====================
:authority: localhost:8080
:path: /submit
:method: POST
:scheme: http
user-agent: curl/8.5.0
content-type: application/json
content-length: 41
authorization: Bearer test-token-123
...

==================== REQUEST BODY ====================
{"text":"Test request with body logging"}

==================== RESPONSE DETAILS ====================
STATUS: 200 via_upstream
FLAGS: -

==================== RESPONSE HEADERS ====================
:status: 200
content-type: application/json
content-length: 23
...

==================== RESPONSE BODY ====================
{"response":"RECEIVED"}

==================== METRICS ====================
TOTAL DURATION: 3ms
REQUEST DURATION: 0ms
RESPONSE DURATION: 3ms
BYTES SENT: 23
BYTES RECEIVED: 41
...
====================================================================
```

## Ports

- **8080**: External traffic (Envoy listener)
- **8000**: Internal FastAPI service (not exposed externally)
- **9901**: Envoy admin interface

## Files

```
hcm/
├── src/
│   ├── __init__.py
│   └── main.py              # FastAPI application
├── config/
│   └── envoy.yaml           # Envoy proxy configuration
├── logs/
│   ├── .gitkeep
│   └── output.txt           # Request/response logs (auto-generated)
├── docker-compose.yml       # Multi-container setup
├── Dockerfile               # FastAPI service container
├── requirements.txt         # Python dependencies
├── .gitignore
└── README.md
```

- `src/main.py`: FastAPI application with request handling
- `config/envoy.yaml`: Envoy proxy configuration with HCM, Lua filter, and file access logging
- `docker-compose.yml`: Multi-container Docker setup
- `Dockerfile`: FastAPI service container definition
- `requirements.txt`: Python dependencies
- `logs/output.txt`: Complete request/response logs (auto-generated)

## Features

✅ Complete request/response body logging  
✅ All headers captured (including authorization)  
✅ Unique request ID for each transaction  
✅ Detailed metrics and timing information  
✅ File-based logging for persistence  
✅ Easy to search and analyze logs  

## Cleanup

```bash
docker compose down

# To also remove logs
rm -rf logs/
```
