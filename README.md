# Meteor Multiplayer Temporary Matchmaking
Temporary accounts workaround with a lobbies collection and matchmaking using the accounts package.
Why? I wanted to see if the Streamy Sockets package could be used to play a simple client-side 2D multiplayer game with a friend.
<ol>
  <li>Prompts you for a name and uses it to create an account that gets deleted on disconnection.</li>
  <li>Finds you a lobby with space or creates a new one.</li>
  <li>Subscribes you to your lobby's game data and to it's Streamy Room to allow for websocket communication with other players.</li>
</ol>

I tested this out with a simple p5.js snake-like game.
There is also a leaderboard in the home page that shows data from the game.
