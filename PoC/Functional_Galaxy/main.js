import * as THREE from 'three'
import { CompositionShader } from './shaders/CompositionShader.js'
import { BASE_LAYER, BLOOM_LAYER, BLOOM_PARAMS, OVERLAY_LAYER } from "./config/renderConfig.js"
import { MapControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { StarSystem } from './objects/star.js'

let canvas, renderer, camera, scene, orbit, 
    baseComposer, bloomComposer, overlayComposer, 
    starSystem

function createStarMemoryModal() {
    const modal = document.createElement('div')
    modal.id = 'star-memory-modal'
    modal.style.cssText = `
        position: fixed; display: none; z-index: 1000;
        left: 0; top: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5);
    `
    modal.innerHTML = `
        <div style="background-color: white; width: 300px; margin: 100px auto; 
                    padding: 20px; border-radius: 5px;">
            <h2>Star Memory</h2>
            <form id="star-memory-form">
                <div>
                    <label>Date:</label>
                    <input type="date" id="memory-date" required>
                </div>
                <div>
                    <label>Memory:</label>
                    <textarea id="memory-text" rows="4" required></textarea>
                </div>
                <div>
                    <label>Attachment:</label>
                    <input type="file" id="memory-attachment">
                </div>
                <button type="submit">Save Memory</button>
                <button type="button" id="close-modal">Cancel</button>
            </form>
        </div>
    `
    document.body.appendChild(modal)

    document.getElementById('close-modal').addEventListener('click', () => {
        modal.style.display = 'none'
    })
}

function setupStarInteraction() {
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    canvas.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

        raycaster.setFromCamera(mouse, camera)

        const intersects = raycaster.intersectObjects(
            scene.children.filter(obj => obj.layers.test(BLOOM_LAYER)), 
            true
        )

        if (intersects.length > 0) {
            const star = intersects[0].object
            if (star.userData.isInteractive) {
                const modal = document.getElementById('star-memory-modal')
                modal.style.display = 'block'
                
                const form = document.getElementById('star-memory-form')
                form.dataset.starId = star.id
            }
        }
    })

    document.getElementById('star-memory-form').addEventListener('submit', (event) => {
        event.preventDefault()
        const starId = parseInt(event.target.dataset.starId)
        const date = document.getElementById('memory-date').value
        const text = document.getElementById('memory-text').value
        const attachment = document.getElementById('memory-attachment').files[0]

        const star = starSystem.findStarById(starId)
        if (star) {
            star.addMemory({
                date,
                text,
                attachmentUrl: attachment ? URL.createObjectURL(attachment) : null
            })
            console.log('Memory added to star', star)
        }

        document.getElementById('star-memory-modal').style.display = 'none'
        event.target.reset()
    })
}

function initThree() {
    canvas = document.querySelector('#canvas')

    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003)

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000000)
    camera.position.set(0, 500, 500)
    camera.up.set(0, 0, 1)
    camera.lookAt(0, 0, 0)

    orbit = new MapControls(camera, canvas)
    orbit.enableDamping = true
    orbit.dampingFactor = 0.05
    orbit.screenSpacePanning = false
    orbit.minDistance = 1
    orbit.maxDistance = 16384
    orbit.maxPolarAngle = (Math.PI / 2) - (Math.PI / 360)

    initRenderPipeline()
    createStarMemoryModal()
    setupStarInteraction()
}

function initRenderPipeline() {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas,
        logarithmicDepthBuffer: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5

    const renderScene = new RenderPass(scene, camera)

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 
        1.5, 0.4, 0.85
    )
    bloomPass.threshold = BLOOM_PARAMS.bloomThreshold
    bloomPass.strength = BLOOM_PARAMS.bloomStrength
    bloomPass.radius = BLOOM_PARAMS.bloomRadius

    bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(bloomPass)

    overlayComposer = new EffectComposer(renderer)
    overlayComposer.renderToScreen = false
    overlayComposer.addPass(renderScene)

    const finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture },
                overlayTexture: { value: overlayComposer.renderTarget2.texture }
            },
            vertexShader: CompositionShader.vertex,
            fragmentShader: CompositionShader.fragment,
            defines: {}
        }), 'baseTexture'
    )
    finalPass.needsSwap = true

    baseComposer = new EffectComposer(renderer)
    baseComposer.addPass(renderScene)
    baseComposer.addPass(finalPass)
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const needResize = canvas.width !== width || canvas.height !== height
    if (needResize) {
        renderer.setSize(width, height, false)
    }
    return needResize
}

function render() {
    orbit.update()

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
    }

    renderPipeline()
    requestAnimationFrame(render)
}

function renderPipeline() {
    camera.layers.set(BLOOM_LAYER)
    bloomComposer.render()

    camera.layers.set(OVERLAY_LAYER)
    overlayComposer.render()

    camera.layers.set(BASE_LAYER)
    baseComposer.render()
}

initThree()
let axes = new THREE.AxesHelper(5.0)
scene.add(axes)

starSystem = new StarSystem(scene)

requestAnimationFrame(render)
