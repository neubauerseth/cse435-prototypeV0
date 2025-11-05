// Scene setup
let scene, camera, renderer, controls;
let ourVehicle, oncomingVehicle;
let highBeamLight, adaptiveBeamLights = [];
let roadMesh, environmentObjects = [];
let currentScenario = 1;

function init() {

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000a1a);
    scene.fog = new THREE.Fog(0x000a1a, 50, 200);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, -20);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.2);
    scene.add(ambientLight);

    // Create road
    createRoad();

    // Create our vehicle
    createOurVehicle();

    // Create oncoming vehicle (hidden initially)
    createOncomingVehicle();

    // Create environment
    createEnvironment();

    // Create lighting systems
    createLightingSystems();

    // Add user controls (currently disabled)
    addSimpleControls();

    // Event listeners
    document.getElementById('scenario1').addEventListener('click', () => switchScenario(1));
    document.getElementById('scenario2').addEventListener('click', () => switchScenario(2));

    // Info-panel toggle for small screens
    const toggleBtn = document.getElementById('toggle-menu');
    const infoPanel = document.getElementById('info-panel');
    const infoBody = document.getElementById('info-panel-body');
    function applyPanelState(collapsed) {

        if (collapsed) {
            infoPanel.classList.add('collapsed');
            toggleBtn.setAttribute('aria-expanded', 'false');
        } 
        
        else {
            infoPanel.classList.remove('collapsed');
            toggleBtn.setAttribute('aria-expanded', 'true');
        }
    }

    toggleBtn.addEventListener('click', () => {
        const isCollapsed = infoPanel.classList.toggle('collapsed');
        toggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        try { localStorage.setItem('adb_menu_collapsed', isCollapsed ? '1' : '0'); } catch (e) {}
    });

    // Initialize panel state from localStorage or auto-collapse on narrow screens
    try {
        const stored = localStorage.getItem('adb_menu_collapsed');

        if (stored === '1') applyPanelState(true);

        else if (stored === '0') applyPanelState(false);
        
        else if (window.innerWidth <= 700) applyPanelState(true);
    } 
    
    catch (e) {
        if (window.innerWidth <= 700) applyPanelState(true);
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Hide loading
    document.getElementById('loading').style.display = 'none';

    // Start animation
    animate();
}

function createRoad() {
    // Main road - single lane
    const roadGeometry = new THREE.PlaneGeometry(8, 150);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.8,
        metalness: 0.2
    });

    roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.z = -25;
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Side lines (white edge lines)
    const sideLineGeometry = new THREE.PlaneGeometry(0.2, 150);
    const sideLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftLine = new THREE.Mesh(sideLineGeometry, sideLineMaterial);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-4, 0.01, -25);
    scene.add(leftLine);

    const rightLine = new THREE.Mesh(sideLineGeometry, sideLineMaterial);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(4, 0.01, -25);
    scene.add(rightLine);

    // Ground on sides
    const groundGeometry = new THREE.PlaneGeometry(100, 150);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a3a1a,
        roughness: 0.9
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -25;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createOurVehicle() {
    const vehicleGroup = new THREE.Group();

    // Car body - bright cyan/teal for better nighttime visibility
    const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x003344,
        emissiveIntensity: 0.2
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    vehicleGroup.add(body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(2.5, 1, 3);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.y = 2;
    roof.position.z = -0.5;
    roof.castShadow = true;
    vehicleGroup.add(roof);

    // Headlights (front)
    const headlightGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.2);
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-1, 0.7, 2.6);
    vehicleGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(1, 0.7, 2.6);
    vehicleGroup.add(rightHeadlight);

    // Taillights (rear) - RED
    const taillightGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.15);
    const taillightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000
    });
    
    const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    leftTaillight.position.set(-1, 0.7, -2.5);
    vehicleGroup.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    rightTaillight.position.set(1, 0.7, -2.5);
    vehicleGroup.add(rightTaillight);

    // Add subtle red point lights for taillights
    const leftTaillightGlow = new THREE.PointLight(0xff0000, 0.5, 5);
    leftTaillightGlow.position.set(-1, 0.7, -2.6);
    vehicleGroup.add(leftTaillightGlow);

    const rightTaillightGlow = new THREE.PointLight(0xff0000, 0.5, 5);
    rightTaillightGlow.position.set(1, 0.7, -2.6);
    vehicleGroup.add(rightTaillightGlow);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const wheels = [
        { x: -1.2, z: 1.5 },
        { x: 1.2, z: 1.5 },
        { x: -1.2, z: -1.5 },
        { x: 1.2, z: -1.5 }
    ];

    wheels.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0.4, pos.z);
        wheel.castShadow = true;
        vehicleGroup.add(wheel);
    });

    vehicleGroup.position.set(0, 0, 5);
    vehicleGroup.rotation.y = Math.PI; // Car facing forward
    ourVehicle = vehicleGroup;
    scene.add(vehicleGroup);
}

