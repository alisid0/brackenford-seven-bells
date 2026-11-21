# Stages

Written by `tools/stage-table.mjs` from `src/game.js` and `src/config.json`. Do not edit by hand.

All 29 stages are kept in the game. The release plays 17 of them, in the order set by `order` in `src/config.json`; changing that list is all it takes to reorder, add or drop a stage. Distances are from the shooting line. Wind is in metres a second.

| # | Name | Arrows | Wind | Targets | Place in release |
|---|---|---|---|---|---|
| 1 | First marks | 5 | none | 10 m, size 1.2 | 1 |
| 2 | Stepping back | 6 | none | 15 m, 2.5 m left, size 1.2; 20 m, 2.5 m right, size 1.2 | 2 |
| 3 | The drop | 6 | none | 30 m, size 1.4 | 3 |
| 4 | Three ranges | 6 | none | 15 m, 4 m left, size 1.1; 30 m, size 1.4; 45 m, 4 m right, size 1.8 | 8 |
| 5 | The long lane | 6 | none | 60 m, size 2.4 | held back |
| 6 | A breeze | 6 | 3 right | 20 m, size 1.2 | 5 |
| 7 | Crosswind | 6 | 5 left | 30 m, size 1.5 | 11 |
| 8 | Sliding mark | 6 | none | 15 m, size 1.2, sliding | 6 |
| 9 | Slide and breeze | 6 | 3 right | 25 m, size 1.4, sliding | held back |
| 10 | Pop-ups | 8 | none | 14 m, 4 m left, size 1.1, pop-up (3 s up); 18 m, size 1.2, pop-up (3 s up); 22 m, 4 m right, size 1.3, pop-up (3 s up) | 9 |
| 11 | Far and small | 6 | none | 40 m, size 1.1 | held back |
| 12 | Gusts | 6 | calm, gusts to 6 | 35 m, size 1.6 | held back |
| 13 | Quick marks | 8 | none | 12 m, 3 m left, size 1, pop-up (1.8 s up); 16 m, 3 m right, size 1, pop-up (1.8 s up); 20 m, size 1.1, pop-up (1.8 s up) | held back |
| 14 | Crossing pair | 8 | none | 18 m, size 1.2, sliding; 26 m, size 1.4, sliding | 13 |
| 15 | Long wind | 6 | 5 right | 60 m, size 2.4 | held back |
| 16 | The gauntlet | 9 | 2 right | 15 m, 4.5 m left, size 1.1; 24 m, size 1.3, sliding; 32 m, 4 m right, size 1.5, pop-up (2.5 s up) | 15 |
| 17 | Small bull | 6 | none | 20 m, size 0.65 | held back |
| 18 | Storm lane | 7 | 2 right, gusts to 7 | 45 m, size 1.9 | held back |
| 19 | Far slider | 7 | none | 50 m, size 2.1, sliding | held back |
| 20 | Master of the line | 8 | 3 left, gusts to 5 | 70 m, size 2.6, sliding; 35 m, 5 m left, size 1.3, pop-up (2.5 s up) | held back |
| 21 | First shade | 5 | none | sitting hare at 14 m, returns after 4 s | 4 |
| 22 | The warren | 7 | none | sitting hare at 12 m, returns after 6 s; sitting hare at 18 m, returns after 6 s; sitting hare at 24 m, returns after 6 s; sitting hare at 30 m, returns after 6 s | 7 |
| 23 | Horns in the grass | 7 | none | hare hidden in grass at 13 m; hare hidden in grass at 19 m; hare hidden in grass at 25 m | 10 |
| 24 | Creepers | 8 | none | creeping hare between 15, 15, 15 m; creeping hare between 23, 23, 23 m | 14 |
| 25 | Bolt | 9 | none | running hare roaming 13-19 m; running hare roaming 20-28 m; running hare roaming 12-24 m | held back |
| 26 | On the post | 7 | none | perched flyer at 14 m, returns after 5 s; perched flyer at 20 m, returns after 5 s; perched flyer at 27 m, returns after 5 s | 12 |
| 27 | Flush | 8 | none | flyer hidden in a bush at 13 m; flyer hidden in a bush at 18 m; flyer hidden in a bush at 24 m | 16 |
| 28 | Flight line | 10 | 3 right | crossing flyer over 15 m; crossing flyer over 21 m; crossing flyer over 27 m | held back |
| 29 | Blighted meadow | 10 | none | sitting hare at 13 m, returns after 5 s; hare hidden in grass at 19 m; running hare roaming 20-27 m; perched flyer at 16 m, returns after 5 s; crossing flyer over 24 m | 17 |

## Release order

1. First marks (stage 1)
2. Stepping back (stage 2)
3. The drop (stage 3)
4. First shade (stage 21)
5. A breeze (stage 6)
6. Sliding mark (stage 8)
7. The warren (stage 22)
8. Three ranges (stage 4)
9. Pop-ups (stage 10)
10. Horns in the grass (stage 23)
11. Crosswind (stage 7)
12. On the post (stage 26)
13. Crossing pair (stage 14)
14. Creepers (stage 24)
15. The gauntlet (stage 16)
16. Flush (stage 27)
17. Blighted meadow (stage 29)
