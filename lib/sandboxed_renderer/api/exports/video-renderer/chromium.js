/// <reference path="../slimcore.d.ts" />
/// <reference path="../video-renderer.d.ts" />
'use strict';
const common_1 = require("./common");
class ChromiumVideoRenderer extends common_1.VideoRendererBase {
    constructor(args, frameSink) {
        super(frameSink, args.logger);
        this._videoElement = null;
        this._rendererWidth = 0;
        this._rendererHeight = 0;
        this._logger.debug('constructor');
        this._initialize(args);
    }
    dispose() {
        this._logger.debug(`dispose`);
        if (this._videoElement) {
            this._videoElement.remove();
            let videoElement = this._videoElement;
            setTimeout(() => { videoElement.src = ''; }, 0);
        }
        delete this._videoElement;
        delete this._rendererWidth;
        delete this._rendererHeight;
        super.dispose();
    }
    getRendererType() {
        return 4 /* Chromium */;
    }
    setScalingMode(mode) {
        this._logger.debug(`setScalingMode: ${mode}`);
        this._videoElement.scalingMode = common_1.getScalingMode(mode);
        return Promise.resolve();
    }
    get _pepperFrameSink() {
        return this._frameSink;
    }
    _initialize(args) {
        this._videoElement = this._createVideoElement(args);
        args.container.appendChild(this._videoElement);
        this._handleEvent('error', (event) => this._logError(event));
        this._handleEvent('resize', () => this._checkVideoSize());
        this._handleEvent('msLogEvent', (event) => common_1.logEvent(this._logger, event));
        this._handleEvent('msRendererSizeChanged', () => this._checkRendererSize());
        this._videoElement.loadSync(this._pepperFrameSink.getBufferName());
        this._videoElement.bufferSharingEnabled = !!args.useBufferSharing;
    }
    _handleEvent(type, listener) {
        // tslint:disable-next-line:no-any
        return this._addEventListener(this._videoElement, type, listener);
    }
    _createVideoElement(args) {
        let document = args.container.ownerDocument;
        let video = document.createElement('skypevideo');
        video.style.backgroundColor = args.transparent ? '' : 'black';
        video.style.width = '100%';
        video.style.height = '100%';
        video.scalingMode = common_1.getScalingMode(args.scalingMode);
        return video;
    }
    _logError(event) {
        if (event instanceof ErrorEvent) {
            this._logger.error(`error: ${event.message}`);
        }
        else {
            this._logger.error(`error: ${formatMediaError(this._videoElement.error)}`);
        }
    }
    _checkVideoSize() {
        let videoWidth = this._videoElement.videoWidth;
        let videoHeight = this._videoElement.videoHeight;
        this._updateVideoSize(videoWidth, videoHeight);
    }
    _checkRendererSize() {
        let scale = window.devicePixelRatio || 1;
        let rendererWidth = Math.floor(this._videoElement.rendererWidth * scale) || 0;
        let rendererHeight = Math.floor(this._videoElement.rendererHeight * scale) || 0;
        if (this._rendererWidth !== rendererWidth || this._rendererHeight !== rendererHeight) {
            this._rendererWidth = rendererWidth;
            this._rendererHeight = rendererHeight;
            this._setVideoPreference(rendererWidth, rendererHeight);
        }
    }
}
exports.ChromiumVideoRenderer = ChromiumVideoRenderer;
function formatMediaError(error) {
    if (!error) {
        return undefined;
    }
    switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
            return 'MEDIA_ERR_ABORTED';
        case MediaError.MEDIA_ERR_NETWORK:
            return 'MEDIA_ERR_NETWORK';
        case MediaError.MEDIA_ERR_DECODE:
            return 'MEDIA_ERR_DECODE';
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
        default:
            return undefined;
    }
}
// -----------------------------------------------------------------------------
function createChromiumVideoRenderer(frameSink, args) {
    return new ChromiumVideoRenderer(args, frameSink);
}
exports.createChromiumVideoRenderer = createChromiumVideoRenderer;
function isChromiumVideoRendererAvailable() {
    return typeof HTMLSkypeVideoElement === 'function' && HTMLSkypeVideoElement.API_VERSION === 2;
}
exports.isChromiumVideoRendererAvailable = isChromiumVideoRendererAvailable;
