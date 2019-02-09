const streamDeckApi = require('./lib/stream-deck-api')

let streamDeck = streamDeckApi.getStreamDeck()
streamDeck.reset()


streamDeck.drawText('TCN', 'black', 1,'white');
streamDeck.drawText('AP', 'black',2,'white');
streamDeck.drawText('HSEL', 'black',3,'white');
streamDeck.drawText(':HSEL', 'black',4,'white');

streamDeck.drawText('12', 'black',5,'white');

streamDeck.drawText('TCN', 'white', 6,'black');
streamDeck.drawText('LP', 'white',7,'black');
streamDeck.drawText('HSEL', 'white',8,'black');
streamDeck.drawText(':HSEL', 'white',9,'black');

streamDeck.drawText('23:30', 'white',10,'black');



streamDeck.drawText('TCN', 'green', 11,'black');
streamDeck.drawText('LP', 'green',12,'black');
streamDeck.drawText('HSEL', 'green',13,'black');
streamDeck.drawText(':HSEL', 'green',14,'black');

streamDeck.drawText('A', 'green',15,'black');

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
