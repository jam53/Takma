# Building The Project
- Since we are publishing a new version of the application, we should increment the version number. For Takma we use the [Semantic Versioning](https://semver.org/) convention to update the version number.
    - In summary:
      - Given a version number MAJOR.MINOR.PATCH, increment the:
        - MAJOR version when making major (breaking) changes.
        - MINOR version when adding new features or improvements.
        - PATCH version when making bugfixes or small improvements.


- Edit `package.json` and `Cargo.toml` to update the version number
- Run `npm i`
- Run `npm run tauri build`
- The executable together with the `resources` folder will be placed in: `src-tauri/target/release/`
  - An msi installer can be found in: `src-tauri/target/release/bundle/msi/`
  - An exe installer can be found in: `src-tauri/target/release/bundle/nsis/`
