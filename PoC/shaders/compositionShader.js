export const CompositionShader = {
    vertex: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragment: `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        uniform sampler2D overlayTexture;

        varying vec2 vUv;

        void main() {
            vec4 base = texture2D( baseTexture, vUv );
            vec4 bloom = texture2D( bloomTexture, vUv );
            vec4 overlay = texture2D( overlayTexture, vUv );

            gl_FragColor = base + bloom + overlay;
        }
    `
}
