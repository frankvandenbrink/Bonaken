# Bonaken Deployment Guide

## For: Server Manager Agent
## Target: bonaken.frankvdbrink.nl

---

## Important Notice

**The provided Docker and Nginx files are REFERENCE configurations.** You have full authority to modify them as needed for the VPS setup. The key requirements are documented below.

---

## Application Overview

Bonaken is a multiplayer card game (Dutch "Bonaken" variant) built with:
- **Backend**: Node.js + Express + Socket.io (TypeScript)
- **Frontend**: React + Vite (TypeScript)
- **Communication**: WebSocket via Socket.io (critical for real-time gameplay)
- **State**: In-memory only (no database required)

### Architecture
```
[Browser] <--WebSocket--> [Nginx] <--Proxy--> [Node.js Container:3001]
              HTTPS          |
                             +--> Static files (client/dist/)
```

---

## Critical Requirements

### 1. WebSocket Support (MANDATORY)
The game relies entirely on Socket.io WebSocket connections. Without proper WebSocket proxying, the game will not function.

**Nginx must have these headers for `/socket.io/`:**
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### 2. Port Configuration
- **Container internal port**: `3001` (hardcoded in app)
- **Host port**: Flexible (default: 3001)
- **Health check endpoint**: `GET /health` on port 3001

### 3. Static Files
The client build output (`client/dist/`) must be served. Options:
- Serve directly via Nginx from a volume/directory
- Proxy all requests through the container (less efficient)

---

## Provided Files

| File | Purpose | Modifiable |
|------|---------|------------|
| `Dockerfile` | Multi-stage build for production | Yes |
| `docker-compose.yml` | Container orchestration | Yes |
| `nginx/bonaken.conf` | Nginx site configuration | Yes |

---

## Deployment Steps

### Step 1: Clone/Copy Repository

```bash
# Clone to VPS (or copy via scp/rsync)
git clone <repository-url> /opt/bonaken
cd /opt/bonaken
```

### Step 2: Build Docker Image

```bash
# Build the production image
docker compose build

# Or manually:
docker build -t bonaken:latest .
```

### Step 3: Start the Container

```bash
# Start with docker compose
docker compose up -d

# Verify it's running
docker compose ps
docker compose logs -f bonaken
```

### Step 4: Verify Health

```bash
# Check health endpoint
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

### Step 5: Configure Nginx

**Option A: If using standard Nginx installation**
```bash
# Copy config
sudo cp nginx/bonaken.conf /etc/nginx/sites-available/bonaken
sudo ln -s /etc/nginx/sites-available/bonaken /etc/nginx/sites-enabled/

# Copy static files (after building)
sudo mkdir -p /var/www/bonaken
sudo cp -r client/dist/* /var/www/bonaken/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**Option B: If using Nginx in Docker (reverse proxy setup)**
- Add the bonaken container to your nginx network
- Update upstream to use container name: `server bonaken:3001;`
- Mount/copy static files to nginx container

**Option C: If using nginx-proxy or Traefik**
- Add appropriate labels to docker-compose.yml
- Example for nginx-proxy:
```yaml
environment:
  - VIRTUAL_HOST=bonaken.frankvdbrink.nl
  - LETSENCRYPT_HOST=bonaken.frankvdbrink.nl
```

### Step 6: SSL Certificate

```bash
# Using certbot
sudo certbot --nginx -d bonaken.frankvdbrink.nl

# Or if using standalone:
sudo certbot certonly --standalone -d bonaken.frankvdbrink.nl
```

After SSL is configured, uncomment the SSL sections in nginx config.

### Step 7: DNS Configuration

Ensure DNS A record points to the VPS IP:
```
bonaken.frankvdbrink.nl -> <VPS_IP>
```

---

## Alternative Configurations

### If Container Port 3001 is Already in Use

Modify `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Map to different host port
```

Update nginx upstream:
```nginx
upstream bonaken_backend {
    server localhost:3002;
}
```

### If Using External Docker Network

```yaml
# docker-compose.yml
networks:
  default:
    external: true
    name: nginx-proxy  # or your existing network name
```

### If Running Multiple Apps on Same Server

The provided config is self-contained. Just ensure:
- Unique container name
- No port conflicts
- Proper nginx server_name directive

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3001` | Server port (keep as 3001) |

No secrets or API keys required. No database connection needed.

---

## Monitoring & Logs

### View Logs
```bash
# Follow logs
docker compose logs -f bonaken

# Last 100 lines
docker compose logs --tail 100 bonaken
```

### Health Check
```bash
# Container health status
docker inspect bonaken --format='{{.State.Health.Status}}'

# Manual check
curl -f http://localhost:3001/health
```

### Resource Usage
```bash
docker stats bonaken
```

---

## Troubleshooting

### Game Not Loading
1. Check if container is running: `docker compose ps`
2. Check container logs: `docker compose logs bonaken`
3. Verify nginx config: `sudo nginx -t`
4. Test backend directly: `curl http://localhost:3001/health`

### WebSocket Errors / "Disconnected" Messages
1. Verify nginx WebSocket headers are configured
2. Check nginx error logs: `tail -f /var/log/nginx/bonaken.error.log`
3. Ensure no proxy/firewall blocking WebSocket upgrades
4. Test WebSocket directly: browser DevTools → Network → WS tab

### 502 Bad Gateway
1. Container not running or crashed
2. Wrong upstream port in nginx
3. Container not on same network as nginx

### Static Files Not Loading (404)
1. Check if `client/dist/` was built: `ls client/dist/`
2. Verify nginx root path: `root /var/www/bonaken;`
3. Check file permissions

---

## Updating the Application

```bash
cd /opt/bonaken

# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Update static files if served separately
sudo cp -r client/dist/* /var/www/bonaken/
```

---

## Backup & Restore

**No persistent data to backup.** All game state is in-memory and ephemeral. Games are automatically cleaned up after inactivity.

---

## Security Notes

- Container runs as non-root user (`bonaken:1001`)
- No database credentials or secrets
- No sensitive data stored
- Recommend enabling HTTPS via SSL certificate
- Consider rate limiting in nginx for production

---

## Quick Reference

| Task | Command |
|------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Restart | `docker compose restart` |
| Logs | `docker compose logs -f bonaken` |
| Rebuild | `docker compose build --no-cache` |
| Health | `curl http://localhost:3001/health` |
| Shell | `docker compose exec bonaken sh` |

---

## Contact

For application-specific questions about the game logic or frontend behavior, refer to:
- `spec.md` - Full game specification
- `CLAUDE.md` - Development instructions
- `implementation_plan.md` - Feature checklist
