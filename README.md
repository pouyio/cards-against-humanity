# [Cards Against Humanity](https://cards-against-humanity.fly.dev/)

Simple real-time implementation of [Cards Against Humanity](https://www.cardsagainsthumanity.com/) (*the game for horrible people*).
Choose a nickname in a room and **start playing**.

Made with:
- ~~Node~~ go
- ~~Socket io~~ Native websockets
- React

## Development

Use Node.js 26.11.1 or newer. With [nvm](https://github.com/nvm-sh/nvm), run
`nvm use`, then install dependencies with `npm ci`. Start the client dev
server with `npm run dev` and create a production client bundle with
`npm run build:client`.

## To-Do
- [x] Keep session on local storage.
- [ ] Manage cards to avoid duplicates.
- [ ] UI/UX
- [ ] Add timeouts to websockets
- [ ] Store cards in a DB?
- [ ] Clean up go code
