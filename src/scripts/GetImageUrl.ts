import {BaseDirectory, readBinaryFile} from '@tauri-apps/api/fs';
import indigoDahlia from "../images/backgrounds/indigo dahlia, macro photography, frozen leaves, ice cold, translucent, realistic - DALL·E 2023-05-10 15.35.05_edited_photos_v2_x4.webp"
import frozenLeaves from "../images/backgrounds/flinkflinkflink_frozen_leaves_ice_cold_translucent_realistic_su_1ae3cb2d-4669-449e-8c18-cad02cc5b2c7.webp"
import abstractBalls from "../images/backgrounds/image.webp"
import forestSunRays from "../images/backgrounds/jam54_forest_misty_mysterious_sun_rays_dawn_f896ec7c-ee71-441c-9598-85649e2d31d2.webp"
import cotlForest from "../images/backgrounds/jam54_sky_children_of_the_light_black_shard_event_hidden_forest_6a4b6645-59eb-45ef-8907-19bda982fdef.webp"
import whiteEndlessSnow from "../images/backgrounds/qsfdqsdfsqdf_endless_snow_8c6e8c8e-7aaf-49d4-b958-7429cfa7db11.webp"
import orangeEndlessSnow from "../images/backgrounds/qsfdqsdfsqdf_endless_snow_797eea75-cb3b-4424-b327-27609a2b725f.webp"
import blueEndlessSnow from "../images/backgrounds/qsfdqsdfsqdf_endless_snow_48138d41-ea08-42ea-8129-83cf84a52b0e.webp"
import treeOnWater from "../images/backgrounds/qsfdqsdfsqdf_imagine_realistic_cold_ice_and_snow_landscape_tree_88fbabe6-328a-4269-830b-59cd011ca853.webp"
import treeInWaterBubble from "../images/backgrounds/qsfdqsdfsqdf_imagine_realistic_cold_ice_and_snow_landscape_tree_303287ad-8d03-422c-b9b1-961e22fb2b54.webp"
import treeOnWaterBlueBg from "../images/backgrounds/qsfdqsdfsqdf_imagine_realistic_cold_ice_and_snow_landscape_tree_629623ba-2378-48b0-ad5e-04dfb0e7c21f.webp"
import sunsetArt from "../images/backgrounds/SunsetArt2.webp"
import leaves from "../images/backgrounds/verocliq_leaf_nature_bokeh_foreground_forest_sunshine_happy_acr_031dc65a-d237-4419-8218-41fb251b82b0.webp"

export let includedImagesInTakma:string[] = [indigoDahlia, frozenLeaves, abstractBalls, forestSunRays, leaves, cotlForest, whiteEndlessSnow, orangeEndlessSnow, blueEndlessSnow, treeOnWater, treeInWaterBubble, treeOnWaterBlueBg, sunsetArt];


/**
 * Given a path to an image file, this function returns an url to the image.
 *
 * We cant just use the path of the image as the src for our img tags because of how Tauri works. Instead we read the image path as a binary file, create a blob and then create an url from that blob
 * @param path Path to the image file. It can be either an absolute path or a relative path.
 * @param baseDirectory Optional base directory from which the relative path starts. Only required if the path is relative.
 */
export async function getImageUrl(path: string, baseDirectory?: BaseDirectory)
{
    const getFileName = (path) => path.split("/").pop().split("\\").pop().split(".")[0].replaceAll(",", "_");

    if (includedImagesInTakma.find(img => getFileName(path).includes(getFileName(img))))
    {//This is true in the case the saved picture is one of the pictures included with Takma, and if we are running a dev build or if we are running a release build where the image in question was saved during a release build
        return includedImagesInTakma.find(img => getFileName(path).includes(getFileName(img)));
    }
    else if (includedImagesInTakma.find(img => getFileName(img).includes(getFileName(path))))
    {//This is true in the case the saved picture is one of the pictures included with Takma, and if we are running a release build where the image in question was saved during a dev build
        return includedImagesInTakma.find(img => getFileName(img).includes(getFileName(path)));
    }

    let imageData;
    if (baseDirectory)
    {
        imageData = await readBinaryFile(path, { dir: baseDirectory });
    }
    else
    {
        imageData = await readBinaryFile(path);
    }

    const blob = new Blob([imageData], { type: "image" });
    return URL.createObjectURL(blob);
}