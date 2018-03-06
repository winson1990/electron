/// <reference path="../slimcore.d.ts" />
/// <reference path="../video-renderer.d.ts" />
'use strict';
const events_1 = require("events");
const SET_VIDEO_PREFERENCE_DEBOUNCE_TIMEOUT = 1000;
// -----------------------------------------------------------------------------
class NoopLogger {
    createChild() { return this; }
    log() { }
    debug() { }
    info() { }
    warn() { }
    error() { }
}
class LoggerProxy {
    constructor(_context, _logger, _frameSink) {
        this._context = _context;
        this._logger = _logger;
        this._frameSink = _frameSink;
    }
    log(message) {
        this._logger.log(message);
        this._log(0 /* Default */, message);
    }
    debug(message) {
        this._logger.debug(message);
        this._log(1 /* Debug */, message);
    }
    info(message) {
        this._logger.info(message);
        this._log(2 /* Info */, message);
    }
    warn(message) {
        this._logger.warn(message);
        this._log(3 /* Warning */, message);
    }
    error(message) {
        this._logger.error(message);
        this._log(4 /* Error */, message);
    }
    _log(level, message) {
        try {
            if (this._frameSink.log) {
                this._frameSink.log(level, `${this._context}: ${message}`);
            }
        }
        catch (error) {
        }
    }
}
// -----------------------------------------------------------------------------
class VideoRendererBase extends events_1.EventEmitter {
    constructor(_frameSink, logger) {
        super();
        this._frameSink = _frameSink;
        this._videoWidth = 0;
        this._videoHeight = 0;
        this._cleanupHandlers = [];
        this._pendingTimeout = null;
        let context = `${this.constructor.name} #${VideoRendererBase.getUniqueId()}`;
        let childLogger = (logger || new NoopLogger()).createChild(context);
        this._logger = new LoggerProxy(context, childLogger, _frameSink);
    }
    static getUniqueId() {
        return ++VideoRendererBase._counter;
    }
    getFrameSink() {
        return this._frameSink;
    }
    getVideoSize() {
        return {
            'width': this._videoWidth,
            'height': this._videoHeight,
        };
    }
    _addEventListener(element, type, listener) {
        element.addEventListener(type, listener);
        this._cleanupHandlers.push(() => element.removeEventListener(type, listener));
    }
    _setVideoPreference(width, height) {
        if (this._pendingTimeout) {
            clearTimeout(this._pendingTimeout);
        }
        let handler = () => {
            this._pendingTimeout = null;
            this._logger.debug(`setVideoPreference: ${width} x ${height}`);
            this._frameSink.setVideoPreference(width, height);
        };
        this._pendingTimeout = setTimeout(handler, SET_VIDEO_PREFERENCE_DEBOUNCE_TIMEOUT);
    }
    _updateVideoSize(videoWidth, videoHeight) {
        if (this._videoWidth !== videoWidth || this._videoHeight !== videoHeight) {
            this._videoWidth = videoWidth;
            this._videoHeight = videoHeight;
            this._logger.debug(`video-size-changed: ${videoWidth} x ${videoHeight}`);
            this.emit('video-size-changed', this.getVideoSize());
        }
    }
    dispose() {
        if (this._cleanupHandlers) {
            this._cleanupHandlers.forEach((handler) => handler());
        }
        if (this._pendingTimeout) {
            clearTimeout(this._pendingTimeout);
        }
        if (this._frameSink) {
            this._frameSink.dispose();
        }
        delete this._videoWidth;
        delete this._videoHeight;
        delete this._cleanupHandlers;
        delete this._logger;
        delete this._frameSink;
        delete this._pendingTimeout;
    }
}
VideoRendererBase._counter = 0;
exports.VideoRendererBase = VideoRendererBase;
// -----------------------------------------------------------------------------
function getScalingMode(mode) {
    switch (mode) {
        case 0 /* Stretch */:
            return 'stretch';
        case 1 /* Crop */:
            return 'crop';
        case 2 /* Fit */:
            return 'fit';
        default:
            return undefined;
    }
}
exports.getScalingMode = getScalingMode;
function logEvent(logger, event) {
    switch (event.level) {
        case 0 /* Default */:
            logger.log(event.message);
            break;
        case 1 /* Debug */:
            logger.debug(event.message);
            break;
        case 2 /* Info */:
            logger.info(event.message);
            break;
        case 3 /* Warning */:
            logger.warn(event.message);
            break;
        case 4 /* Error */:
            logger.error(event.message);
            break;
        default:
    }
}
exports.logEvent = logEvent;
