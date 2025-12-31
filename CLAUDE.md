# Bonaken Development Instructions

## Full Specification
See `spec.md` for the complete application specification including:
- Detailed game rules (Leimuiden variant)
- Technical architecture requirements
- User interface flows
- Edge cases and scoring rules
- All Dutch UI text requirements

## Tech Stack
- Backend: Node.js + Socket.io + TypeScript
- Frontend: React + Vite + TypeScript
- No database - in-memory state only
- Dutch language only

## Project Structure
```
/bonaken
├── /client          # React frontend (Vite + TypeScript)
├── /server          # Node.js backend (Socket.io + TypeScript)
├── /shared          # Shared types between client/server
└── package.json     # Root monorepo config
```

## Implementation Plan
See `implementation_plan.md` for detailed phase checkboxes.
After completing each phase:
1. Check off all items in implementation_plan.md
2. Update the "Completed Features" list below
3. Commit with detailed message

## Development Workflow
1. Test each feature in browser using Chrome DevTools
2. Iterate until feature works correctly
3. Commit with detailed Dutch message describing the feature
4. Update implementation_plan.md checkboxes
5. Update this file with completed features

## Completed Features
- [x] Fase 1: Project Setup
- [x] Fase 2: Lobby System
- [ ] Fase 3: Card System
- [ ] Fase 4: Bonaken Phase
- [ ] Fase 5: Trump Selection
- [ ] Fase 6: Trick-Taking
- [ ] Fase 7: Scoring
- [ ] Fase 8: Game End/Rematch
- [ ] Fase 9: Disconnect Handling
- [ ] Fase 10: Visual Polish
- [ ] Fase 11: Cleanup/Stability
- [ ] Fase 12: Final Testing

## Game Rules Reference
- 32 cards (7,8,9,10,B,V,K,A x 4 suits)
- 2-7 players
- Trump ranking: B > 9 > A > 10 > K > V > 8 > 7
- Bonaken = must win majority of tricks
- First to 10 points loses

## Frontend Design
Use the frontend-design skill for all UI components