function createOncomingVehicle() {
    const vehicleGroup = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        metalness: 0.6,
        roughness: 0.4
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    vehicleGroup.add(body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(2.5, 1, 3);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.y = 2;
    roof.position.z = 0.5;
    roof.castShadow = true;
    vehicleGroup.add(roof);

    // Headlights (front) - facing away from us
    const headlightGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.2);
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-1, 0.7, -2.6);
    vehicleGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(1, 0.7, -2.6);
    vehicleGroup.add(rightHeadlight);

    // Add point lights for headlights
    const leftLight = new THREE.PointLight(0xffffee, 0.8, 15);
    leftLight.position.set(-1, 0.7, -3);
    vehicleGroup.add(leftLight);

    const rightLight = new THREE.PointLight(0xffffee, 0.8, 15);
    rightLight.position.set(1, 0.7, -3);
    vehicleGroup.add(rightLight);

    // Brake lights (rear) - RED and BRIGHT - facing toward us
    const brakeLightGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.15);
    const brakeLightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000
    });
    
    const leftBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
    leftBrakeLight.position.set(-1, 0.7, 2.5);
    vehicleGroup.add(leftBrakeLight);

    const rightBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
    rightBrakeLight.position.set(1, 0.7, 2.5);
    vehicleGroup.add(rightBrakeLight);

    // Add bright red point lights for brake lights (brighter than normal taillights)
    const leftBrakeGlow = new THREE.PointLight(0xff0000, 1.5, 8);
    leftBrakeGlow.position.set(-1, 0.7, 2.6);
    vehicleGroup.add(leftBrakeGlow);

    const rightBrakeGlow = new THREE.PointLight(0xff0000, 1.5, 8);
    rightBrakeGlow.position.set(1, 0.7, 2.6);
    vehicleGroup.add(rightBrakeGlow);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const wheels = [
        { x: -1.2, z: 1.5 },
        { x: 1.2, z: 1.5 },
        { x: -1.2, z: -1.5 },
        { x: 1.2, z: -1.5 }
    ];

    wheels.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0.4, pos.z);
        wheel.castShadow = true;
        vehicleGroup.add(wheel);
    });

    vehicleGroup.position.set(0, 0, -40);
    vehicleGroup.visible = false;
    oncomingVehicle = vehicleGroup;
    scene.add(vehicleGroup);
}

function createEnvironment() {
    // Trees along the road
    for (let i = 0; i < 15; i++) {
        const z = -10 - i * 8;
        
        // Left side trees
        createTree(-12, z);
        createTree(-15, z - 3);
        
        // Right side trees
        createTree(12, z);
        createTree(15, z - 3);
    }

    // Road signs
    createRoadSign(-8, -30);
    createRoadSign(8, -50);
}

function createTree(x, z) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3020 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage
    const foliageGeometry = new THREE.SphereGeometry(2, 8, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x1a4a1a });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 5;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    environmentObjects.push(treeGroup);
}

function createRoadSign(x, z) {
    const signGroup = new THREE.Group();

    // Post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = 1.5;
    post.castShadow = true;
    signGroup.add(post);

    // Sign board
    const boardGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    const boardMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = 3;
    board.castShadow = true;
    signGroup.add(board);

    signGroup.position.set(x, 0, z);
    scene.add(signGroup);
    environmentObjects.push(signGroup);
}

