var canvas = document.getElementById("renderCanvas");

document.getElementById("saveButton").addEventListener("click", function () {
    // Get the canvas data as a PNG image
    var dataURL = canvas.toDataURL("image/png");

    // Create a temporary link element to trigger download
    var link = document.createElement("a");
    link.href = dataURL;
    link.download = "babylon_canvas.png";  // Specify the download filename
    link.click();
});

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };
var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    // Enable the physics engine
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    // camera
    var camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.2, 5, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, -1, 0), scene);
    light1.intensity = 0.5;

    var pl = new BABYLON.PointLight("pl", BABYLON.Vector3.Zero(), scene);
    pl.intensity = 0.5;


    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    ground.position.y = -1;
    // Create a transparent material
    const transparentMaterial = new BABYLON.StandardMaterial("transparentMaterial", scene);
    transparentMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // White color
    transparentMaterial.alpha = 0.9; // Set transparency (0 = fully transparent, 1 = opaque)
    // Assign the material to the ground
    ground.material = transparentMaterial;
    // Enable depth pre-pass for proper transparency rendering
    transparentMaterial.needDepthPrePass = true;
    // Assign physics to the ground
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
        ground,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.6 },
        scene
    );


    let model
    let physicsImpostor
    getModel(scene).then(m => {
        model = m

        const cube = scene.getMeshByName("Cube")
        // Assign physics to the dice
        physicsImpostor = new BABYLON.PhysicsImpostor(
            cube,
            BABYLON.PhysicsImpostor.BoxImpostor,
            { mass: 1, restitution: 0.6 },
            scene
        );
        cube.physicsImpostor = physicsImpostor;
    })

    const fileInput = document.getElementById("uvMapUpload");

    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader(file);


            reader.onload = function (e) {
                const texture = new BABYLON.Texture(e.target.result, scene, false, true);
                texture.uRotation = Math.PI;

                texture.uOffset = 0;  // Shift the texture horizontally
                texture.vOffset = .25;  // Shift the texture vertically
                // texture.uScale = 1;     // Scale horizontally
                // texture.vScale = 1;     // Scale vertically
                const material = new BABYLON.StandardMaterial("mat", scene);
                material.diffuseTexture = texture;
                // Apply the texture to the mesh material

                const cube = scene.getMeshByName("Cube")

                cube.material = material

            };

            reader.readAsDataURL(file);
        }
    });

    scene.preventDefaultOnPointerDown = false;
    scene.preventDefaultOnPointerUp = false;

    return scene;
};

function rollDice() {
    const dice = scene.getMeshByName("Cube")

    // Random force and torque
    const force = new BABYLON.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * 10
    );

    const torque = new BABYLON.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
    );

    console.log(dice.physicsImpostor.applyImpulse)

    // Apply force and torque
    dice.physicsImpostor.applyImpulse(force, dice.getAbsolutePosition());
}

// Call rollDice on user interaction
canvas.addEventListener("click", rollDice, false);

window.initFunction = async function () {
    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    window.scene = createScene();
};

initFunction().then(() => {
    sceneToRender = scene
});

async function getModel(scene) {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(["Cube"], "./", "dice.glb", scene);
    return result;
}

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});