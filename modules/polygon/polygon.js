import Component from "@pencil.js/component";
import Position from "@pencil.js/position";
import Vector from "@pencil.js/vector";

/**
 * Polygon class
 * @class
 * @extends Component
 */
export default class Polygon extends Component {
    /**
     * Polygon constructor
     * @param {Array<PositionDefinition>} points - Set of vertices defining the polygon
     * @param {ComponentOptions} options - Drawing options
     */
    constructor (points, options) {
        if (points.length < 3) {
            throw new RangeError(`A polygon can't have less than 3 vertices, but only ${points.length} given.`);
        }

        const positions = points.map(point => Position.from(point));
        super(positions[0], options);

        /**
         * @type {Array<Position>}
         */
        this.points = positions;
    }

    /**
     * Draw the polygon
     * @param {Path2D} path - Current drawing path
     * @return {Polygon} Itself
     */
    trace (path) {
        this.points.forEach((point) => {
            path.lineTo(point.x - this.position.x, point.y - this.position.y);
        });
        path.closePath();
        return this;
    }

    /**
     * @inheritDoc
     * FIXME
     */
    isHover (position) {
        if (super.isHover(position)) {
            const testVector = new Vector(position.clone(), position.clone().add(Infinity, 0));
            let intersection = 0;
            for (let i = 1, l = this.points.length; i < l; ++i) {
                if (testVector.intersect(new Vector(this.points[i - 1], this.points[i]))) {
                    ++intersection;
                }
            }
            return Boolean(intersection % 2);
        }

        return false;
    }
}