function createLightingSystems() {

    // Full high beam (Scenario 1)
    highBeamLight = new THREE.SpotLight(0xffffdd, 3, 100, Math.PI / 4, 0.3, 1);
    highBeamLight.position.set(0, 2, 5);
    highBeamLight.target.position.set(0, 0, -50);
    highBeamLight.castShadow = true;
    highBeamLight.shadow.mapSize.width = 2048;
    highBeamLight.shadow.mapSize.height = 2048;
    scene.add(highBeamLight);
    scene.add(highBeamLight.target);

    // Visualize high beam cone
    const coneGeometry = new THREE.CylinderGeometry(0.1, 15, 50, 32, 1, true);
    const coneMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff88,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });

    const beamCone = new THREE.Mesh(coneGeometry, coneMaterial);
    beamCone.position.set(0, 0, -20);
    beamCone.rotation.x = Math.PI / 2;
    highBeamLight.beamCone = beamCone;
    scene.add(beamCone);

    // Adaptive beam system (Scenario 2) - multiple lights with dark zone
    // Left high beam - illuminates left side, avoiding center
    const leftBeam = new THREE.SpotLight(0xffffdd, 3, 70, Math.PI / 6, 0.4, 1);
    leftBeam.position.set(-1.5, 2, 5);
    leftBeam.target.position.set(-2.5, 0, -50);
    leftBeam.castShadow = true;
    scene.add(leftBeam);
    scene.add(leftBeam.target);
    adaptiveBeamLights.push(leftBeam);

    const leftCone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 7, 50, 32, 1, true),
        coneMaterial.clone()
    );

    leftCone.position.set(-2, 0, -20);
    leftCone.rotation.x = Math.PI / 2;
    leftCone.rotation.z = -0.08;
    leftBeam.beamCone = leftCone;
    scene.add(leftCone);

    // Right high beam - illuminates right side, avoiding center
    const rightBeam = new THREE.SpotLight(0xffffdd, 3, 70, Math.PI / 6, 0.4, 1);
    rightBeam.position.set(1.5, 2, 5);
    rightBeam.target.position.set(2.5, 0, -50);
    rightBeam.castShadow = true;
    scene.add(rightBeam);
    scene.add(rightBeam.target);
    adaptiveBeamLights.push(rightBeam);

    const rightCone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 7, 50, 32, 1, true),
        coneMaterial.clone()
    );

    rightCone.position.set(2, 0, -20);
    rightCone.rotation.x = Math.PI / 2;
    rightCone.rotation.z = 0.08;
    rightBeam.beamCone = rightCone;
    scene.add(rightCone);

    // Very dim center low beam - just enough to see the road, not the vehicle
    const centerLowBeam = new THREE.SpotLight(0xffffdd, 0.15, 30, Math.PI / 10, 0.9, 2);
    centerLowBeam.position.set(0, 1.5, 5);
    centerLowBeam.target.position.set(0, 0, -35);
    centerLowBeam.castShadow = false;
    scene.add(centerLowBeam);
    scene.add(centerLowBeam.target);
    adaptiveBeamLights.push(centerLowBeam);

    // Dark zone visualization - shows the protected area around oncoming vehicle
    const darkZoneGeometry = new THREE.CylinderGeometry(0.1, 3.5, 35, 32, 1, true);
    // Able to change the color of the middle light zone (0xff00ff)
    const darkZoneMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    const dimmedArea = new THREE.Mesh(darkZoneGeometry, darkZoneMaterial);
    dimmedArea.position.set(0, 0, -30);
    dimmedArea.rotation.x = Math.PI / 2;
    dimmedArea.visible = false;
    scene.add(dimmedArea);

    // Ensure the visual beam cone and dimmed-area draw on top so the dimmed-area
    // can act as a visual "blackout" mask that overlays and darkens other cones.
    // beamCone was created earlier and represents the central beam visualization.
    if (typeof beamCone !== 'undefined' && beamCone) {
        beamCone.renderOrder = 1000;
        beamCone.material.depthTest = false;
        beamCone.material.depthWrite = false;
        beamCone.material.transparent = true;
        // keep existing color/opacity for the center cone (tweak if desired)
        beamCone.material.opacity = 0.15;
    }

    // Configure dimmedArea as a final overlay mask that multiplies underlying colors
    dimmedArea.renderOrder = 1100; // draw after cones
    dimmedArea.material.depthTest = false;
    dimmedArea.material.depthWrite = false;
    dimmedArea.material.transparent = true;
    dimmedArea.material.blending = THREE.MultiplyBlending;
    dimmedArea.material.color.setHex(0x333333); // update color
    dimmedArea.material.opacity = 0.85; // tune strength of the blackout
    
    // Store dimmed area for all adaptive lights
    adaptiveBeamLights.forEach(light => {
        light.dimmedArea = dimmedArea;
    });

    // Initially show scenario 1
    updateLightingForScenario(1);
}

