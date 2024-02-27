
//  canvas dimensions
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const GLOBALS = {
  ia: 0.4,
}
const SCENE = {
  objectsInScene: [],
  numberOfSpheres: 3,
  camera: new Vector3(0, 0, 2),
  imagePlane: {
    topLeft: new Vector3(-1.52, 0.86, -0.5),
    topRight: new Vector3(1.52, 0.86, -0.5),
    bottomLeft: new Vector3(-1.52, -0.86, -0.5),
    bottomRight: new Vector3(1.52, -0.86, -0.5)
  },
  lighting: {
    ambientLight: new ambientLight(new Color(Math.random(), Math.random(), Math.random()), GLOBALS.ia),
    pointLights: [
      new pointLight(
        WIDTH, // x 
        HEIGHT/2,// y
        -200, // z
        0.8, // id
        0.4, // is
      )
    ]
  },


  setupObjects: function () {
    for (let i = 1; i <= this.numberOfSpheres; i++) {
      const sphereInstance = new Sphere(
        Math.floor((Math.random() - 1 / 2) * 60), // x
        Math.floor(((Math.random() - 1 / 2) * 80)), // y
        Math.floor(Math.random() * 200 - (Math.random() + 500) * (1 / 2)), // z
        Math.floor((Math.random()) * 15)) // radius

      sphereInstance._setColor(new Color(Math.random(), Math.random(), Math.random())) // color

      sphereInstance._setMaterial(
        new Material(
          {
            r: Math.random(),
            g: Math.random(),
            b: Math.random(),
          }, // ka
          Math.random() + 0.2, // kd
          Math.random(), // ks
          Math.random() + 0.2 // alpha
        )
      )

      this.objectsInScene.push(sphereInstance);
    }
  }
};

class RayTracer {


  constructor(scene, w, h) {
    this.scene = scene
    this.w = w
    this.h = h
  }

  findIntersectingSphere(ray, camera, center, radius) {
    // Calculat
    const a = Vector3.dotProduct(ray.direction, ray.direction)
    const b = 2 * Vector3.dotProduct(camera.minus(center), ray.direction)
    const c = Vector3.dotProduct(camera.minus(center), camera.minus(center)) - radius * radius
    let D = ((b * b) - (4 * a * c))

    //  NO REAL ROOTS
    if (D < 0) return { found: false, parameter: null };
    // Real roots make sure t>=1 so that intersection between image plane and camera are not considered
    D = Math.sqrt(D)
    const t1 = (-1 * b + D) / (2 * a) >= 1 ? (-1 * b + D) / (2 * a) : false;
    const t2 = (-1 * b - D) / (2 * a) >= 1 ? (-1 * b - D) / (2 * a) : false;
    //  make sure t>=1 considered
    if (t1 === false && t2 === false) return { found: false, parameter: null }
    else if (t1 === false) return { found: true, parameter: t2 };
    else if (t2 === false) return { found: true, parameter: t1 };
    else return { found: true, parameter: Math.min(t1, t2) }
  }
  createRay(x, y) {
    // create ray ( normalize coordinates to [0,1] for x , flip coordinates for y to start from bottom left)
    const xt = x / this.w;
    const yt = (this.h - y - 1) / this.h;
    //  calculate vector point for given coordinates based on 
    const top = Vector3.lerp(
      this.scene.imagePlane.topLeft,
      this.scene.imagePlane.topRight,
      xt
    )
    const bottom = Vector3.lerp(
      this.scene.imagePlane.bottomLeft,
      this.scene.imagePlane.bottomRight,
      xt
    )
    const point = Vector3.lerp(bottom, top, yt)
    const ray = new Ray(
      point,
      point.minus(this.scene.camera)
    )
    return ray;
  }
  tracedValueAtPixel(x, y) {
    const ray = this.createRay(x, y)
    // intersection logic
    const intersectionParameters = []
    // run intersection for each object in the scene per raycast
    // store intersection object index and distanceParameter in array
    SCENE.objectsInScene.forEach((sphere, index) => {
      const intersection = this.findIntersectingSphere(ray, SCENE.camera, sphere.center, sphere.radius)
      if (intersection.found === true) {
        intersectionParameters.push({ intersectionParameter: intersection.parameter, index })
      }
    })

    // use array to find closest intersection to camera
    let tracedColor = new Color(0, 0, 0)


    if (intersectionParameters.length > 0) {
      intersectionParameters.sort((a, b) => a.intersectionParameter - b.intersectionParameter)
      const sphereIndex = intersectionParameters[0].index
      // found closest intersection with SCENE.objectsInScene[sphereIndex]
      const intersectedSphere = SCENE.objectsInScene[sphereIndex]
      Object.assign(tracedColor, intersectedSphere.color)

      // // CONSIDER PHONG SHADING MODEL FOR COLOR
      const pointOfIntersection = SCENE.camera.plus(ray.direction)
      const normalVector = Vector3.normalize(pointOfIntersection.minus(intersectedSphere.center))


      SCENE.lighting.pointLights.forEach((pointLight) => {

        const lightVector = Vector3.normalize(pointLight.location.minus(pointOfIntersection))
        if (Vector3.dotProduct(normalVector, lightVector) > 0) {
          // when light and normal vector in similar directions
          const diffuseFactor = intersectedSphere.material.kd * pointLight.id * Vector3.dotProduct(normalVector, lightVector);
          const diffuseComponent = new Color(diffuseFactor, diffuseFactor, diffuseFactor)
          tracedColor = tracedColor._addColorComponent(diffuseComponent)
        }
      })


    }
    return tracedColor;
  }


}

//////////////////
// SCENE SETUP //
//////////////////
const image = new Image(WIDTH, HEIGHT);
document.image = image;
SCENE.setupObjects();

//  color vector stores values from 0 to 1 , convert into 0 to 255 range
const imageColorFromColor = color => ({
  r: Math.floor(color.r * 255),
  g: Math.floor(color.g * 255),
  b: Math.floor(color.b * 255)
});

const tracer = new RayTracer(SCENE, WIDTH, HEIGHT);

// for each pixel in the image plane run a ray trace and get corresponding color value for the pixel based on intersection detection
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    image.putPixel(x, y, imageColorFromColor(tracer.tracedValueAtPixel(x, y)));
  }
}

image.renderIntoElement(document.querySelector('body'));
