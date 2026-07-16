# Tappin

A location-based social app for real-time venue discovery and matching. See which bars and venues are busy right now, tap in, and connect with people who are actually there.


> **Status:** In active development. Core map, venue data, and social layer are working; auth flows and notifications are in progress.

## What it does

- **Live venue heatmap** — browse nearby venues scored by real-time check-in activity, so you can see where people actually are before you go
- **Tap In** — check into a venue and become visible to others there
- **People at Venue** — see who else has tapped in, with dynamic profiles and photos
- **Match confirmation** — mutual interest flow before any contact
- **Tonight** — a curated view of what's happening in the area

## Architecture

Serverless backend on AWS, cross-platform mobile client in React Native.

```
React Native (Expo Router)
        |
   API Gateway  ──  HTTP  ──>  Lambda (Node.js 22.x)  ──>  RDS PostgreSQL
        |                              |
   WebSocket                      S3 (photos)
                                       |
                             Foursquare Places API
```

| Layer | Technology |
|---|---|
| Client | React Native, Expo Router, TypeScript |
| API | API Gateway (HTTP + WebSocket), JWT authorizer |
| Compute | AWS Lambda (Node.js 22.x) |
| Database | Amazon RDS (PostgreSQL) |
| Auth | Amazon Cognito |
| Storage | Amazon S3 |
| Secrets | AWS Secrets Manager |
| Venue data | Foursquare Places API |

### Venue data and heatmap

`getNearbyVenues()` queries the Foursquare Places API for venues near the user's
coordinates, joins them against live check-in counts in PostgreSQL, and returns a
heatmap score per venue:

```json
{
  "id": "...",
  "foursquare_id": "...",
  "name": "...",
  "lat": 39.95,
  "lng": -75.16,
  "heatmap_score": 0.72,
  "heatmap_color": "#FF6B35",
  "going_count": 14,
  "arrived_count": 9
}
```

The map polls every 5 minutes and falls back to preview data when the live feed is
unavailable, so the UI never renders empty.

## Project structure

```
app/          Expo Router screens (map, tonight, venue/[id], profile)
components/   Shared UI components
constants/    Config and design tokens
services/     API client, auth, and data-fetching layer
```

## Running locally

```bash
npm install
npx expo start
```

Requires an `.env` with the API base URL. Backend credentials are managed through
AWS Secrets Manager and are not committed to this repo.

## Roadmap

- [x] Serverless backend (Lambda, API Gateway, RDS, S3, Cognito)
- [x] Foursquare Places integration
- [x] Live venue heatmap with check-in scoring
- [x] Tap In, match confirmation, photo upload, dynamic profiles
- [X] Phone verification (Twilio OTP)
- [ ] Registration and onboarding flow
- [ ] Push notifications
- [ ] Events feed
- [ ] TestFlight beta
