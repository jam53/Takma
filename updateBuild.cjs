const fs = require('fs-extra');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const tauriConfFilePath = path.join(__dirname, 'src-tauri', 'tauri.conf.json');

// Read package.json to get name, version, and build
fs.readJson(packageJsonPath, (err, packageData) =>
{
    if (err)
    {
        console.error('Error reading package.json:', err);
        return;
    }

    const {name, version, build} = packageData;
    const updatedBuildNumber = build + 1;

    // Update the buildNumber in package.json
    fs.writeJson(packageJsonPath, {...packageData, build: updatedBuildNumber}, {spaces: 4}, writeErr =>
    {
        if (writeErr)
        {
            console.error('Error updating package.json:', writeErr);
            return;
        }

        console.log('buildNumber updated in package.json');

        // Update tauri.conf.json
        fs.readJson(tauriConfFilePath, (tauriConfReadErr, tauriConfData) =>
        {
            if (tauriConfReadErr)
            {
                console.error('Error reading tauri.conf.json:', tauriConfReadErr);
                return;
            }

            // Update the package.version property
            tauriConfData.version = version;

            // Update the tauri.windows.title property
            tauriConfData.app.windows[0].title = `${name} ${version} (${updatedBuildNumber})`;

            // Write the updated tauri.conf.json
            fs.writeJson(tauriConfFilePath, tauriConfData, {spaces: 4}, writeTauriConfErr =>
            {
                if (writeTauriConfErr)
                {
                    console.error('Error updating tauri.conf.json:', writeTauriConfErr);
                    return;
                }

                console.log(`tauri.conf.json updated with tauri.windows.title: ${tauriConfData.app.windows[0].title}`);
            });
        });
    });
});
