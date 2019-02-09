'use strict'

const streamDeckApi = require('./lib/stream-deck-api')

let streamDeck = streamDeckApi.getStreamDeck()
streamDeck.reset()


streamDeck.drawText('TCN', 'black', 'white',1);
streamDeck.drawText('AP', 'black','green',2);
streamDeck.drawText('HSEL', 'black','yellow',3);
streamDeck.drawText(':HSEL', 'black','pink',4);

streamDeck.drawText('12', 'black','orange',5);

streamDeck.drawText('TCN', 'white', 'black',6);
streamDeck.drawText('LP', 'white','black',7);
streamDeck.drawText('HSEL', 'white','black',8);
streamDeck.drawText(':HSEL', 'white','black',9);

streamDeck.drawText('23:30', 'white','black',10);



streamDeck.drawText('TCN', 'green', 'black',11);
streamDeck.drawText('LP', 'green','black',12);
streamDeck.drawText('HSEL', 'red','black',13);
streamDeck.drawText(':HSEL', 'blue','black',14);

streamDeck.drawText('A', 'green','black',15);

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
