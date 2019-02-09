'use strict';
const EventEmitter = require('events')
const jimp = require('jimp');
const throttleFn = require('lodash.throttle')
const pageData = require('./page-data')
const buttonConverter = require('./button-converter')

const THROTTLE_TIME = 200
const BUTTON_COUNT = 15
const ICON_SIZE = 72
const RESET_DATA = [0x0B, 0x63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const BRIGHTNESS_DATA = [0x05, 0x55, 0xAA, 0xD1, 0x01, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

class StreamDeck extends EventEmitter {
    /**
     * Create a StreamDeck instance.
     * @param {Object} device - device instance returned from new HID.HID({ ... })
     * @param {String} HID path to the device
     */
    constructor(device, path) {
        super()
        this.path = path
        this._device = device
        this._previousButtonState = new Array(15).fill(0)
        this._setupButtonListener()
        this._cache = {}
        this._buttonState = {}
        this.setMaxListeners(BUTTON_COUNT);

        // Create a key for each button with an initial value set to 0.
        for (let i = 1; i <= BUTTON_COUNT; i++) {
            this._buttonState[i] = 0
        }
    }

    /**
     * Reset the Stream Deck. Clears all the buttons and shows the Elgato logo wallpaper.
     */
    reset() {
        this._device.sendFeatureReport(RESET_DATA)
    }

    /**
     * Set the backlight brightness of the Stream Deck.
     * @param {Integer|0-100} brightness - brightness to set the backlight brightness to, between 0 and 100. 7 and below
     * will turn off the backlight, and 90 and above will be at maximum brightness.
     */
    setBrightness(brightness) {
        BRIGHTNESS_DATA[5] = brightness
        this._device.sendFeatureReport(BRIGHTNESS_DATA)
    }

    /**
     * Remove all button listeners. Handy for doing things like implementing pages, where you want all button listeners on
     * the previous page to get removed.
     */
    removeButtonListeners() {
        this.removeAllListeners()
    }

    /**
     * Draw a solid color to a button.
     * @param {Integer} hexColor - hex color of image, i.e. 0xFF0000 for red
     * @param {Integer} buttonNumber - button to fill the color with
     */
    drawColor(hexColor, buttonNumber) {
        let colors = Jimp.intToRGBA(hexColor)
        // Because there's no alpha channel for hexColor, Jimp.intToRGBA() will offset each color by one place so that
        // [colors.g, colors.b, colors.a] are actually [R, G, B].
        let color = Buffer.from([colors.g, colors.b, colors.a])
        let buffer = Buffer.alloc(ICON_SIZE * ICON_SIZE * 3, color)
        this.drawImageBuffer(buffer, buttonNumber, false)
    }

    /**
     * Draw an image to a button given a file path.
     * @param {String} filePath - path to an image file
     * @param {Integer} buttonNumber - button to draw the image to
     * @returns {Promise} Promise for the image draw operation
     */
    drawImageFile(filePath, buttonNumber) {
        let cachedImageBuffer = this._cache[filePath]

        return new Promise((resolve, reject) => {
            if (cachedImageBuffer) {
                this.drawImageBuffer(cachedImageBuffer, buttonNumber)
                resolve(cachedImageBuffer)
            } else {
                Jimp.read(filePath, (error, image) => {
                    if (error) {
                        reject(error)
                    } else {
                        image.contain(ICON_SIZE, ICON_SIZE)
                        this.drawImageBuffer(image.bitmap.data, buttonNumber)

                        this._cache[filePath] = image.bitmap.data
                        resolve(image.bitmap.data)
                    }
                })
            }
        })
    }

    /**
     * Draw an image from a buffer to a button.
     * @param {Buffer} imageBuffer - buffer containing the RGB bytes of an image
     * @param {Integer} buttonNumber - button to draw the image to
     * @param {Boolean} rgba - whether the image buffer array is in RGBA format or RGB format
     */
    drawImageBuffer(imageBuffer, buttonNumber, rgba = true) {
        let data = pageData.getPageData(imageBuffer, buttonNumber, rgba)
        this._deviceWrite(data, buttonNumber)
    }

    /**
     * Add a listener to an event, with additional options for throttling.
     * @param {String} eventName - event name
     * @param {Function} fn - function to execute as a callback to the event
     * @param {Object} options - options for the event listener, possible keys are { throttle, throttleTime, leading, trailing }
     * @example
     * streamDeck.on('down:1', () => {
     *   console.log('button 1 pressed');
     * }, {
     *   throttle: true // throttle the keypress so that the callback only fires once every x seconds
     *   throttleTime: 100 // time to wait between each callback
     *   leading: true // whether to trigger the callback immediately upon the event
     *   trailing: false // whether to wait until throttleTime has passed before triggering the callback
     * });
     * // NOTE: throttling is provided by lodash.throttle, see this documentation for more detail on how the throttling
     * // options work: https://lodash.com/docs/4.17.4#throttle
     *
     *
     */
    on(eventName, fn, {throttle = true, throttleTime = THROTTLE_TIME, leading = true, trailing = false} = {}) {
        if (throttle) {
            super.on(eventName, throttleFn(fn, throttleTime, {leading, trailing}))
        } else {
            super.on(eventName, fn)
        }
    }

    /**
     * Return the button state, an object of all the buttons and their pressed/released state
     * @returns {Object} an object where the key is the button number and the value is an integer indicating whether the
     * button is pressed (1) or released (0)
     */
    getButtonState() {
        return this._buttonState
    }

    /**
     * Write the image to the Stream Deck.
     * @params {Array} pixelBuffer - buffer of raw pixel bytes in BGR format
     * @params {buttonNumber} buttonNumber - button to draw the image to
     */
    _deviceWrite({page1Array, page2Array}) {
        this._device.write(page1Array)
        this._device.write(page2Array)
    }

    _setupButtonListener() {
        this._device.on('data', (data) => {
            // If this isn't report 1 (button states), don't do anything.
            if (data[0] != 1) {
                return
            }

            for (let i = 1; i <= BUTTON_COUNT; i++) {
                let buttonNumber = buttonConverter.rawToButton(i)
                let buttonState = data[i]
                this._buttonState[buttonNumber] = buttonState

                // If the button state changed, emit the proper events.
                if (buttonState != this._previousButtonState[i - 1]) {
                    this._previousButtonState[i - 1] = buttonState

                    if (buttonState) {
                        this.emit(`down:${buttonNumber}`)
                        this.emit('down', buttonNumber)
                    } else {
                        this.emit(`up:${buttonNumber}`)
                        this.emit('up', buttonNumber)
                    }
                }
            }

            this.emit('state', this._buttonState)
        })
    }


    writeSomething(){
        var result = this.writeText2();
        console.log('result: ' + result);
    }


    writeText2() {


        Jimp.read("imgages/testPNG.jpg").then(function(image) {
            Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(function(font) {
                image.resize(542, 767);
                image.print(font, 16, 22, 'some text');
                image.write('brain.jpg');
            });
        });


        /*

        Jimp.create('/images/testPNG.png').then(image =>{
            image

        });
        new Jimp({ data: buffer, width: 1280, height: 768 }, (err, image) => {
            // this image is 1280 x 768, pixels are loaded from the given buffer.
        });

        Jimp.create()
        const font = jimp.read(jimp.FONT_SANS_32_BLACK);
        const image = jimp.read(1000, 1000, 0x0000ffff);

        const textImage = this.createTextImage(320, 240, font, {text: 'This is only a test.', maxWidth: 100});
        textImage.write('/images/testPNG.png');
        */
        /*
        textImage.getBuffer(Jimp.AUTO, (err, buffer) => {
            return buffer;
        });
        */
    }

    async createTextImage(
        width,
        height,
        font,
        { x = 0, y = 0, text, maxWidth, maxHeight }
    ) {
        const loadedFont = await jimp.loadFont(font);
        const image = await Jimp.create(width, height, 0xffffffff);

        return image.print(loadedFont, x, y, text, maxWidth, maxHeight);
    }


    /**
     * Convert text-string to imagebuffer and write to provided button number
     *
     * @param textString
     * @param buttonNumber
     */
    writeText(textString, buttonNumber) {
        const font = PImage.registerFont(path.resolve(__dirname, 'fixtures/SourceSansPro-Regular.ttf'), 'Source Sans Pro');
        font.load(() => {
            console.log('Filling button #%d', keyIndex);

            const textString = `FOO #${keyIndex}`;
            const img = PImage.make(StreamDeck.ICON_SIZE, StreamDeck.ICON_SIZE);
            const ctx = img.getContext('2d');
            ctx.clearRect(0, 0, StreamDeck.ICON_SIZE, StreamDeck.ICON_SIZE); // As of v0.1, pureimage fills the canvas with black by default.
            ctx.font = '16pt "Source Sans Pro"';
            ctx.USE_FONT_GLYPH_CACHING = false;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(textString, 8, 60);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(textString, 8, 60);

            const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
                initialSize: 20736, // Start at what should be the exact size we need
                incrementAmount: 1024 // Grow by 1 kilobyte each time buffer overflows.
            });

            try {
                PImage.encodePNGToStream(img, writableStreamBuffer);

                // For some reason, adding an overlayWith command forces the final image to have
                // an alpha channel, even if we call .flatten().
                // To work around this, we have to overlay the image, render it as a PNG,
                // then put that PNG back into Sharp, flatten it, and render raw.
                // Seems like a bug in Sharp that we should make a test case for and report.
                const pngBuffer = sharp(path.resolve(__dirname, 'fixtures/github_logo.png'))
                    .resize(StreamDeck.ICON_SIZE, StreamDeck.ICON_SIZE)
                    .overlayWith(writableStreamBuffer.getContents())
                    .png()
                    .toBuffer();
                const finalBuffer = sharp(pngBuffer).flatten().raw().toBuffer();
                //streamDeck.fillImage(keyIndex, finalBuffer);
                streamDeck.drawImageBuffer(finalBuffer, buttonNumber);
            } catch (error) {
                console.error(error);
            }

            /*
        streamDeck.on('up', keyIndex => {
            // Clear the key when it is released.
            console.log('Clearing button #%d', keyIndex);
            streamDeck.clearKey(keyIndex);
        });

        streamDeck.on('error', error => {
            console.error(error);
        });
        */
        });
    }

}

module.exports = StreamDeck
