const streamDeckApi = require('./lib/stream-deck-api')

let streamDeck = streamDeckApi.getStreamDeck()
streamDeck.reset()


streamDeck.drawText('TCN ', 'green', 'black',1 , 200);
streamDeck.drawText(':TCN ', 'green','black', 2, 200);

streamDeck.drawText('HSEL', 'green','black', 6, 200);
streamDeck.drawText(':HSEL', 'green','black', 7, 200);

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
