const streamDeckApi = require('./lib/stream-deck-api')

let streamDeck = streamDeckApi.getStreamDeck()
streamDeck.reset()


streamDeck.drawText('TCN ', 'green', 1,'black');
streamDeck.drawText(':TCN ', 'green',2,'black');

streamDeck.drawText('HSEL', 'green',3,'black');
streamDeck.drawText(':HSEL', 'green',4,'black');

/*
streamDeck.drawTextFile('lakalala', 2);
streamDeck.drawImageFile('./images/nyancat.png', 1)

streamDeck.on('down', (buttonNumber) => {
  streamDeck.drawImageFile('./images/nyancat.png', buttonNumber)
})

streamDeck.on('up', (buttonNumber) => {
  streamDeck.drawColor(0x000000, buttonNumber)
})

streamDeck.on('state', (state) => {
  console.log(state) // eslint-disable-line no-console
})
*/
process.on('SIGINT', () => {
  streamDeck.reset()
  process.exit()
});
