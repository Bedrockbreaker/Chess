# YggdrasilEngine
A chess engine designed to run as many variations of Fairy chess as possible.

## How it works
- A core engine runs the internal mechanics.
- New pieces and functionality are added via "plugins" which extend the engine.
- Moves made during a game can be (de)serialized, allowing saving and replaying of games later.
- A frontend has been written to quickly view simulated games.
