class Image {
    constructor(w, h, isVisible) {
        this.w = w;
        this.h = h;
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('width', this.w);
        this.canvas.setAttribute('height', this.h);
        this.context = this.canvas.getContext('2d');
        this.imageData = this.context.getImageData(0, 0, this.w, this.h);
        this.pixels = this.imageData.data;
        this.canvas.style.display = isVisible ? "block" : "none"
        // Ensure the canvas is only appended once
        document.querySelector('body').appendChild(this.canvas);
    }

    putPixel(x, y, color, opacity = 1) {
        const offset = (y * this.w + x) * 4;
        this.pixels[offset] = color.r | 0;
        this.pixels[offset + 1] = color.g | 0;
        this.pixels[offset + 2] = color.b | 0;
        this.pixels[offset + 3] = opacity * 255;
    }
    clear() {
        // Fill all pixel data with zeros (transparent black)
        for (let i = 0; i < this.pixels.length; i += 4) {
            this.pixels[i] = 0; // Red
            this.pixels[i + 1] = 0; // Green
            this.pixels[i + 2] = 0; // Blue
            this.pixels[i + 3] = 0; // Alpha (transparent)
        }

        // Update the canvas context with the cleared pixel data
        this.context.putImageData(this.imageData, 0, 0);
    }

}