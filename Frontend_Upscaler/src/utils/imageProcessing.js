/**
 * Rotates an image file by the specified degrees using HTML Canvas.
 * Returns a new File object containing the rotated image.
 * 
 * @param {File} file - The original image file.
 * @param {number} rotation - Rotation in degrees (e.g., 90, 180, 270).
 * @returns {Promise<File>} - Resolves with the rotated File.
 */
export const getRotatedImage = (file, rotation, force = false) => {
    return new Promise((resolve, reject) => {
        if (rotation === 0 && !force) {
            resolve(file);
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Normalize rotation (allow negative inputs)
            const degrees = ((rotation % 360) + 360) % 360;

            // Dimensions swap if rotating 90 or 270
            if (degrees === 90 || degrees === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            // Move to center, rotate, move back
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((degrees * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas to Blob conversion failed'));
                    return;
                }
                const rotatedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                });
                resolve(rotatedFile);
            }, file.type);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };

        img.src = url;
    });
};
