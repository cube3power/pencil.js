import BaseEvent from "@pencil.js/base-event";
import Container from "@pencil.js/container";
import Component from "@pencil.js/component";
import MouseEvent from "@pencil.js/mouse-event";
import Position from "@pencil.js/position";
import { random } from "@pencil.js/math";

/**
 * Wrapper
 * @class
 * @extends Container
 */
export default class Scene extends Container {
    /**
     * Scene constructor
     * @param {HTMLElement} [container=document.body] - Container of the renderer
     * @param {SceneOptions} [options] - Specific options
     */
    constructor (container = document.body, options) {
        super(undefined, options);

        container.innerHTML = "";
        let canvas;
        if (container instanceof HTMLCanvasElement) {
            canvas = container;
        }
        else {
            canvas = document.createElement("canvas");
            container.appendChild(canvas);
        }
        canvas.style.display = "block";
        const measures = container.getBoundingClientRect();
        canvas.width = measures.width;
        canvas.height = measures.height;
        /**
         * @type {CanvasRenderingContext2D}
         */
        this.ctx = canvas.getContext("2d");

        /**
         * @type {Position}
         */
        this.center = new Position(this.width / 2, this.height / 2);
        /**
         * @type {Position}
         */
        this.containerPosition = new Position(measures.left + window.scrollX, measures.top + window.scrollY);

        this.isScene = true;
        /**
         * @type {Boolean}
         */
        this.isLooped = false;
        /**
         * @type {Number}
         */
        this.fps = 0;
        /**
         * @type {Number}
         */
        this.lastTick = null;

        this._listenForEvents();

        /**
         * @type {Boolean}
         */
        this.isReady = true;
    }

    /**
     * Bind window event and call them on targets (can't be called twice)
     */
    _listenForEvents () {
        if (this.isReady) {
            throw new EvalError("Can't rebind event a second time.");
        }

        let hovered = null;
        const listeners = {
            mousedown: target => target.isClicked = true,
            mousemove: (target, eventPosition) => {
                target.isClicked = false;
                if (target !== hovered) {
                    if (hovered) {
                        hovered.isHovered = false;
                        if (!hovered.isAncestorOf(target)) {
                            hovered.fire(new MouseEvent(hovered, "leave", eventPosition));
                        }
                    }
                    hovered = target;
                }
                if (!target.isHovered) {
                    target.isHovered = true;
                    target.fire(new MouseEvent(target, "hover", eventPosition));
                }
                this.setCursor(target.options.cursor);
            },
            mouseup: (target, eventPosition) => {
                if (target.isClicked) {
                    target.fire(new MouseEvent(target, "click", eventPosition));
                }
                target.isClicked = false;
            },
            mousewheel: (target, eventPosition, event) => {
                if (event.deltaY > 0) {
                    target.fire(new MouseEvent(target, "scrolldown", eventPosition))
                        .fire(new MouseEvent(target, "zoomout", eventPosition));
                }
                else if (event.deltaY < 0) {
                    target.fire(new MouseEvent(target, "scrollup", eventPosition))
                        .fire(new MouseEvent(target, "zoomin", eventPosition));
                }
            },
        };
        Object.keys(listeners).forEach((eventName) => {
            window.addEventListener(eventName, (event) => {
                const eventPosition = (new Position(event.clientX, event.clientY))
                    .subtract(this.containerPosition)
                    .add(window.scrollX, window.scrollY);
                const target = this.getTarget(eventPosition);
                if (target) {
                    target.fire(new MouseEvent(target, eventName, eventPosition));
                    listeners[eventName](target, eventPosition, event);
                }
            }, {
                passive: true,
            });
        });
    }

    /**
     *
     * @param {String} [cursor=Component.cursors.default] - Cursor string
     */
    setCursor (cursor = Component.cursors.default) {
        this.ctx.canvas.style.cursor = cursor;
    }

    /**
     * Draw the whole scene
     * @return {Scene} Itself
     */
    render () {
        const animationId = this.isLooped ? requestAnimationFrame(this.render.bind(this)) : null;

        this.clear();

        const now = performance.now();
        if (this.isLooped && this.lastTick) {
            this.fps = 1000 / (now - this.lastTick);
        }
        this.lastTick = now;

        this.fire(new BaseEvent(this, "draw"));
        try {
            return super.render(this.ctx);
        }
        catch (error) {
            cancelAnimationFrame(animationId);
            throw error;
        }
    }

    /**
     * Define if is hovered (always true on scene as a fallback)
     * @return {Boolean}
     */
    isHover () { // eslint-disable-line class-methods-use-this
        return true;
    }

    /**
     * Erase everything on scene
     */
    clear () {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        if (this.options.fill) {
            this.ctx.fillStyle = this.options.fill;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }
    }

    /**
     * Start to render the scene each frame
     */
    startLoop () {
        this.isLooped = true;
        this.render();
    }

    /**
     * Stop scene from being rendered
     */
    stopLoop () {
        this.isLooped = false;
        this.fps = 0;
    }

    /**
     * Hide the scene
     */
    hide () {
        this.ctx.canvas.style.visibility = "hidden";
    }

    /**
     * Show the scene
     */
    show () {
        this.ctx.canvas.style.visibility = "";
    }

    /**
     * Return this scene width
     * @returns {Number}
     */
    get width () {
        return this.ctx.canvas.width;
    }

    /**
     * Return this scene height
     * @returns {Number}
     */
    get height () {
        return this.ctx.canvas.height;
    }

    /**
     * Return a random position within the scene
     * @return {Position}
     */
    getRandomPosition () {
        return new Position(random(this.width), random(this.height));
    }

    /**
     * @typedef {Object} SceneOptions
     * @extends {ContainerOptions}
     * @prop {String} [fill=null] - Background of the scene
     * @prop {Number} [opacity=1] - Global opacity
     * @prop {String} [cursor=Component.cursors.defaultOptions] - Cursor on hover
     */
    /**
     * @return {SceneOptions}
     */
    static get defaultOptions () {
        return Object.assign(super.defaultOptions, {
            fill: null,
            opacity: 1,
            cursor: Component.cursors.defaultOptions,
        });
    }
}
