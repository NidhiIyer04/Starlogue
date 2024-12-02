Notes:
1. Glow: bloom, overlay and base layer used
2. GausianRandom: more stars in center
3. galaxy config file: variables to control how it looks: galaxy thickness, num starts, core_x_dist, y dist 
4. startypes.json Wikipedia: https://en.wikipedia.org/wiki/Stellar_classification
![image](https://github.com/user-attachments/assets/afc080c8-92bd-41ea-93cd-95980da7c214)
5. Generate star types: generates a random number then finds which bin
6. Sprite material and multiply scalar to adjust size and all
7. Shrink as we zoom in etc: update scale uses camera position; dist/250; stay within min and max
8. main-> stars array (create and push to this)
9. Render function loop through all stars and update scales
