class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    plus(other) {
        return new Vector3(
            this.x + other.x,
            this.y + other.y,
            this.z + other.z
        )
    }
    scale(scalar) {
        return new Vector3(
            this.x * scalar,
            this.y * scalar,
            this.z * scalar
        )
    }
    minus(other) {
        return new Vector3(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z,
        )
    }
    static dotProduct(first, second) {
        return (first.x * second.x + first.y * second.y + first.z * second.z)
    }
    static magnitude(v) {
        return Math.sqrt((this.dotProduct(v, v)))
    }
    static normalize(v) {
        const magnitude = this.magnitude(v);
        return new Vector3(
            v.x / magnitude,
            v.y / magnitude,
            v.z / magnitude
        )
    }
    static lerp(start, end, factor) {
        return start.scale(1 - factor).plus(end.scale(factor));
    }

}

class Ray {
    constructor(origin, direction) {
        this.origin = origin
        this.direction = direction
    }
}