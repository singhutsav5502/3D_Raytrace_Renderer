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
}