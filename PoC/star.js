import * as THREE from 'three'

export class Star extends THREE.Mesh {
    constructor(options = {}) {
        const geometry = new THREE.SphereGeometry(
            options.radius || 10, 
            32, 
            32
        )
        
        const material = new THREE.MeshBasicMaterial({ 
            color: options.color || new THREE.Color(
                Math.random(), 
                Math.random(), 
                Math.random()
            ),
            transparent: true,
            opacity: 0.8
        })

        super(geometry, material)

        this.position.set(
            options.x || Math.random() * 4000 - 2000,
            options.y || Math.random() * 4000 - 2000,
            options.z || Math.random() * 4000 - 2000
        )

        this.metadata = {
            name: options.name || 'Unnamed Star',
            memories: []
        }

        this.layers.enable(0)  // Base layer
        this.layers.enable(1)  // Bloom layer
        this.userData.isInteractive = true
    }

    addMemory(memory) {
        this.metadata.memories.push({
            date: memory.date,
            text: memory.text,
            attachmentUrl: memory.attachmentUrl || null
        })
    }

    getMemories() {
        return this.metadata.memories
    }
}

export class StarSystem {
    constructor(scene, count = 500) {
        this.stars = []
        this.scene = scene

        for (let i = 0; i < count; i++) {
            const star = new Star({
                radius: 10,
                color: this.generateStarColor()
            })
            
            this.stars.push(star)
            this.scene.add(star)
        }
    }

    generateStarColor() {
        const colors = [
            0xFFFFFF, 0xF0F8FF, 0xFFD700, 
            0xB0E0E6, 0xFFFACD
        ]
        return colors[Math.floor(Math.random() * colors.length)]
    }

    findStarById(id) {
        return this.stars.find(star => star.id === id)
    }
}
