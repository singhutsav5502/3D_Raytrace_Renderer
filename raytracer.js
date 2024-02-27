
//  canvas dimensions
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

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
    ambientLight: new ambientLight(
      new Color(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5),
      new Color(0, 0, 0),
    ),
    pointLights: [
      new pointLight(
        new Vector3(-3, -0.5, -100), // location
        new Color(0.8, 0.3, 0.3), // ia
        new Color(0.1, 0.1, 0.1) // is
      ),
      new pointLight(
        new Vector3(3, 2, -100), // location
        new Color(0.4, 0.4, 0.9), // ia 
        new Color(0.1, 0.1, 0.1) // is
      )
    ]
  },


  setupObjects: function () {
    for (let i = 1; i <= this.numberOfSpheres; i++) {
      const sphereInstance = new Sphere(
        Math.floor((Math.random() - 1 / 2) * 60), // x
        Math.floor(((Math.random() - 1 / 2) * 80)), // y
        Math.floor((Math.random()-100)),
        // Math.floor(Math.random() * 200 - (Math.random() + 500) * (1 / 2)), // z
        Math.floor((Math.random()) * 15)) // radius

      sphereInstance._setColor(new Color(Math.random(), Math.random(), Math.random())) // color

      sphereInstance._setMaterial(
        new Material(
          new Color(0.1, 0.1, 0.1),
          new Color(0.5, 0.5, 0.9),
          new Color(0.7, 0.7, 0.7),
          10// alpha
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

  findIntersectingSphere(ray, center, radius, shadowRay = false) {
    // Calculate
    const a = Vector3.dotProduct(ray.direction, ray.direction)
    const b = 2 * Vector3.dotProduct(ray.origin.minus(center), ray.direction)
    const c = Vector3.dotProduct(ray.origin.minus(center), ray.origin.minus(center)) - radius * radius
    let D = ((b * b) - (4 * a * c))

    //  NO REAL ROOTS
    if (D < 0) return { found: false, parameter: null };
    // Real roots make sure t>=1 so that intersection between image plane and camera are not considered
    D = Math.sqrt(D)
    const t1 = shadowRay ? ((-1 * b + D) / (2 * a) > 0 && (-1 * b + D) / (2 * a) < 1 ? (-1 * b + D) / (2 * a) : false) : ((-1 * b + D) / (2 * a) >= 1 ? (-1 * b + D) / (2 * a) : false);
    const t2 = shadowRay ? ((-1 * b - D) / (2 * a) > 0 && (-1 * b - D) / (2 * a) < 1 ? (-1 * b - D) / (2 * a) : false) : ((-1 * b - D) / (2 * a) >= 1 ? (-1 * b - D) / (2 * a) : false);
    //  make sure t>=1 considered for normal rays
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
      const intersection = this.findIntersectingSphere(ray, sphere.center, sphere.radius)
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
      // AMBIENT LIGHT
      tracedColor._addColorComponent(SCENE.lighting.ambientLight.color.multiply(SCENE.lighting.ambientLight.ia))

      // // CONSIDER PHONG SHADING MODEL FOR COLOR
      const pointOfIntersection = ray.origin.plus(ray.direction.scale(intersectionParameters[0].intersectionParameter))
      const normalVector = Vector3.normalize(pointOfIntersection.minus(intersectedSphere.center))


      SCENE.lighting.pointLights.forEach((pointLight) => {

        const lightVector = Vector3.normalize(pointLight.location.minus(pointOfIntersection))

        // CHECK IF POINT IS IN SHADOW OF ANOTHER OBJECT ( FOR THIS PARTICULAR LIGHT )
        const shadowRay = new Ray(pointOfIntersection, pointLight.location.minus(pointOfIntersection))

        let foundOverlap = false
        SCENE.objectsInScene.forEach((sphere) => {
          if (sphere !== intersectedSphere) {
            const intersection = this.findIntersectingSphere(shadowRay, sphere.center, sphere.radius, true)
            if (intersection.found === true) foundOverlap = true;
          }
        })
        if (foundOverlap === false) {


          const normalLightDotProduct = Vector3.dotProduct(normalVector, lightVector);
          if (normalLightDotProduct > 0) {
            // when light and normal vector in similar directions

            //////////////////////
            // DIFFUSE LIGHTING //
            //////////////////////

            const diffuseComponent = intersectedSphere.material.kd.multiply(pointLight.id).scale(normalLightDotProduct);
            tracedColor = tracedColor._addColorComponent(diffuseComponent)

            ///////////////////////
            // SPECULAR LIGHTING //
            ///////////////////////

            const reflectanceFactor = normalVector.scale(2 * normalLightDotProduct).minus(lightVector)
            const viewVector = Vector3.normalize(SCENE.camera.minus(pointOfIntersection))

            let specularComponent = intersectedSphere.material.ks.multiply(pointLight.is).scale(
              Math.pow(Vector3.dotProduct(reflectanceFactor, viewVector), intersectedSphere.material.alpha)
            )
            tracedColor = tracedColor._addColorComponent(specularComponent)
          }
        }
      })


    }
    Color.clampColors(tracedColor)
    return tracedColor;
  }


}

/////////////////
// SCENE SETUP //
/////////////////
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
