# DNS & INFRASTRUCTURE OWNER HANDOFF MANUAL

**Platform:** Global World-Class Sudoku Platform  
**Target Audience:** Platform Owner / Infrastructure Administrator / DevOps Lead  
**Document Status:** Actionable Infrastructure Handover  
**Classification:** `BLOCKED_BY_OWNER`  

---

## 1. Current State

Public DNS resolution tests performed against global recursive resolvers (Google `8.8.8.8`, Cloudflare `1.1.1.1`) and authoritative `.com` registry nameservers (`a.gtld-servers.net`):

```text
sudoku-global.com             → NXDOMAIN (Unregistered / No Delegation)
staging.sudoku-global.com     → NXDOMAIN (Unresolvable)
api-staging.sudoku-global.com → NXDOMAIN (Unresolvable)
```

---

## 2. Root Cause & Forensic Findings

1. **Domain Registration Status:**
   - **Verisign RDAP Query (`https://rdap.verisign.com/com/v1/domain/sudoku-global.com`):** Returned **HTTP 404 (Not Found)**.
   - **gTLD Root Query (`192.5.6.30`):** Returned 0 authoritative Nameserver (NS) records for `sudoku-global.com`.
   - **Conclusion:** The domain `sudoku-global.com` is either **unregistered** in the global `.com` registry or has **no active registrar delegation / no authoritative nameservers configured**.

2. **Access & Credential Status:**
   - **Vercel CLI / Access:** `BLOCKED_BY_OWNER` (No API tokens or linked project credentials in local environment).
   - **Railway CLI / Access:** `BLOCKED_BY_OWNER` (No API tokens or linked project credentials in local environment).
   - **Cloudflare / Registrar Access:** `BLOCKED_BY_OWNER` (No registrar or DNS management credentials provided).

---

## 3. DNS Provider

```text
UNKNOWN — OWNER MUST CONFIRM REGISTRAR / DNS PROVIDER (e.g. Cloudflare Registrar, Namecheap, GoDaddy, AWS Route 53)
```

If the domain is not yet purchased, the owner must register `sudoku-global.com` at their registrar of choice (Cloudflare recommended for DDoS, SSL/TLS, and edge caching).

---

## 4. End-to-End Infrastructure Dependency Chain

To make the public staging environment operational, the following dependency chains must be established:

### Frontend Flow:
```text
Registrar (Domain Purchase / Active Registration)
   ↓
Authoritative Nameservers (e.g. Cloudflare / Route 53 / Registrar DNS)
   ↓
DNS Zone (`sudoku-global.com`)
   ↓
Vercel Custom Domain Configuration (Settings → Domains)
   ↓
CNAME Record: staging.sudoku-global.com → cname.vercel-dns.com
```

### Backend API Flow:
```text
Registrar (Domain Purchase / Active Registration)
   ↓
Authoritative Nameservers (e.g. Cloudflare / Route 53 / Registrar DNS)
   ↓
DNS Zone (`sudoku-global.com`)
   ↓
Railway Custom Domain Configuration (Networking → Custom Domain)
   ↓
CNAME Record: api-staging.sudoku-global.com → <railway-provided-cname-target>
```

---

## 5. Required Provider Actions

### A. Domain Registration & Authoritative Nameserver Setup
1. Register `sudoku-global.com` at a domain registrar if not already registered.
2. Delegate DNS nameservers to your DNS management provider (e.g., Cloudflare: `*.ns.cloudflare.com`).

### B. Vercel Dashboard Actions (Frontend: `staging.sudoku-global.com`)
1. Open the **Vercel Dashboard** → Select the Sudoku Web Project.
2. Navigate to **Settings** → **Domains**.
3. Add domain: `staging.sudoku-global.com`.
4. Select the target branch / deployment (e.g., `staging` or `main`).
5. Copy the exact CNAME value indicated by Vercel (standard is `cname.vercel-dns.com` or custom verification code if domain verification TXT is requested).

### C. Railway Dashboard Actions (Backend: `api-staging.sudoku-global.com`)
1. Open the **Railway Dashboard** → Select the Sudoku API Service.
2. Navigate to **Settings** → **Networking** → **Custom Domains**.
3. Add domain: `api-staging.sudoku-global.com`.
4. Railway will generate a unique CNAME target (e.g., `api-staging.sudoku-global.com.up.railway.app` or project-specific target).
5. Copy the exact generated CNAME target.

---

## 6. Required DNS Records Matrix

Add the following records into your authoritative DNS Zone Manager (e.g., Cloudflare DNS):

| Type | Name / Host | Target / Destination | TTL | Proxy Status (Cloudflare) | Purpose |
|---|---|---|---|---|---|
| **CNAME** | `staging` | `cname.vercel-dns.com` *(or Vercel-provided target)* | Auto | DNS only *(or Proxied if SSL configured)* | Web Frontend App |
| **CNAME** | `api-staging` | `<railway-generated-target>.up.railway.app` | Auto | DNS only *(Required for WebSockets / WSS bypass)* | Backend API & WebSockets |
| **TXT** *(if required)* | `_vercel` | `<vercel-verification-code>` | Auto | DNS only | Vercel Domain Verification |

> **IMPORTANT FOR CLOUDFLARE USERS:**  
> The `api-staging` record should initially be set to **DNS Only (Grey Cloud)** to ensure WebSocket (`wss://`) handshakes and NestJS heartbeat connections do not encounter Cloudflare proxy timeout issues during staging validation.

---

## 7. Owner Verification Commands

After applying the DNS records and configuring custom domains in Vercel and Railway, run the following commands to verify resolution:

### 1. Verify Public DNS Resolution:
```bash
# Verify Frontend CNAME resolution
nslookup -type=CNAME staging.sudoku-global.com 8.8.8.8
nslookup -type=CNAME staging.sudoku-global.com 1.1.1.1

# Verify Backend CNAME resolution
nslookup -type=CNAME api-staging.sudoku-global.com 8.8.8.8
nslookup -type=CNAME api-staging.sudoku-global.com 1.1.1.1
```

### 2. Verify HTTP & TLS Endpoints:
```bash
# Verify Frontend HTTPS
curl -Iv https://staging.sudoku-global.com

# Verify API Health & Ready endpoints
curl -Iv https://api-staging.sudoku-global.com/health
curl -Iv https://api-staging.sudoku-global.com/ready
```

### 3. Verify WebSocket Endpoint:
```bash
# Test WebSocket upgrade handshake
wscat -c wss://api-staging.sudoku-global.com/
```

---

## 8. Next Automated Steps

Once public DNS resolves and endpoints are reachable, the automated pipeline will immediately proceed with:
- Public Staging Runtime Verification
- Live Multi-User Ranked Duels & Real Move Synchronization
- Redis Presence & WebSocket Room Validation
- K6 Load Tests (100, 500, 1000 VUs) against live staging infrastructure
- Sentry telemetry and live SEO validation
