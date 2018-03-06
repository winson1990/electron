/// <reference path="../slimcore.d.ts" />
/// <reference path="../video-renderer.d.ts" />
'use strict';
const events_1 = require("events");
const common_1 = require("./common");
const pepper_info_1 = require("./pepper-info");
// -----------------------------------------------------------------------------
function generateUniqueID() {
    return Math.random().toString(16).slice(2);
}
function generateCookie() {
    return generateUniqueID() + '@' + Date.now();
}
function invokeMethod(embed, method, args) {
    return new Promise((resolve, reject) => {
        if (!embed.postMessage) {
            throw new Error('Pepper plugin not loaded');
        }
        let cookie = generateCookie();
        let timeout = 1000;
        let timerID = null;
        let handler = (event) => {
            let msg = event.data;
            if (msg.cookie === cookie) {
                clearTimeout(timerID);
                embed.removeEventListener('message', handler);
                if (!('error' in msg)) {
                    resolve(msg.result);
                }
                else {
                    reject(msg.error);
                }
            }
        };
        let timeoutHandler = () => {
            embed.removeEventListener('message', handler);
            reject(new Error('Invoke Timeout'));
        };
        timerID = setTimeout(timeoutHandler, timeout);
        embed.addEventListener('message', handler);
        let message = {
            'cookie': cookie,
            'method': method,
            'args': args || {},
        };
        embed.postMessage(message);
    });
}
class PepperVideoRenderer extends common_1.VideoRendererBase {
    constructor(args, frameSink) {
        super(frameSink, args.logger);
        this._embed = null;
        this._embedEvents = new events_1.EventEmitter();
        this._logger.debug('constructor');
        this._initialize(args);
    }
    dispose() {
        this._logger.debug(`dispose`);
        if (this._embed) {
            this._embed.remove();
        }
        if (this._embedEvents) {
            this._embedEvents.removeAllListeners();
        }
        delete this._embed;
        delete this._embedEvents;
        super.dispose();
    }
    getRendererType() {
        return 3 /* Pepper */;
    }
    setScalingMode(mode) {
        this._logger.debug(`setScalingMode: ${mode}`);
        return invokeMethod(this._embed, 'setScalingMode', {
            'mode': common_1.getScalingMode(mode),
        })
            .catch((error) => {
            this._logger.error(`setScalingMode failed: ${error}`);
            throw error;
        });
    }
    get _pepperFrameSink() {
        return this._frameSink;
    }
    _initialize(args) {
        this._embed = this._createEmbed(args);
        args.container.appendChild(this._embed);
        this._addEventListener(this._embed, 'message', (event) => {
            let msg = event.data;
            if (msg.event) {
                this._embedEvents.emit(msg.event, msg.args);
            }
        });
        this._embedEvents.on('log-event', (args) => {
            common_1.logEvent(this._logger, args);
        });
        this._embedEvents.on('window-size-changed', (args) => {
            this._setVideoPreference(args.width, args.height);
        });
        this._embedEvents.on('video-size-changed', (args) => {
            this._updateVideoSize(args.width, args.height);
        });
    }
    _createEmbed(args) {
        let document = args.container.ownerDocument;
        let embed = document.createElement('embed');
        embed.setAttribute('type', pepper_info_1.RendererMimeType);
        embed.setAttribute('scaling-mode', common_1.getScalingMode(args.scalingMode));
        embed.setAttribute('transparent', args.transparent ? 'true' : 'false');
        embed.setAttribute('buffer-name', this._pepperFrameSink.getBufferName());
        embed.style.width = '100%';
        embed.style.height = '100%';
        return embed;
    }
}
exports.PepperVideoRenderer = PepperVideoRenderer;
// -----------------------------------------------------------------------------
function createPepperVideoRenderer(frameSink, args) {
    return new PepperVideoRenderer(args, frameSink);
}
exports.createPepperVideoRenderer = createPepperVideoRenderer;
function isPepperVideoRendererAvailable() {
    let entry = navigator.mimeTypes[pepper_info_1.RendererMimeType];
    return !!(entry && entry.enabledPlugin);
}
exports.isPepperVideoRendererAvailable = isPepperVideoRendererAvailable;
