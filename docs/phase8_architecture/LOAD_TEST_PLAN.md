# LOAD TESTING PLAN & BENCHMARK TARGETS

## 1. Objectives
Verify system stability, latency, and error rates under realistic traffic profiles:
- **Baseline:** 100 concurrent Virtual Users (VUs)
- **High Traffic Surge:** 500 concurrent VUs
- **Stress Peak:** 1,000 concurrent VUs

## 2. Key Performance Indicators (KPIs) & Thresholds
- **HTTP Error Rate:** `< 1.0%`
- **P95 Latency:** `< 300 ms` for cached endpoints (Homepage, Leaderboard, Daily challenge)
- **P99 Latency:** `< 800 ms` under peak load
- **WebSocket Reconnection:** `< 2.0s` after network interruptions

## 3. Test Scenarios (`tests/load/k6-scenarios.js`)
- `moderate_load`: 0 to 100 VUs over 2 minutes testing standard browsing and puzzle fetching.
- `high_spike`: 250 to 500 VUs over 2 minutes testing simultaneous leaderboard and game start operations.
- `stress_peak`: 500 to 1000 VUs simulating major tournament or marketing events.
