/**
 * Resizes the picture that a `<img/>` component displays to the size of the `<img/>` element. This way if we put a very high resolution picture as the source of an `<img/>` element which isn't that big, we avoid rendering the picture at a very high resolution where it isn't needed.
 * We can use this by adding the `use:resizeImg` attribute to an `<img/>` element
 */
export function resizeImg(imgElement) {

    if (imgElement.nodeName === "IMG")
    {
        const picture = new Image();

        picture.onload = () =>
        {
            const increaseResolutionBy = 1.5; //This allows us to render the picture inside the imgElement (i.e. <img/>) at a higher resolution than the size of the imgElement

            if (imgElement.width * increaseResolutionBy < picture.width) //We only rescale the picture if the size of the picture is larger than the size of the imageElement.
            {
                let imageWidth;
                let imageHeight;

                if (imgElement.width > imgElement.height) //If the imgElement is landscape, we should take the width as our "baseline" and calculate the height based of the width. Otherwise the picture might look lowres/blurry
                {
                    const heightWidthRatio = picture.height / picture.width; //We use this to maintain the aspect ratio of the picture

                    imageWidth = imgElement.width;
                    imageHeight = imgElement.width * heightWidthRatio;
                }
                else //If the imgElement is portrait, we should take the height as our "baseline" and calculate the width based of the height.  Otherwise the picture might look lowres/blurry
                {
                    const widthHeightRatio = picture.width / picture.height; //We use this to maintain the aspect ratio of the picture

                    imageWidth = imgElement.height * widthHeightRatio;
                    imageHeight = imgElement.height;
                }

                imageWidth *= increaseResolutionBy;
                imageHeight *= increaseResolutionBy;

                const canvas = document.createElement('canvas');
                canvas.width = imageWidth;
                canvas.height = imageHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(picture, 0, 0, imageWidth, imageHeight);

                const resizedDataUrl = canvas.toDataURL();
                // Set the resized image data URL
                imgElement.src = resizedDataUrl;
                imgElement.classList.remove("loader");
            }
            else
            {
                imgElement.src = picture.src;
            }
        };

        picture.src = imgElement.src;
        imgElement.classList.add("loader"); //This styleclass displays a loading animation.
        imgElement.src = ""; //If we don't remove the src, the loader css animation wouldn't be visible. Setting a transparent picture as the src also doesn't seem to work. But setting the src as "" does make it transparent, we do however see the img icon that the browser displays when it cant load an image. Also, setting the src to "" makes it so that we no longer render the original highres picture. Otherwise the highres picture would stay visible until we rescaled the picture and set that as the new src.
    }
    else
    {
        console.error("This script can only be used on an <\img> component. The node that used this script was: " + imgElement.nodeName);
    }
}