function updateLightingForScenario(scenario) {
    // Helper: toggle rendering so the vehicle can be drawn on top of cones when needed
    function setVehicleOverlay(enable) {
        if (!ourVehicle) return;

        // renderOrder on the group ensures it's drawn after cones (which use 1000)
        ourVehicle.renderOrder = enable ? 1200 : 0;

        ourVehicle.traverse(obj => {
            if (obj.isMesh && obj.material) {
                const applyToMaterial = m => {

                    // when enabling overlay, disable depth-test/write so the vehicle paints on top
                    m.depthTest = !enable;
                    m.depthWrite = !enable;

                    // ensure transparency flag if depthTest disabled (not required but safer)
                    if (enable && !m.transparent) m.transparent = true;
                };

                if (Array.isArray(obj.material)) {
                    obj.material.forEach(applyToMaterial);
                } 
                
                else {
                    applyToMaterial(obj.material);
                }
            }
        });
    }
    
    // Scenario 1: Full high beam
    if (scenario === 1) {
        
        highBeamLight.visible = true;
        if (highBeamLight.beamCone) highBeamLight.beamCone.visible = true;
        
        adaptiveBeamLights.forEach(light => {
            light.visible = false;
            
            if (light.beamCone) light.beamCone.visible = false;

            if (light.dimmedArea) light.dimmedArea.visible = false;
        });
        
        oncomingVehicle.visible = false;

        // Draw the vehicle on top of the beam cone for Scenario 1
        setVehicleOverlay(true);
        
        document.getElementById('status-text').textContent = 
            'Scenario One: The ADB system operates effectively on a straight highway at night, with no other vehicles present. Demonstrating full high-beam illumination.';
    } 
    
    // Scenario 2: Adaptive beam with oncoming vehicle
    else {
        highBeamLight.visible = false;
        if (highBeamLight.beamCone) highBeamLight.beamCone.visible = false;
        
        adaptiveBeamLights.forEach(light => {
            light.visible = true;
            if (light.beamCone) light.beamCone.visible = true;
            if (light.dimmedArea) light.dimmedArea.visible = true;
        });
        
        oncomingVehicle.visible = true;
        // Restore normal rendering so cones and dim areas behave as usual in Scenario 2
        setVehicleOverlay(false);
        
        document.getElementById('status-text').textContent = 
            'Scenario Two: The system adjusts the beam pattern when an oncoming vehicle is detected, ensuring no glare while maintaining maximum illumination on other road areas.';
    }
}

function switchScenario(scenario) {
    currentScenario = scenario;
    updateLightingForScenario(scenario);
    
    // Update button states
    document.querySelectorAll('.controls button').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById('scenario' + scenario).classList.add('active');
}

function addSimpleControls() {
    // Camera controls disabled - static view only
    // Able to add additional controls here in the future
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Subtle vehicle animation (slight bounce)
    const time = Date.now() * 0.001;
    if (ourVehicle) {
        ourVehicle.position.y = Math.sin(time * 2) * 0.05;
    }

    if (oncomingVehicle && oncomingVehicle.visible) {
        oncomingVehicle.position.y = Math.sin(time * 2.5) * 0.05;
    }

    renderer.render(scene, camera);
}

// Initialize when page loads
window.addEventListener('load', init);
