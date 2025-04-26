# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.3] - 2025-04-26
### Added
- Add action buttons below the plain text editor. ([4646b871](https://github.com/jam53/Takma/commit/4646b8717371188f8cc33986ed26f4393282f64b))
- (tiptap): Allow headings and other block elements within Details/Summary blocks. ([5dd466f6](https://github.com/jam53/Takma/commit/5dd466f6c993a7cd62abf8c66eff7158ebdb4f91))

### Changed
- Improve performance by debouncing `SaveLoadManager` persistence calls, reducing disk I/O frequency during rapid saves. ([ef9128e6](https://github.com/jam53/Takma/commit/ef9128e6338cbd4f047d15618380c390ce5e4fb1))
- (tiptap): Improve editor initialization performance by removing a redundant `setContent` call, reducing UI hangs with large descriptions. ([97008c5a](https://github.com/jam53/Takma/commit/97008c5a13e9036ea90153705af99932ffae7f82))

### Fixed
- (tiptap): Fix issue where the marker on Details/Summary blocks could block clicks on the unfold/fold button. ([d52bfd0c](https://github.com/jam53/Takma/commit/d52bfd0c6caf9e49b27f7ee853bbae0be0a65838))
- (tiptap): Position the floating menu above the current line instead of after the cursor. ([f88fe22f](https://github.com/jam53/Takma/commit/f88fe22fc5a802bc7451dd8e0b5c31a49c64b37a))

## [1.7.2] - 2025-04-22
### Fixed
- Fix file opening issue. Using Tauri's `open()` caused problems with local files (attachments, license). Switched to `openPath()` for correct handling. ([15efed03](https://github.com/jam53/Takma/commit/15efed03e3c9632f471babc837749ee31dd9c718))
- (tiptap): Fix right-clicking on a link opening it instead of showing the context menu. ([058950b9](https://github.com/jam53/Takma/commit/058950b9de6a2c701e288d167cdccb2724f35856))
- (card): Retain label text visibility preference across application loads. ([c004f076](https://github.com/jam53/Takma/commit/c004f076d17f5cab394e6c61580ae8589c20982e))

## [1.7.1] - 2025-04-21
### Fixed
- (tiptap): Fix issue where the tab key wouldn't indent lists but instead add spaces. Previously, the Tab key shortcut always inserted spaces, breaking list indentation. This change ensures the shortcut only applies when inside a code block. ([0ae308f1](https://github.com/jam53/Takma/commit/0ae308f1f6290f3da3118b256cbc71a8e7aadb13))

## [1.7.0] - 2025-04-20
### Added
- Enable browser zoom controls (standard zoom functionality). ([895be77b](https://github.com/jam53/Takma/commit/895be77b1e0fe388aee24ed6feeff46664544078))
- Replace static Markdown rendering of card description with Tiptap editor for inline editing. ([5912f330](https://github.com/jam53/Takma/commit/5912f3308a91e455d9bbe376ac8c22b2f9938b8e))
- (welcome-screen): Add the ability to archive boards. ([dafbac2c](https://github.com/jam53/Takma/commit/dafbac2cd3fa2fdf8c77ef8fc77453a7a23523ab))
- (checklists): Allow entering new lines in checklist items. ([b3f9828d](https://github.com/jam53/Takma/commit/b3f9828dd371c19e7c4c050f2d099ffa8bcab189))
- Add confirmation dialogs with opt-out for destructive actions (delete boards, cards, attachments). ([8dd7358a](https://github.com/jam53/Takma/commit/8dd7358a1f5c8db14406f599f8f703efaf2061e2))
- (searchbar): Automatically select text when opening with `Ctrl` + `Shift` + `F`. ([79dfbb6c](https://github.com/jam53/Takma/commit/79dfbb6c3de3305241ce476b46f9258624cfe774))
- (checklists): Add the ability to sort checklists. ([96d36196](https://github.com/jam53/Takma/commit/96d36196424da7bffa348fc511ece4bdbeb7e667))
- (due-dates-overview): Display completed cards in a separate section. ([f7887087](https://github.com/jam53/Takma/commit/f78870875a413ce72a24b6306a8453ce25cd1508))
- (filter-cards-popup): Add filtering by card status (complete/incomplete). ([857b068d](https://github.com/jam53/Takma/commit/857b068dfc2b6ba46d888e80ed6f920cee6856b9))
- (card): Add the ability to mark cards as complete or incomplete. ([370cbe74](https://github.com/jam53/Takma/commit/370cbe745dc6071a14fc15f8429d70bafa517beb))
- (board-screen): Add button to navbar to sort lists. ([e6ab5c06](https://github.com/jam53/Takma/commit/e6ab5c063f32d523fe99a2f1340c770a79249720))

### Fixed
- Reset list sort order when switching boards. ([e5496668](https://github.com/jam53/Takma/commit/e5496668a0eb0d43a20d15f60fb286ed58c2054d))
- Ensure list intro animation plays for all lists on load; remove animation delay for new lists. ([0861cdb8](https://github.com/jam53/Takma/commit/0861cdb8313a14ba48fa749b0149980a675800b6))
- Ensure labels are copied when pasting cards or lists across boards, handling duplicates and ID conflicts. ([e0b55e83](https://github.com/jam53/Takma/commit/e0b55e8317ff67364d6f68579874045c8d0dadaa))
- (options-menu): Hide unavailable actions like "Paste Card" until they become available. ([f0ccdbb3](https://github.com/jam53/Takma/commit/f0ccdbb3209a198eff587834a8ee5351c5190e18))
- (filter-cards-popup): Ensure due date icon color respects light/dark theme. ([fb83e8a6](https://github.com/jam53/Takma/commit/fb83e8a65eea8b82113b25160eb6630168aeb641))
- (list): Recalculate height when its title changes to prevent overflow. ([7914535c](https://github.com/jam53/Takma/commit/7914535cd20d143651bcdf2b387c3bf56a9ced17))
- (new-board-popup): Handle missing or empty resource "backgrounds" directory with fallback. ([6dc7f1dc](https://github.com/jam53/Takma/commit/6dc7f1dc64b4a7a72156f02d8ca5e3fdef2f8f13))
- (card): Issue where the "complete" icon wouldn't be visible unless another icon was present. ([39ad8be3](https://github.com/jam53/Takma/commit/39ad8be3e817c83b3fd7a2244f6cfcb006959f4e))
- (board-screen): Ensure cards without a due date are displayed. ([1341917c](https://github.com/jam53/Takma/commit/1341917c4e925a3af23f725e45b006716eaeb785))
- (list-options-menu): Prevent infinite $effect() loop after sorting list. ([c45b1c7d](https://github.com/jam53/Takma/commit/c45b1c7df3c63e939264ffcb8b54cf3b3072a962))
- Remove `JSON.stringify()` in logging statements. ([29455dff](https://github.com/jam53/Takma/commit/29455dff28dffa24b3cb344bf9cf0c4eafbc7997))
- Issue where all lists were unnecessarily saved when only one changed (unless sort order changed). ([1494a202](https://github.com/jam53/Takma/commit/1494a2023b0c43eff2ca091aff5beb0e4cf9fae9))
- (list): Issue where renaming a list's title wouldn't persist if dragged immediately after. ([ce53e78c](https://github.com/jam53/Takma/commit/ce53e78c04b00a8e124676334bca9ea7d67ea70b))
- (order-boards-menu): Add hover effect transition to buttons. ([a20c0ea9](https://github.com/jam53/Takma/commit/a20c0ea950ab26bad038a787ebeff87062afd617))
- (list): Prevent lists from shifting downwards when dragged. ([b09f35e9](https://github.com/jam53/Takma/commit/b09f35e9ae21bf71f02297c9202b098fd078c929))
- Handle single quotes in background image filenames. ([a938a31d](https://github.com/jam53/Takma/commit/a938a31d2b31396daf7fbedf6576a239864241ee))
- (create-new-list): Disable spellcheck on new list input. ([cd0740c8](https://github.com/jam53/Takma/commit/cd0740c853f064291030e491be27ac0a2ccbc9bb))
- (list): Disable spellcheck on list title input. ([f3205369](https://github.com/jam53/Takma/commit/f32053693f0055266b2a86902b61ec4d487c9839))
- (create-new-card): Disable spellcheck on new card input. ([a00d6062](https://github.com/jam53/Takma/commit/a00d6062d97b172be904904f9c71afb49fbb340a))
- (card-details): Correct fullscreen icon toggle state visually. ([dc226449](https://github.com/jam53/Takma/commit/dc2264491db91a8f4e2376655f69b977cbf6fb64))

### Changed
- Update dependencies. ([697bec51](https://github.com/jam53/Takma/commit/697bec514fced2800ee68b4b56a55a616330d9ad))
- Replace `-webkit-box-shadow` with standard `box-shadow`. ([5dcac5f7](https://github.com/jam53/Takma/commit/5dcac5f7c0e382b2cf3c1cb915e7aefe36e2880d))
- (i18n): Add type safety for translation keys using `keyof Translation`. ([eb92eb25](https://github.com/jam53/Takma/commit/eb92eb2560af556c15f68335ffed16fda7deeaa6))
- Abstract common options menu logic into new `OptionsMenu` component. ([9f12cc7a](https://github.com/jam53/Takma/commit/9f12cc7aebc70e64e92d91c64ebc774a45da3fd5))
- Pass entire `Board`, `List`, `Card` objects as props to option menus; use `$effect()` for automatic saving. ([da755860](https://github.com/jam53/Takma/commit/da755860cb14a21c26f41750449a967330c2e457))
- Replace manual refresh functions with Svelte's two-way bindings (`$state`, `$bindable`). ([9ba7e5ee](https://github.com/jam53/Takma/commit/9ba7e5ee9b3ce68f4d17142c55110290274904ca))
- Update dependencies. ([9e22f9c5](https://github.com/jam53/Takma/commit/9e22f9c59ef6f6d9dc90eb432419e6cb2a809014))

## [1.6.8] - 2024-12-01
### Fixed
- Fix issue where list titles couldn't be edited. ([bef0b131](https://github.com/jam53/Takma/commit/bef0b131e9432bcf9b8d653e7f95e2468f62e861))

## [1.6.7] - 2024-11-09
### Added
- Add shortcut to open search bar (`CTRL` + `SHIFT` + `F`). ([a8fed069](https://github.com/jam53/Takma/commit/a8fed0694f5864017e40d13e22604f48b4a3a6e7))
- Add text ellipsis for board title on the board screen. ([ef6c3436](https://github.com/jam53/Takma/commit/ef6c3436f0b39d02bdcf511435ffee4e1a929ca7))

### Fixed
- Issue where toggling the labels' display style wouldn't refresh all labels on the board. ([a543c34e](https://github.com/jam53/Takma/commit/a543c34e82c68fd06896fcfe3375eaa188781328))
- Issue where opening a Takma link from within a card description could overwrite the newly opened card after Svelte 5 upgrade. ([bf6e7bfa](https://github.com/jam53/Takma/commit/bf6e7bfab81e7abd58fbe9943bf7f4106b4adb18))
- Layout shifts and drag issues when dragging cards with cover images. ([94a03340](https://github.com/jam53/Takma/commit/94a03340649996bf0c163f9656f21357fe12c2b5))
- Card overwrite issue caused by changing the due date of another card on a different board. ([5da62755](https://github.com/jam53/Takma/commit/5da6275564eeb87e1242c28bbcb46e04f0c4d684))
- Inconsistent directory separators in paths within the save file. ([ed5baee7](https://github.com/jam53/Takma/commit/ed5baee7f176d817596126523723c1cbd144bd0d))
- Typo in log message. ([f158d6f3](https://github.com/jam53/Takma/commit/f158d6f3ec33426432ace3b3b4a90971351da468))

### Changed
- Include checklists within cards in board screen search. ([59be5afe](https://github.com/jam53/Takma/commit/59be5afe79917e87ba25cb17ffa81c777ecc7479))
- Refresh only the edited card on the board screen after editing via details screen, not all cards. ([97229c5c](https://github.com/jam53/Takma/commit/97229c5cdb62483e73612d6374b9a58fddea1070))

## [1.6.6] - 2024-11-02
### Added
- Add logging. ([b9357a9a](https://github.com/jam53/Takma/commit/b9357a9ae01f6f01126d5ea9976b27e6db086020))

### Fixed
- Issue with unreferenced files persisting on disk after board paste cancellation. ([1c4345a5](https://github.com/jam53/Takma/commit/1c4345a5efed86bd19c4ee394287096d976bec0f))
- Error dialogs displaying as regular dialogs after Tauri 2.0 upgrade. ([b401b2da](https://github.com/jam53/Takma/commit/b401b2da79b49a00bf7173452b7d291c12ac3dff))
- Thumbnails not generating for images with uppercase file extensions. ([fa698961](https://github.com/jam53/Takma/commit/fa698961e125b9d8050232c64a4fdee0f0b04f72))
- Issues with Svelte 5’s deeply reactive `$state` proxies causing problems with non-proxy-aware code (e.g., `structuredClone`). ([c45e140f](https://github.com/jam53/Takma/commit/c45e140fddb12723cdd77bf4ac4608e217c217c4))

### Changed
- Refactor card, list, and board copy/paste process. ([5b4ac176](https://github.com/jam53/Takma/commit/5b4ac17651283fbe720128be03eceba84f8d9eb8))

## [1.6.5] - 2024-10-28
### Changed
- Remove UPX dependency. ([d4d9c66f](https://github.com/jam53/Takma/commit/d4d9c66f870698d9b3e21695230b0058630c8abf))

## [1.6.4] - 2024-10-27
### Added
- Add `CTRL` + `SHIFT` + `W` shortcut to close the Takma window. ([6ff20178](https://github.com/jam53/Takma/commit/6ff201789a36e34fa1dfb6a88e3c9cbfdb551897))
- Add Takma Web Preview button to NavBar on welcome screen. ([e1e3a0e3](https://github.com/jam53/Takma/commit/e1e3a0e3d58dcec55f2bec01aae70ac4bcccfacd))
- Add Takma Web Preview section to README. ([2db492de](https://github.com/jam53/Takma/commit/2db492de99eea2b9279456139f3aa2047a697aa4))

### Fixed
- Prevent PopupWindow from closing when selecting text. ([21ba6d55](https://github.com/jam53/Takma/commit/21ba6d5518e3a90f5a06d1c1dde6f7381e6d53a8))
- Issue where keyboard shortcuts were not recognized if typed in uppercase. ([821f5ec5](https://github.com/jam53/Takma/commit/821f5ec542a4035562c376824df91e8897597631))
- Bug causing duplicated keystrokes when typing in checklist titles (replaced `<span>` with `<textarea>`). ([cf1b9ffd](https://github.com/jam53/Takma/commit/cf1b9ffdb8a215e6dadfe5df2b909f4d8780f78f))
- Issue where closing the PopupWindow via the close button didn't resolve the `getAnswer()` promise. ([f9eed6d1](https://github.com/jam53/Takma/commit/f9eed6d185b0beb19268889534b78ce2635522fa))

### Changed
- Update dependencies. ([2c11cc47](https://github.com/jam53/Takma/commit/2c11cc4788da2ebe72be3867eafa9e72837c695e))
- Upgrade to Svelte 5. ([baeb531f](https://github.com/jam53/Takma/commit/baeb531f1cc58a7d8ec6ff85022bb2c1f64e0b60))

## [1.6.3] - 2024-10-14
### Added
- Allow users to exit onboarding process early. ([af70740e](https://github.com/jam53/Takma/commit/af70740ed1b557879a9e304503464bfbea668473))

### Fixed
- Long todo items in checklists not wrapping to the next line. ([3220029c](https://github.com/jam53/Takma/commit/3220029c0ca84f638d01cc30d5b099f68a65be1c))
- Paths resolving incorrectly to the `resource` directory after upgrading to Tauri 2.0. ([f10ad70e](https://github.com/jam53/Takma/commit/f10ad70e3162020c9d3e7e94e6178e1c9de45bb3))

### Changed
- Remove the `getImageUrl()` function (replaced by Tauri's `convertFileSrc()`). ([714bd195](https://github.com/jam53/Takma/commit/714bd1951a717cf423a72a3ed6ec56d8310f5375))

## [1.6.2] - 2024-10-12
### Fixed
- Oversized theme toggle button on Linux. ([0336b061](https://github.com/jam53/Takma/commit/0336b061e543ea3de0f6b4729270ed1c4704829f))
- Prevent crash when setting save directory on Linux. ([3d153d41](https://github.com/jam53/Takma/commit/3d153d417725c6d8aca0430ee4015237943e44c2))

### Changed
- Update `beforeBundleCommand` for Linux after Tauri 2.0 upgrade (binary filename capitalization). ([3f5bae05](https://github.com/jam53/Takma/commit/3f5bae051aeb43b7bb3060b8d8e4c6b17540e066))

## [1.6.1] - 2024-10-11
### Fixed
- Issue where the `backgrounds` subfolder was excluded from the build after Tauri 2.0 upgrade. ([f536510e](https://github.com/jam53/Takma/commit/f536510e0aec1807e7d625542339ff01bef99148))
- Issue where the close button in the title bar had rounded corners when docked on Windows 11. ([ca9e49b0](https://github.com/jam53/Takma/commit/ca9e49b09a95a6f91fc1c7e5d6ea1844a373ffb2))

## [1.6.0] - 2024-10-11
### Added
- Add the ability to reorder checklists within a card. ([7d5d977e](https://github.com/jam53/Takma/commit/7d5d977e01751e0565b05d5759883147171f537c))
- Enable WebP compression for generated thumbnails. ([37dfd106](https://github.com/jam53/Takma/commit/37dfd106f1c5fb95456f0b6047273d800b33a14c))
- Add string extension functions for common file path operations. ([c77f43b0](https://github.com/jam53/Takma/commit/c77f43b0f7eda38877fcf150f8086beb27f3876f))

### Fixed
- Issue where the `CardDetails` screen displayed rounded corners when docked/fullscreen on Windows 11. ([a9e37421](https://github.com/jam53/Takma/commit/a9e37421218a81fdf5424c810472707b15c52655))
- Regression where "Show in folder" for card attachments stopped working after Tauri 2.0 upgrade. ([ec6f9ef9](https://github.com/jam53/Takma/commit/ec6f9ef9d8469fe0a1248eb0dd13802e2d323420))
- Issue where `CardDetails` stopped capturing keydown events after interacting with `Attachments`. ([c7287d4c](https://github.com/jam53/Takma/commit/c7287d4c505f7620ee7aaf252129437dd06b0967))
- Issue where deleting attachments only removed the file, not the reference in the save file. ([b14adb0a](https://github.com/jam53/Takma/commit/b14adb0a2286a8d303fca1c2bbe6bc9b7a624ac2))
- Issue where `CardDetails` stopped capturing keydown events after interacting with `CheckLists`. ([a6325525](https://github.com/jam53/Takma/commit/a6325525376308de97e6bec7c9b4ac9b2aed86c8))
- Issue where the `PopupWindow` component wouldn't capture keydown events. ([9094e531](https://github.com/jam53/Takma/commit/9094e531c488c8d564f1d6fdeb33538cc388925f))
- Bug where changing application language did not persist due to premature refresh. ([9cd097f5](https://github.com/jam53/Takma/commit/9cd097f5ae0daf4ee1b673983216352236ac6788))

### Changed
- Update dependencies. ([c55c157a](https://github.com/jam53/Takma/commit/c55c157acc703e08a38e18dc32674defeb57ef6a))
- Change the order of due date and labels in `CardDetails` (labels now above due date). ([3601c0e0](https://github.com/jam53/Takma/commit/3601c0e037007d2c9c29a643d7088dce118d989d))
- Activate "editing description mode" automatically in `CardDetails` only if description, checklists, and attachments are all empty (previously just no description). ([e6c3361c](https://github.com/jam53/Takma/commit/e6c3361cd0f51f6c5f3eb300c11f4dfabc6e9daf))
- Upgrade to Tauri 2.0. ([c47e37a9](https://github.com/jam53/Takma/commit/c47e37a9394cbab78bfffe44fa6e6b1474ecc11b))
- Make the EasyMDE toolbar sticky; ensure bottom line remains visible while typing in description. ([b5a051ab](https://github.com/jam53/Takma/commit/b5a051ab15da87c1e6c225ef69675463ef284f35))
- Standardize path conventions (relative paths start with `./`, directory paths end with `/`). ([2a60a35c](https://github.com/jam53/Takma/commit/2a60a35cf99c51f7ea567920cc7355d9ae6fa52e))
- Refactor file saving system to allow saving to arbitrary locations, not restricted to Tauri `BaseDirectory`. ([30b7e61f](https://github.com/jam53/Takma/commit/30b7e61f258eaf96ddbc626b3ec094ed0a023b51))
- Re-enable cover images while dragging cards, without layout shifts or drag issues. ([f99f4eaa](https://github.com/jam53/Takma/commit/f99f4eaa559a419c9c0d1cbdc68f4ffd005aa66d))
- Replace manual file path concatenation with Tauri's `resolve` method. ([a350a832](https://github.com/jam53/Takma/commit/a350a8321ccde546f7ddf89451d9471f6d47e21f))
- Update dependencies. ([fca59ad5](https://github.com/jam53/Takma/commit/fca59ad53090adf499db257255d4e33d3a85b299))
- Replace `<span>` tag with `<input>` for todo items in checklists. ([a41b0f99](https://github.com/jam53/Takma/commit/a41b0f99778009f4c3a4aedffc0764cef4b1202a))

### Performance
- Improved image loading times (~93%) via thumbnail caching system. ([70454339](https://github.com/jam53/Takma/commit/704543396dc01bbcc152c96ba222277bdfeab84d))

## [1.5.3] - 2024-09-15
### Fixed
- Issue where card description text box lost focus after the first keystroke. ([5f007915](https://github.com/jam53/Takma/commit/5f0079157a1800bf56fe22e49fac9d1dd4ff0806))

## [1.5.2] - 2024-09-07
### Fixed
- Crash on Linux due to missing `fs` permissions for hidden folders (`requireLiteralLeadingDot` issue). ([bcf949c9](https://github.com/jam53/Takma/commit/bcf949c9cb1006967b28a5c5b845ed4fb10784eb))
- Issue with duplicating cards containing local images in markdown descriptions (images disappeared if original deleted). ([33ed3b9f](https://github.com/jam53/Takma/commit/33ed3b9f9014a06a0dd223791604c7a11ebc844e))

### Changed
- Update dependencies. ([694bacc8](https://github.com/jam53/Takma/commit/694bacc8e7204fb1227d3fc0d80922da7032179c))
- Add missing `fork` dependency in Cargo.toml for Linux builds. ([8f68e02e](https://github.com/jam53/Takma/commit/8f68e02e4272607c7ed677379f06b9e7482adb7d))
- Update `beforeBundleCommand` in `tauri.conf.json` for Linux compatibility and add Linux UPX binary. ([cc0d9655](https://github.com/jam53/Takma/commit/cc0d9655fdd3e1a4052b0615a603ba13a8952604))

## [1.5.1] - 2024-09-06
### Fixed
- Issue where EasyMDE was undefined in release builds, breaking the markdown editor. ([8be6fce5](https://github.com/jam53/Takma/commit/8be6fce53a9e193af7c595351710f8a5d6843161))

## [1.5.0] - 2024-09-06
### Added
- Add i18n (internationalization) support for EasyMDE. ([57b0c627](https://github.com/jam53/Takma/commit/57b0c627e255c26fea28ea594250f39f0914b109))
- Enable support for embedding local images in markdown descriptions of cards. ([7b2c6e88](https://github.com/jam53/Takma/commit/7b2c6e8841dd8a8f1359c222aab16db0c4b1509b))
- Integrate EasyMDE (custom build with underlining support) for editing card descriptions. ([0031656a](https://github.com/jam53/Takma/commit/0031656a1a5b55525279c430a5b5fa253e7fc0c4), [2709a7a3](https://github.com/jam53/Takma/commit/2709a7a38ba6b6890fd331541d16f0cbe916456f))

### Fixed
- Issue where closing an opened card using `ESC` or `Ctrl` + `W` would instead close the board. ([ab029e64](https://github.com/jam53/Takma/commit/ab029e642de4e07e1af19193e6a01aa244095ce0))

### Changed
- Style EasyMDE on the card details screen to match Takma's design. ([7b21210e](https://github.com/jam53/Takma/commit/7b21210e3df122188a57e70e302697cfca2d8c45))
- Made it so a new line creates a line break (`<br>`) in rendered Markdown for card descriptions. ([5a038399](https://github.com/jam53/Takma/commit/5a03839916d7d3be8fa803ff9e48b8be47bad959))
- Add application screenshot to README. ([c9e8d917](https://github.com/jam53/Takma/commit/c9e8d9179034251ed8354b9353a1c836225c67b9))
- Update project description in readme. ([e757f214](https://github.com/jam53/Takma/commit/e757f2142a0faba354cb73eda915b3f715b5ca78))

## [1.4.15] - 2024-08-03
### Fixed
- Increase height of labels with text to ensure tall letters fit. ([78fec62f](https://github.com/jam53/Takma/commit/78fec62f2d39a753541f18f7e6a07cb78ce14a99))
- Issue where icons on cards overflowed instead of wrapping. ([00149d98](https://github.com/jam53/Takma/commit/00149d98310c5ffe97ae6b00de62f040c477d852))

### Changed
- Update dependencies. ([34a0b5af](https://github.com/jam53/Takma/commit/34a0b5af1255e039ff561c472db993bed6972a0e))
- Remove `@types/marked` dependency (Marked provides its own types). ([1f778fe7](https://github.com/jam53/Takma/commit/1f778fe7cab67585a1dbfbdb21806795e13e02f6))
- Update paths to installers in build instructions. ([26d3b2aa](https://github.com/jam53/Takma/commit/26d3b2aacb4eb5be3446d9a1fd6952165f7b0d94))
- Update README.md. ([0757161b](https://github.com/jam53/Takma/commit/0757161be876c20abf1f461ae8609988c462c3d1), [4b321394](https://github.com/jam53/Takma/commit/4b3213942add856d057d4dd18b1b6d84c34cc3c5))
- Update documentation. ([6ec5fdfe](https://github.com/jam53/Takma/commit/6ec5fdfefa45d7f6fa74b5e23321973e0a0e189e))
- Add LICENSE file. ([bea60102](https://github.com/jam53/Takma/commit/bea601025d1366b6464385e33fe9ca920e96f164))

## [1.4.14] - 2024-07-07
### Fixed
- Bug where cards with descriptions containing links couldn't be opened (breaking change in `marked` v13). ([ad8dd73b](https://github.com/jam53/Takma/commit/ad8dd73baa774f8fb996ef46742c69ee2a070802))

## [1.4.13] - 2024-07-07
### Added
- Display the hour of the due date on cards. ([aed597e1](https://github.com/jam53/Takma/commit/aed597e191491cdf1b291dd2504a9d605599faff))
- Add tooltip to the due date label on cards. ([7dec1abb](https://github.com/jam53/Takma/commit/7dec1abba4a6eae934bf3ff6d6bdbaa0f54e7f69))

### Fixed
- Issue where due dates were always displayed in `en-us` locale instead of user's locale. ([d9ab8008](https://github.com/jam53/Takma/commit/d9ab8008767cbcfeaa9589d4174cffc7a873a849))
- Issue where board background images or card attachments/covers weren't always deleted from disk ("dangling files" check added). ([daec8284](https://github.com/jam53/Takma/commit/daec82843de97f25fc26f3f3be7a8fbf2bf8911c))

### Changed
- Update dependencies. ([29c0d6d3](https://github.com/jam53/Takma/commit/29c0d6d3452c9d0f1d7afede836e9e361c58dac0), [5a459b56](https://github.com/jam53/Takma/commit/5a459b569993f203f83d22c1d8a45477629e8325))

## [1.4.12] - 2024-05-15
### Changed
- Disabled spellcheck when editing card title/description on `CardDetails` screen. ([573cad3a](https://github.com/jam53/Takma/commit/573cad3a384a89e2880086a572bcf88fb6a042b9))

## [1.4.11] - 2024-04-20
### Added
- Show a popup asking for the title when duplicating or pasting a board. ([a6dc5a34](https://github.com/jam53/Takma/commit/a6dc5a34a3749b20c47475d78521417ae89798db))

### Fixed
- After adding a new card, ensure the list scrolls down to show it, even with slow-loading cover images. Only scroll *after* card is added, not on button click. ([7c9c6906](https://github.com/jam53/Takma/commit/7c9c6906e6072235ae5b651b6f5ef00252a5f309))

## [1.4.10] - 2024-04-13
### Added
- If a custom background image is selected during board creation, offer to save it for future use. ([b71d51ec](https://github.com/jam53/Takma/commit/b71d51ecb10085e97d5ffc79e394a41dbea4c99c))
- Context menu (duplicate, copy/paste, remove) for Board Buttons on Welcome Screen via right-click. ([2f66f021](https://github.com/jam53/Takma/commit/2f66f021b27ba4e1c49bcedc81b607cdac5c88c8))

### Fixed
- Issue where a newly created card might not be in view if the list contained cards with cover images loading later. Prevent list scrolling down on every keystroke while typing new card title. ([5757795b](https://github.com/jam53/Takma/commit/5757795b0ff739173f9e93e48f3dcc66562a8196))
- Issue where key down listeners persisted after element destruction (e.g., pressing enter on list title created a board). ([6f512203](https://github.com/jam53/Takma/commit/6f5122030a6af4a46c5a03dd6bd2c4d8fdd2149f))
- Issue where the title bar and navbar rendered on top of each other after onboarding. ([7a60bfdc](https://github.com/jam53/Takma/commit/7a60bfdc690fe83fc968302185a7c8ba247cd9af))
- Crash when copying/duplicating items with large files (files now copied to OS temp folder instead of read into memory via IPC). ([72db519d](https://github.com/jam53/Takma/commit/72db519dc19ef01fa4e3dddf73e5a2449b335d98))
- Issue where Takma failed to write files with filenames longer than 255 characters. ([4ef564ec](https://github.com/jam53/Takma/commit/4ef564ec5eb371e94c165775939de77fea5c3390))
- Issue where context menus sometimes appeared off-screen. ([d58fe468](https://github.com/jam53/Takma/commit/d58fe46820546384cd70dc18313d5d0e28333801))

### Changed
- Changes made to a card are now saved immediately, not just when closed. ([7ad12e1c](https://github.com/jam53/Takma/commit/7ad12e1c1b6e491d74632d26ca9c13073e882fc5))
- Update dependencies. ([4feedf00](https://github.com/jam53/Takma/commit/4feedf000c8be7d260e1382a45428cf57480160b))

### Performance
- Limit intro animation on lists to only initially visible lists to prevent lag when adding new lists to large boards. ([127119b5](https://github.com/jam53/Takma/commit/127119b5e8cac1d0ba257d7511e881fe8a716a36))

## [1.4.9] - 2024-03-23
### Added
- Add missing strings to i18n. ([c3c21d19](https://github.com/jam53/Takma/commit/c3c21d1946f0a5e591ad2a3f6e5c762dea20995b))
- Label titles are now also visible in the "Filter cards" popup on the board screen. ([cf94b7a9](https://github.com/jam53/Takma/commit/cf94b7a96df89cfd696410a612756764c31a45d8))
- Display label titles on cards within the board screen. Users can toggle the visibility of label titles by clicking on the labels. ([a2eb4b2b](https://github.com/jam53/Takma/commit/a2eb4b2bf8fc1010f090ba7d9b59a919db3660d1))
- Labels can now have a title. ([32e8f087](https://github.com/jam53/Takma/commit/32e8f087a4c8f5fe145f51dfbcb26daafbd99ec0))

### Fixed
- Reimplement Tauri's window state plugin manually to fix tiny window issue when closed while minimized. ([a96b8da9](https://github.com/jam53/Takma/commit/a96b8da9a0cc05404bdce8c71acf363e9d55d34d))
- Issue where the Takma logo wouldn't appear in release builds. ([955dbc9a](https://github.com/jam53/Takma/commit/955dbc9aa98ba730fd1db87daffea44034f31f38))
- Longstanding bug where window was tiny on launch if closed while minimized. ([9d2ef0b6](https://github.com/jam53/Takma/commit/9d2ef0b691cff90acddec8dfd3eceacca1e4bfd8))
- Issue where the label color picker would sometimes go off screen. ([04fe6ac1](https://github.com/jam53/Takma/commit/04fe6ac1bb85a58f9a5cb2ebce3e5902891ac2b0))
- Made it so cards on the board screen can't be filtered on more than one due date. ([8ac8ebca](https://github.com/jam53/Takma/commit/8ac8ebca776851ba3c84b970ee0c37c254d60815))

### Changed
- Update Jam54LogoMonochrome.svg. ([9ac9d6b9](https://github.com/jam53/Takma/commit/9ac9d6b9d3393dc0db4030d011e5566ecc0f8dc4))
- Update dependencies. ([91c83f34](https://github.com/jam53/Takma/commit/91c83f34776815b380521cb8c55cabd807d27817))

## [1.4.8] - 2024-01-06
### Fixed
- Fixed a bug where you couldn't return to the WelcomeScreen. ([8c03aa69](https://github.com/jam53/Takma/commit/8c03aa697c2514de41b7df8eb0f8a057a22667d6))

## [1.4.7] - 2024-01-06
### Changed
- Rewrote file handling to avoid `writeBinaryFile()` / `readBinaryFile()` due to Tauri IPC overhead. Now uses file paths, processing data in the backend. ([4e1ac4b2](https://github.com/jam53/Takma/commit/4e1ac4b21c29b327d2b00b8a7ba651657256a5de))

## [1.4.6] - 2024-01-03
### Changed
- The actions holder on the card details screen now sticks to the top on scroll. ([3f937f98](https://github.com/jam53/Takma/commit/3f937f980b4f8432d9cc893f75982523e500ec05))

## [1.4.5] - 2023-12-31
### Fixed
- Issue where clicking a card's description to edit it reset scroll position to the top. ([1ad9c9ec](https://github.com/jam53/Takma/commit/1ad9c9ec4512b2110dbc6d73285a2ce7d22c05c5))

## [1.4.4] - 2023-12-24
### Fixed
- Issue where images would sometimes appear blurry after rescaling. ([bb9a3a04](https://github.com/jam53/Takma/commit/bb9a3a043db4a82348f8b5414dfd5f4ba2fa71db))

### Changed
- Updated dependencies. ([9b518b33](https://github.com/jam53/Takma/commit/9b518b33d516c0d819c8eb66be1ca5bd5b12b47d))

## [1.4.3] - 2023-11-27
### Fixed
- Issue where the title in the CardDetails screen wouldn't take up the entire width. ([3340b877](https://github.com/jam53/Takma/commit/3340b87743085d9c2ed3fb58db27787d93838d14))

### Changed
- Update BuildingTheProject.md. ([27374476](https://github.com/jam53/Takma/commit/27374476a1427b0013777da043258b64b066e26e))

## [1.4.2] - 2023-11-23
### Fixed
- Issue where the "amount of cards matched filters" text below a List's title wouldn't update correctly when typing multiple characters in the search bar. ([bc772f0b](https://github.com/jam53/Takma/commit/bc772f0b60af2bc694bb4c2bea6f7f626f78313b))

### Changed
- Replaced `GetImageUrl()` workaround with Tauri's `convertFileSrc()` method, improving image loading times. ([0b210d63](https://github.com/jam53/Takma/commit/0b210d6362b2c5e0d5c4c29ff4b3afee46ea7d9a))
- Updated dependencies. ([afba2d8e](https://github.com/jam53/Takma/commit/afba2d8ea7c5fb1b74f12de1d716a386b2187a49), [81d70f29](https://github.com/jam53/Takma/commit/81d70f2993016576eb1abd646c95b9675c7a462b))

## [1.4.1] - 2023-11-15
### Added
- When a filter is applied on the board screen, each list now displays the count of cards matching the filter. ([e9b4b849](https://github.com/jam53/Takma/commit/e9b4b84900ba154684b7f28eca5bc0db5d53d79c))

### Fixed
- Issue pasting cards/lists with labels into a different board (missing label colors are now created automatically). ([5c3031c6](https://github.com/jam53/Takma/commit/5c3031c62e32956562a583815f6454fd8ccd1ef1))

## [1.4.0] - 2023-11-13
### Added
- Cards and lists can now be copied and pasted between different boards via context menus. ([b6c2ba44](https://github.com/jam53/Takma/commit/b6c2ba44bf3e17eeea4313a96ae7c6ea72dba97b))
- Transition effect when hovering over buttons in list and card options menus. ([ad07dba2](https://github.com/jam53/Takma/commit/ad07dba22183844c003a95e995d04ebe76787aef))

### Fixed
- Issue where the card details screen would overflow behind the title bar in fullscreen. ([4fd3e611](https://github.com/jam53/Takma/commit/4fd3e6113651059d740092f685bad704e633cad9))
- Creation date on cards now displays correctly according to the user's language setting. ([147c716c](https://github.com/jam53/Takma/commit/147c716c83acf8fdcc26e22334f91691947e9424))
- Issue where removing a cover image from a card didn't delete the image file from the filesystem. ([2dd50dcc](https://github.com/jam53/Takma/commit/2dd50dcc19cf93ea849184e628f997b828024035))
- Issue where duplicated lists/cards were not deep copies and shared references to attachments/cover images. ([c85871ae](https://github.com/jam53/Takma/commit/c85871aea2d4406bdb167c0ca9fd31eb82c4752c))

### Changed
- Updated dependencies. ([205be0e6](https://github.com/jam53/Takma/commit/205be0e6a70bc8908d7b6a40bcfbdc679fea5580))

## [1.3.0] - 2023-11-03
### Added
- Context menu to cards (right-click) for quick duplicate/delete actions. ([618b4e34](https://github.com/jam53/Takma/commit/618b4e3421842a393da292855600c89137d30191))

### Changed
- Updated dependencies. ([8cc4bd18](https://github.com/jam53/Takma/commit/8cc4bd187066a1caadd18e78b578e08eec0c7833), [f50d6345](https://github.com/jam53/Takma/commit/f50d6345bc02752c01057c8ccf1c88a21068e2b9))

## [1.2.6] - 2023-09-28
### Fixed
- Bug where pressing ESC or Ctrl+W while the Due Dates Overview popup was open on the board screen would return to the welcome screen instead of just closing the popup. ([356e23e8](https://github.com/jam53/Takma/commit/356e23e88b36c6d81092260c14fda1d4b43ccc08))

## [1.2.5] - 2023-09-26
### Changed
- When the Due Dates Overview popup is viewed on the board screen, items now display "list title + card title" instead of "board title + card title". ([305fcd7d](https://github.com/jam53/Takma/commit/305fcd7da195076f71b73af1d2efcbf83b13d1f2))

## [1.2.4] - 2023-09-05
### Changed
- If the user opens a Takma link, the Takma window now gets focused/brought to the front. ([67220720](https://github.com/jam53/Takma/commit/67220720b69b396c78133f2e1a43a1f719adf0d6))

## [1.2.3] - 2023-09-01
### Added
- The due dates overview button can now also be used on the board screen. ([e14eb536](https://github.com/jam53/Takma/commit/e14eb536416199be6573a406f0df3906c8d8ec39))

### Changed
- The "create new board" button is now displayed after all board buttons on the welcome screen, instead of before. ([d3316095](https://github.com/jam53/Takma/commit/d33160957a4c9a61057df8895fcb45bb29521fc7))

## [1.2.2] - 2023-08-31
### Fixed
- Issue where the favorite icon on board buttons had a z-index causing it to display above popups/overlays. ([b0b7df7f](https://github.com/jam53/Takma/commit/b0b7df7f9f01c7b0f8f2da33465c30d57966a399))

## [1.2.1] - 2023-08-31
### Fixed
- Issue where the drop-shadow of the favorite icon on board buttons disappeared on hover. ([b2222352](https://github.com/jam53/Takma/commit/b2222352976a97fbe741277e9d83697f107ac4e5))

## [1.2.0] - 2023-08-31
### Added
- Boards can now be favourited. ([1d38cfd7](https://github.com/jam53/Takma/commit/1d38cfd7c488d761f771f7e639e37621647ebafe))
- Support for deep linking (opening specific boards/cards via custom URL scheme). ([ceec45e6](https://github.com/jam53/Takma/commit/ceec45e694c3ceec2a9fc163ab8a11b4b6c841fe))

### Fixed
- Issue where pressing Tab while editing a card description focused the next element instead of inserting a tab character. ([b25c1b74](https://github.com/jam53/Takma/commit/b25c1b74ff7f7729579a851e1045c71596466d22))
- Issue where Alt+Tabbing caused loss of focus on the last active element, requiring a click to resume typing. ([75ff8c08](https://github.com/jam53/Takma/commit/75ff8c08d168ee2550cdf8f83cdf60df0503d983))

## [1.1.3] - 2023-08-27
### Fixed
- Issue where the right margin added to lists with a scrollbar was sometimes not applied. ([71f44b9c](https://github.com/jam53/Takma/commit/71f44b9cb0bd216bae4638a3ff651fe06a90cd3b))
- Issue where closing the custom PopupWindow with Enter sometimes caused unwanted behavior (Enter key event not consumed). ([f5ec44d3](https://github.com/jam53/Takma/commit/f5ec44d307c68fa86e513b8b8593a878e3cd8dcb))

## [1.1.2] - 2023-08-27
### Fixed
- Issue where lists overflowed the window when the list title was too long. ([d509405d](https://github.com/jam53/Takma/commit/d509405dd3a9ef50035a0cbe2611a19e4b73f4b7))

### Changed
- Made it so the Enter key can be used to close the custom PopupWindow (equivalent to clicking Yes/OK). ([10d38ac9](https://github.com/jam53/Takma/commit/10d38ac9b3568787f9d1fbb4d0bd0f78e9eb2598))

## [1.1.1] - 2023-08-26
### Fixed
- Issue where the Attachments section wouldn't refresh to show newly added attachments via drag and drop. ([a76c97e4](https://github.com/jam53/Takma/commit/a76c97e4929b654d725445f3d2859ad2bf21de99))

## [1.1.0] - 2023-08-26
### Added
- Support for underlining with double underscores (`__underline__`) in Markdown. ([e2fa8aea](https://github.com/jam53/Takma/commit/e2fa8aea872b42830df6848f080e1ae14c710032))
- Added a custom PopupWindow component instead of using the native OS dialogs. ([84c384b6](https://github.com/jam53/Takma/commit/84c384b646cadadf68092f90cc605b881853c65c))
- Added a confirmation window before restarting the onboarding process. ([7c1bc783](https://github.com/jam53/Takma/commit/7c1bc78316ce3350ae9a459f2e1d633faa32df3e))
- Added DueDatesOverviewPopup to the welcome screen showing cards with due dates across all boards. ([bc0adaed](https://github.com/jam53/Takma/commit/bc0adaedf45f04f6234c36c4c8d5c57216a0832a))

### Fixed
- Issue where the Attachments section refreshed on every keystroke while typing in the description, causing lag. ([921fcf35](https://github.com/jam53/Takma/commit/921fcf35ab25cf769fa5705a803af6a52796f5a0))
- Issue that caused the DueDatesOverviewPopup to be stuck displaying in one language. ([02348795](https://github.com/jam53/Takma/commit/02348795d45502a8d17c23207a578d569384743b))
- Issue where Takma would be stuck loading translations if the user's display language was unsupported. ([ab369873](https://github.com/jam53/Takma/commit/ab369873dddcd673b91bfce3e81238e3fb98a588))
- Typo in the English translation. ([f7651904](https://github.com/jam53/Takma/commit/f7651904892bef5c0b69bc6bc7bed15989fb97f1))

### Changed
- Updated dependencies. ([6c6d3b11](https://github.com/jam53/Takma/commit/6c6d3b11e677792be374a60cea4e73ba50245b1b))
- Disabled Esc and Ctrl+W shortcuts during onboarding. ([78ab552f](https://github.com/jam53/Takma/commit/78ab552f4491591105ae5a444f98f2c9fdf3001a))
- Made the search function case insensitive. ([c43d31c5](https://github.com/jam53/Takma/commit/c43d31c5fcffc20cfb475255505a3c769a3fe853))
- Replaced jam54LogoMonochrome bitmap with an SVG. ([e06bcbc2](https://github.com/jam53/Takma/commit/e06bcbc25bcaa45e87e7c65facab08f7d1ed1ab5))
- Increased spacing below separators on the CardDetails screen. ([591a43f6](https://github.com/jam53/Takma/commit/591a43f65523ba451ba64a7147b3b863d67c7ce5))
- Added additional onboarding steps. ([73ffe151](https://github.com/jam53/Takma/commit/73ffe151b341f334fd8b759a6efbd8b7983d8dfb))

## [1.0.0] - 2023-08-22
### Added
- Easter egg board. ([3012dac8](https://github.com/jam53/Takma/commit/3012dac8c3937bb154e3921de356b87bbf90e2e6))
- i18n (internationalization) support. ([8fe9caec](https://github.com/jam53/Takma/commit/8fe9caec867b191c820f8d59a615a7b6c8c7c384), [dfe0cc82](https://github.com/jam53/Takma/commit/dfe0cc8222315801329176743766e81254df1998))
- Onboarding tour for new users. ([ed271179](https://github.com/jam53/Takma/commit/ed271179531742d53904c264cd6ed33605ec2ebb))
- License agreement to the ChooseSaveLocationScreen. ([5425cd12](https://github.com/jam53/Takma/commit/5425cd124c729ea7837de029364f812e8dbea12a))
- Ability to filter cards on the board screen. ([ef6f6854](https://github.com/jam53/Takma/commit/ef6f68548f84305c77ece521700999aa87b4a190))
- Ability to sort boards on the welcome screen. ([90d68dce](https://github.com/jam53/Takma/commit/90d68dce9f1bb8786de2ddf72f2c3d9cb4718f02))
- Ability to filter boards by title on the welcome screen via searchbar. ([cf6f6612](https://github.com/jam53/Takma/commit/cf6f66121d313b3b22504eb9e8a4eea275f8be7b))
- Ability to search for cards on the board screen via searchbar. ([b9b0c616](https://github.com/jam53/Takma/commit/b9b0c6164d7fd1fbfa5ee9f417b32df94c921b13))
- Ability to copy a link to a board from the navbar. ([49436e5c](https://github.com/jam53/Takma/commit/49436e5ca015d94562a19ad3ddd770cc3f3aab0e))
- Cards can now be viewed in fullscreen. ([925b1ebc](https://github.com/jam53/Takma/commit/925b1ebc427b2306e240540bb066a2648d0095e5))
- Ability to sort lists based on card due dates. ([97fb9f1b](https://github.com/jam53/Takma/commit/97fb9f1b43c5b257996b7ee8f2a1bb90ebcdff55))
- Ability to delete cards. ([bb9267f8](https://github.com/jam53/Takma/commit/bb9267f8657187bdf448b33da3214ba1d25d4e2c))
- Ability to add due dates to cards. ([b141a53c](https://github.com/jam53/Takma/commit/b141a53c2d9fea6dd90b7ef81836509cfd88ef29))
- Ability to add cover images to cards. ([6f0a7994](https://github.com/jam53/Takma/commit/6f0a799441feb12f42d982ea699df340660dbfcb))
- Ability to drag and drop files onto a card to add as attachments. ([16fd8dbc](https://github.com/jam53/Takma/commit/16fd8dbc4508afabe9723a2c309de9f87d73c6c2))
- Ability to add/remove attachments, open them, show in folder, copy path. ([d936eeb0](https://github.com/jam53/Takma/commit/d936eeb0e9fd91101884c8613a75f8bc0aef2f8a))
- UI to show attachments in CardDetails. ([558729ab](https://github.com/jam53/Takma/commit/558729ab4be4af75c707821671952ae03f9f861e))
- Added another background image. ([8d8c8987](https://github.com/jam53/Takma/commit/8d8c8987de3712daac3daf86148450bad283dce6))
- Ability to add checklists to cards. ([ce24c7e7](https://github.com/jam53/Takma/commit/ce24c7e7cbb609be79c10a687c69e28d9911ae46))
- Ability to delete checklists. ([774706b7](https://github.com/jam53/Takma/commit/774706b7c9d438a6d9dd86cad906ab465b3a1687))
- Todo items in a checklist can now be dragged and dropped. ([43f6f89d](https://github.com/jam53/Takma/commit/43f6f89d7a88ac2538fd77040f28763c34b2da99))
- Ability to add new todo items to a checklist. ([94458d32](https://github.com/jam53/Takma/commit/94458d320f474623b8d698f1d19d2782e0ff5a19))
- Ability to edit the content of todo items. ([b5678415](https://github.com/jam53/Takma/commit/b56784155b7bfbf695ee63b71b84fe5fb57aa813))
- UI for checklists. ([a632fe27](https://github.com/jam53/Takma/commit/a632fe2792389c06d1c6b58adf417a0b8fb14ff3))
- Title for Checklists section. ([e932f117](https://github.com/jam53/Takma/commit/e932f117b5690ef06f41a21221249b1c1547756b))
- Display card creation date on hover over the separator below the title. ([160b05c7](https://github.com/jam53/Takma/commit/160b05c79eb1f2cea45fd7d1413b90aa68a5b337))
- Ellipsis + tooltip for card action buttons. ([f1d975ed](https://github.com/jam53/Takma/commit/f1d975ed9a980a1d3676898414913f99854b9bde))
- Function to get absolute path to save directory. ([38dc3d7c](https://github.com/jam53/Takma/commit/38dc3d7cdf3e131d9221a0048c81ae32e0d8cec0))
- Added image smoothing to resized images using ResizeImage.js. ([89e5fe6e](https://github.com/jam53/Takma/commit/89e5fe6ee7a2fcabca5ec4dd376f718583987502))
- `ResizeImg.js` action for dynamic image resizing in `<img>` elements. ([2d892cbf](https://github.com/jam53/Takma/commit/2d892cbfbd5f1493eb4355009c04c598b789f815))
- Loading spinner instead of displaying "%%Loading...". ([ee9ead16](https://github.com/jam53/Takma/commit/ee9ead16d6d0d514bc0f1da79dc392541a534498))
- Ability to delete labels from boards (also removing them from cards). ([abcc0fc2](https://github.com/jam53/Takma/commit/abcc0fc20eb6089948fcc7ac9eabac798dd0a9de))
- Ability to edit the color of existing labels. ([1d040160](https://github.com/jam53/Takma/commit/1d0401603b61d37cd78a4160dc4632039492b32e))
- Ability to create new labels for a board. ([48208279](https://github.com/jam53/Takma/commit/4820827970f54cd626fc6ee03cb4d3c767fbf2bf))
- Ability to add/remove labels to/from cards. ([dcb9fc98](https://github.com/jam53/Takma/commit/dcb9fc98bfbd6a3e8533e5510af685bb63380496))
- User can choose save data location (localappdata vs My Documents). ([63ce2e04](https://github.com/jam53/Takma/commit/63ce2e045047442da7112ccff9bdc09411b023d6))
- Syntax highlighting for code blocks in Markdown. ([7b3621e9](https://github.com/jam53/Takma/commit/7b3621e99455a44f196d8ec1d0e20c04b2ff33c1))
- Markdown support for card descriptions. ([29b892d6](https://github.com/jam53/Takma/commit/29b892d608f490577e2683dd7efb900e33cc2c72))
- Ability to edit card descriptions. ([c29728a4](https://github.com/jam53/Takma/commit/c29728a4b5736bf2e18edb3011c978671bec8080))
- Actions section (right side) of the card details element. ([db37066b](https://github.com/jam53/Takma/commit/db37066bbb46a40483d0fe4527c22d8516f18fee))
- Ability to edit card titles. ([1e79feb5](https://github.com/jam53/Takma/commit/1e79feb51455c328cf2059decab34b127f26b16a))
- CardDetails component. ([fdd8bd71](https://github.com/jam53/Takma/commit/fdd8bd710421f45eb22360bcb2a490610d6fb69b))
- Ability to add cards to lists. ([fee21568](https://github.com/jam53/Takma/commit/fee2156879335d23394c656230c063a682f4178d))
- Options menu for lists. ([86444104](https://github.com/jam53/Takma/commit/86444104c4f4b586d81655225ca7c40a8e94c235))
- Ability to edit list titles while still allowing dragging. ([22e355c8](https://github.com/jam53/Takma/commit/22e355c8cc55a141c68c7a990312b5321b6c89d1))
- Drag and drop functionality for lists and cards. ([d87982a7](https://github.com/jam53/Takma/commit/d87982a75222c7c0ff7affb0e007c3668b41f38e))
- Ability to create lists. ([8ef8ad26](https://github.com/jam53/Takma/commit/8ef8ad260539b841faceecf305f99dedcb8f622a))
- Tooltip indicating how to change board background image. ([65ede2a5](https://github.com/jam53/Takma/commit/65ede2a5db584c4acbbf0d8ec1548a650b0c0342))
- Ability to change board background image (right-click or drag-drop). ([18c22ed3](https://github.com/jam53/Takma/commit/18c22ed3da57209108f87278620ed9956bd10a86))
- Custom titlebar. ([7bfe0b71](https://github.com/jam53/Takma/commit/7bfe0b71120f0760dfe540786a6ab4a8a3ea1e56))
- Ability to delete boards. ([ac012307](https://github.com/jam53/Takma/commit/ac0123073f54bb433bcb9e7ccee1a124e4c17cad))
- Intro animation for boards on the welcome screen. ([5dc9340c](https://github.com/jam53/Takma/commit/5dc9340c8616cb403adfc41af86bb67876809299))
- Added new background images. ([f7c09d04](https://github.com/jam53/Takma/commit/f7c09d04787654da626fc902342a26715130a415))
- Ability to create new boards. ([e73a380e](https://github.com/jam53/Takma/commit/e73a380e648c47c6e71dc76cf6ca72965e6fa2ed))
- Added Nunito font. ([030f8587](https://github.com/jam53/Takma/commit/030f8587ba168505f4b8ee9cc54905adcc15ddf2))
- Added Lato font. ([fee6b36f](https://github.com/jam53/Takma/commit/fee6b36fce763bfc79353cb9a93565eae09f6edf))
- Create button on WelcomeScreen. ([d0e99061](https://github.com/jam53/Takma/commit/d0e99061ccf536e534ab1088cd0ff60d84bdf77a))
- Light/dark theme toggle. ([fa66e59d](https://github.com/jam53/Takma/commit/fa66e59d670501b335b0c42858b3e6ec8872687a))
- Implemented save/load system. ([8e1aa3a3](https://github.com/jam53/Takma/commit/8e1aa3a3d924d725c2a7602f7e54bb390ae000c5))

### Fixed
- Fixed an issue where the addTodoButton of the last checklist in a card had too large a bottom margin. ([f71a7c37](https://github.com/jam53/Takma/commit/f71a7c37154ab95279fffe2e95faae08db9b7cf7))
- Typo in code/comments. ([de2abed3](https://github.com/jam53/Takma/commit/de2abed3da4807653a464bd6a7701f733a8286b9))
- Bug where editing the title of an empty card caused duplicated keystrokes in the title bar. ([e1902186](https://github.com/jam53/Takma/commit/e19021865a366519fe2780777a6c9390b05c0e90))
- Lag when dragging cards/lists if a card had a cover image. ([e03afa4d](https://github.com/jam53/Takma/commit/e03afa4dd1fd71761301fbe4186e8019ad6c2ee7))
- Issue where selecting text in card description sometimes closed the description/card. ([c409c220](https://github.com/jam53/Takma/commit/c409c22062e6ac004f672904bb48afb2c04d5fbc))
- Issues where pressing Escape or Ctrl+W wouldn't work or would close the wrong elements. ([bc886acd](https://github.com/jam53/Takma/commit/bc886acd4c2de116feba3ac223931159b7d51cdf))
- Errors thrown when resizing window on board screen. ([3931a217](https://github.com/jam53/Takma/commit/3931a217d677d673c613c470b90ea797eed74730))
- Overlay edges didn't cover the entire window due to border radius on CardDetails popup. ([1b039964](https://github.com/jam53/Takma/commit/1b039964443bbef14a1216b25f43669121dd2e1e))
- Issue where pasting styles into card title span was possible. ([874886e9](https://github.com/jam53/Takma/commit/874886e9e6edaa94ba5952506350208749515dad))
- Styling issues with Takma links in descriptions (1px gap). ([341ad094](https://github.com/jam53/Takma/commit/341ad094f8dfaba4f7d92bb758b46ed507958abf))
- Only the first Takma link in a description was parsed/styled. ([3958e3b3](https://github.com/jam53/Takma/commit/3958e3b3c297146bb0cc333fd56a2fd642e08a09))
- highlight.js wouldn't work in release builds. ([dd289570](https://github.com/jam53/Takma/commit/dd289570eb6f47dc63ff0b24c40aad9c083660ed))
- Takma button link styling overridden by github-markdown.css. ([494fd7bf](https://github.com/jam53/Takma/commit/494fd7bff820997b93203c7e4c45d35160b04c64))
- Inability to open card on Board B after opening one on Board A. ([32353e7d](https://github.com/jam53/Takma/commit/32353e7d729ce4158016808f74115858e85445db))
- Background image bleeding through corners when maximized. ([0a934ee0](https://github.com/jam53/Takma/commit/0a934ee0dc62dc7e86c4efa83c9af0e2a7212a43))
- Issues with Esc/Ctrl+W closing elements no longer worked correctly. ([74d10a2a](https://github.com/jam53/Takma/commit/74d10a2ae48dc57b6c2fd13c03c5b09d529339ca))
- Pressing Enter on a card broke the UI. ([c2f82f1d](https://github.com/jam53/Takma/commit/c2f82f1df29ad065e91943e34845cd121e23364f))
- List `overflowNoBottomMargin` style not being removed correctly after scrolling down. ([6dc38a46](https://github.com/jam53/Takma/commit/6dc38a467bb7c33f31c04722156692f6add7bd5b))
- Right-click propagating through lists to change board background. ([f8348e3a](https://github.com/jam53/Takma/commit/f8348e3a4d13d655541d07aee774bc86c8b96372))
- Duplicated list placed at end instead of next to original; duplicated lists/cards had same IDs. ([a8b51c32](https://github.com/jam53/Takma/commit/a8b51c32fffadb05bc6171f6c083256c09366860))
- List options menu appearing behind other lists. ([caf42a42](https://github.com/jam53/Takma/commit/caf42a42cd62c62fd5a652b0ad22834df978701a))
- Files not stored in separate subfolders per board. ([10cca3f2](https://github.com/jam53/Takma/commit/10cca3f2e9b5246cca87f0d53a4086cda5ff804e))
- New board background image not displayed until reload. ([3b6c6230](https://github.com/jam53/Takma/commit/3b6c62309c17a22842148e947b595ef576688f58))
- List title being undefined if user didn't enter a value. ([2a7caff7](https://github.com/jam53/Takma/commit/2a7caff718800201423b15daf3b6118c3ac95363))
- NewBoardPopup close button alignment. ([09ad3175](https://github.com/jam53/Takma/commit/09ad31752def67973b9b17c257591d86b888c91a))
- Titlebar close button cross color on hover. ([77b0c0f5](https://github.com/jam53/Takma/commit/77b0c0f5429652350e9d9eccc4f49149fd41d28f))
- Window corners losing rounded appearance after opening NewBoardPopup. ([ac1efb79](https://github.com/jam53/Takma/commit/ac1efb79a46677049ab38ef28aaca59b3ea0b86d))
- Board titles cut off at the bottom on welcome screen. ([70ce411d](https://github.com/jam53/Takma/commit/70ce411d1fe59ed597f3c14d59fb716c1390a709))
- `getImageUrl` crashing on invalid image path (now returns null image). ([71cbbb39](https://github.com/jam53/Takma/commit/71cbbb39d7d1f0b73e62e99964d4f80e48e5ebb9))
- Black background behind text on Board buttons didn't disappear on hover. ([c364fad2](https://github.com/jam53/Takma/commit/c364fad2adb0be82b7daf30db402492d39264565))
- Included images not displayed in release build if saved during dev build. ([0cc93616](https://github.com/jam53/Takma/commit/0cc93616a35bb1a5a464fcfe8ab2967c437de894))
- Included images not visible in build. ([ace50f0d](https://github.com/jam53/Takma/commit/ace50f0d0c49c2338c04f199c89bbb7c880ce0de))
- Images on WelcomeScreen appeared stretched if aspect ratio didn't match UI. ([2ef1ebbb](https://github.com/jam53/Takma/commit/2ef1ebbb8fdf26978d0f936a85225177df0b5b18))
- Focus border appearing on mouse click (now keyboard-only). ([505be1bc](https://github.com/jam53/Takma/commit/505be1bc1eb6fb680c5bb898c51acb650c3c2fd6))
- Bug where pressing Enter on NewBoardPopup opened another popup. ([5b2318b8](https://github.com/jam53/Takma/commit/5b2318b85102136397998cdf2b728eb1cb4caa16))
- Cards in a list couldn't be dragged if hover started over "Add a card" button. ([7e5f1865](https://github.com/jam53/Takma/commit/7e5f1865364f59c32fcce8e1e820e2f2b8abbf65))
- `animate:flip` animation wasn't playing when cards were dragged. ([6190f9d0](https://github.com/jam53/Takma/commit/6190f9d0cdeb283611f420d042409a43c80a068c))
- Color of toast notification for copying board link didn't respect theme changes. ([25710dad](https://github.com/jam53/Takma/commit/25710dadcd32a71bbf098e9c7d6f4dbbdc518eba))
- Cards sometimes couldn't be dragged. ([b2c5c8ca](https://github.com/jam53/Takma/commit/b2c5c8ca3984b6ddd023e63252e749a50e6d7549))
- Deleting a board didn't delete associated files from disk. ([84a76de1](https://github.com/jam53/Takma/commit/84a76de1f9b9bc65d8b39474a2f946eee1f79462))
- Cards with attachments/checklists/due dates were hard to drag due to text selection. ([41a4d88c](https://github.com/jam53/Takma/commit/41a4d88c4d6d1a00593e453f0f49d4fad24172d6))
- Cover image border radius mismatch with card container. ([136fbe2a](https://github.com/jam53/Takma/commit/136fbe2a523db57ca2cfd79cca4917f466b32fce))

### Changed
- Updated dependencies. ([9a0017f7](https://github.com/jam53/Takma/commit/9a0017f7c97a5af6bb1bfedcca9cea717bf140a0))
- Improved look and feel of ChooseSaveLocationScreen. ([3ae28dc8](https://github.com/jam53/Takma/commit/3ae28dc8a6368817660bcf8af3c1bb201e691671))
- Closing OrderBoardsMenu and ListOptionsMenu with Escape or Ctrl+W. ([6b359b0f](https://github.com/jam53/Takma/commit/6b359b0f2201685bb2ffdc3f428d494d49752ff3))
- Attachments only shown if they exist on disk. ([dd67f129](https://github.com/jam53/Takma/commit/dd67f129b0b08e599eef35c7bc3271e9db1b8609))
- Tweaked checklist icon size in Actions section. ([f71a7c37](https://github.com/jam53/Takma/commit/f71a7c37154ab95279fffe2e95faae08db9b7cf7))
- Renamed `CheckList` component to `CheckLists`. ([5bb170af](https://github.com/jam53/Takma/commit/5bb170af622d33a2c137d75bd64161d083d2f04e))
- Track user creation counts for boards/lists/cards. ([f7f9a319](https://github.com/jam53/Takma/commit/f7f9a319acde0314239572127621c01523ba4909))
- Changed behavior of Enter key on checklist/todo item titles. ([ed0a75c6](https://github.com/jam53/Takma/commit/ed0a75c67204402c81d1b764676f18a874ca803a))
- Changed appearance of checkboxes in LabelsPopup. ([57613b1e](https://github.com/jam53/Takma/commit/57613b1ebff15dea1c85872a0ddd3fb5eefc28e7))
- Changed color of the loading spinner. ([e3deaeae](https://github.com/jam53/Takma/commit/e3deaeae7dec1b5bd2dcf5d6c73208cd4bbbcd3c))
- Included background images are now shuffled before showing in NewBoardPopup. ([99eea026](https://github.com/jam53/Takma/commit/99eea026f72b76e74091eed14220eb877d256811))
- Replaced old included background pictures with new ones. ([bda0a32c](https://github.com/jam53/Takma/commit/bda0a32c5048f3fb5349ffdb138e5eaf1a27e727))
- Updated npm packages. ([f9007869](https://github.com/jam53/Takma/commit/f90078694a477b08a1d6c23c8257b1b538b34045))
- Refactored code using optional chaining (`?.`). ([25a809c3](https://github.com/jam53/Takma/commit/25a809c34776e275f53e6115bbc2796bf9dbc276))
- Changed the way todos/checklists are saved. ([d077a845](https://github.com/jam53/Takma/commit/d077a8452190b1cc2b781c7379bdfa52dfa6d536))
- Use toast message instead of system notification when copying card link. ([8a595d95](https://github.com/jam53/Takma/commit/8a595d95b176281d0c00ee601491a9d48483827a))
- You can now close the label popup/color picker using Escape/Ctrl+W. ([dd555bbc](https://github.com/jam53/Takma/commit/dd555bbc33df35e5897131084c1537abf075898f))
- Window position and size now saved and restored on reopen. ([44574707](https://github.com/jam53/Takma/commit/44574707e26a5714852f1d49629a1c7acbf9b2e1))
- Fixed styling issues with Takma links in descriptions. ([6d1375af](https://github.com/jam53/Takma/commit/6d1375af1b84be9403c353c10e3f7ad01b0f4287))
- Improved prevention of pasting styles into card description (disable rich text formatting). ([62d4377f](https://github.com/jam53/Takma/commit/62d4377f45fd62ad2eb7302a26afa2d33957816e))
- Searchbar cleared when navigating between screens. ([41f5c7bd](https://github.com/jam53/Takma/commit/41f5c7bd4fdb6c4c31367fef8d93733777141bcd))
- Made title bar, navbar, and body transparent. ([2c85317d](https://github.com/jam53/Takma/commit/2c85317d91f48f72d409691ba3144863565ffba8))
- Labels now displayed on CardDetails window. ([dd383243](https://github.com/jam53/Takma/commit/dd383243d64a90cff816f57c809b1bde90100e15))
- Styled rendered Markdown in descriptions to mimic GitHub style. ([41de0caa](https://github.com/jam53/Takma/commit/41de0caa66b11923b21ab5ec099a6e0a624acac0))
- Replaced TodoItem type with an interface. ([efc877d4](https://github.com/jam53/Takma/commit/efc877d448f7b375a1fb092e4cbbaaf1919b352d))
- Cards display completed todo count instead of total. ([4ddd0491](https://github.com/jam53/Takma/commit/4ddd04915f52547a6513be45e0bb5e03d3a2a295))
- Styled appearance of cards. ([fe37ef4c](https://github.com/jam53/Takma/commit/fe37ef4ca8570cf78f50a37bd045be8701be5948))
- Reduced save file size by ~50% by removing JSON pretty print spaces. ([86d71056](https://github.com/jam53/Takma/commit/86d7105665c689396421bf6758bd168bb36c2bb7))
- Centered board background image. ([ea5c8a32](https://github.com/jam53/Takma/commit/ea5c8a328d01fd0c51dc0b295d1027f144a423ea))
- Rewrote handling of included images (saved to disk instead of referenced in binary); refactored board creation logic. ([dc05fc5f](https://github.com/jam53/Takma/commit/dc05fc5f80113f240c30325780ba92f1300fff83))
- Added padding to bottom of lists. ([031a133e](https://github.com/jam53/Takma/commit/031a133e225b4a22ad7ddd00d2b901d221311fd4))
- Enhanced look and feel of list scrollbars. ([48f20007](https://github.com/jam53/Takma/commit/48f20007f4be5158e6b84bfc1de4fdd66e771d28))
- Removed redundant method. ([9b912ada](https://github.com/jam53/Takma/commit/9b912ada3321ea0305101eb50879086ab86a07cc))
- Made Svelte transitions global (Svelte 4 change). ([7b09f59c](https://github.com/jam53/Takma/commit/7b09f59cb40cf2b4fcd17928bb76bd681d53e15a))
- Upgraded dependencies (including Svelte 4). ([18541102](https://github.com/jam53/Takma/commit/1854110218f52d946ec9638a725a6a0c4c3497a1))
- Ability to go back to welcomescreen using Ctrl+W or Esc from boardscreen. ([6aef1bd6](https://github.com/jam53/Takma/commit/6aef1bd6b58f2c28612e82c33bdf4aed38bca8d0))
- Brought list appearance more in line with Figma design. ([33742954](https://github.com/jam53/Takma/commit/3374295494783682ab408f641cd49456454a7e72))
- Split Board component into Board, List, CreateNewList components. ([63230bdb](https://github.com/jam53/Takma/commit/63230bdb1ae0fa1d2dc0ec7697cede8883c1c55e))
- Added offset to body/board background image for titlebar/navbar. ([40b8ced0](https://github.com/jam53/Takma/commit/40b8ced043eb3d64f1f00d450d1e0eaed441b232))
- Board title size on board screen matches "Takma" on welcome screen. ([72f0247c](https://github.com/jam53/Takma/commit/72f0247c96b763e7473a517bf2f0ebec9a8e50d7))
- Made NewBoardPopup responsive. ([499b8a52](https://github.com/jam53/Takma/commit/499b8a529683b20be96bf47a042b3070ada8385f))
- Upgraded to Tauri 1.4.0. ([6313f26f](https://github.com/jam53/Takma/commit/6313f26fee09d30bc978bdb12e2590b87f1dd528))
- Made minimize window icon slightly larger. ([d34c98c7](https://github.com/jam53/Takma/commit/d34c98c79369cac971f901bd9b3eca3585d77290))
- `updateBuild.js` sets version number in `tauri.conf.json`. ([78cd2b57](https://github.com/jam53/Takma/commit/78cd2b575bb158c84e1af68de4f906e0d9364668))
- Board screen body background set to the board's image. ([1901312d](https://github.com/jam53/Takma/commit/1901312d63b0b7e5a7a55a6f6fbef9ca9307041e))
- Press Enter on NewBoardPopup creates board. ([fe850860](https://github.com/jam53/Takma/commit/fe8508607db63634173e4e56b3193fe942b8ed25))
- Changed board files folder name to `Files` from `pictures`. ([5e960c0b](https://github.com/jam53/Takma/commit/5e960c0b6713df44429527d5fa457573c1a47d45))
- Ability to edit board titles; removed `selectedBoardTitle` store. ([bc6cc42e](https://github.com/jam53/Takma/commit/bc6cc42e512a796918e9b28a679d0b6b2de3f8a3))
- Last clicked image on NewBoardPopup stays selected. ([6358706e](https://github.com/jam53/Takma/commit/6358706ec4d0f74edf411904f53289e5ce24edf9))
- Configured Rust compiler and added UPX to reduce binary size (~55%). ([dbe6df72](https://github.com/jam53/Takma/commit/dbe6df72d8db9a3fa3de4705fc5c2bfde440f11a))
- Reduced size of included images using Squoosh. ([fba79384](https://github.com/jam53/Takma/commit/fba79384cc534d456f90eccb29117ede849b363e))
- Made `NewBoardPopup` closeable with `Ctrl` + `W`. ([828af455](https://github.com/jam53/Takma/commit/828af455540fe6efb34c86a556557da0004b536e))
- Replaced Lato font with Inter. ([bd0c103c](https://github.com/jam53/Takma/commit/bd0c103c0ef51fcecd035bcb2c01eb88462133d4))
- Track build number, incremented on dev/build. ([0e5b77ba](https://github.com/jam53/Takma/commit/0e5b77ba5c0bfcba3ac90498f00a6bf393d645f5))
- Removed white borders from some included background images. ([05795bbe](https://github.com/jam53/Takma/commit/05795bbe371370ab2332b38b7e944a52091d9bc0))
- Moved NewBoardPopup close button to top right. ([f32b3b22](https://github.com/jam53/Takma/commit/f32b3b22a75900857be64c731adb1d46bbb19417))
- Upgraded to Tauri 1.3.1. ([723401dc](https://github.com/jam53/Takma/commit/723401dcaf38d702996cff59489547b27e22438a))
- Made JSON save file pretty-printed. ([c9eafc1a](https://github.com/jam53/Takma/commit/c9eafc1a33c9695486d7978a18b6fca00a77097a))
- Update .gitignore. ([d891c0eb](https://github.com/jam53/Takma/commit/d891c0eb7e4fe070a8d9d39cb49f96df980186c7))
- Updated Tauri to 1.3. ([79e95f7e](https://github.com/jam53/Takma/commit/79e95f7ea3757f8fd0d1fdbbc9c3758b6f76dd48))
- Further implemented navbar and added buttons. ([c919ef87](https://github.com/jam53/Takma/commit/c919ef87372f2e37c87777e13aff5d4cbd4843e2))
- Created `.boardButtons` style class instead of styling all buttons. ([ec629d67](https://github.com/jam53/Takma/commit/ec629d678cdecc4e9a18a8319d2deac707f8bb75))
- Moved CSS from boardButtons stylesheet to parent using `:global()`. ([b65eb048](https://github.com/jam53/Takma/commit/b65eb0481d618ac14c7487e81cf218395c661254))
- Board button title slides down on hover. ([e8fe5081](https://github.com/jam53/Takma/commit/e8fe5081ed584b365b1ab716869c21dc13306aef))
- Styled board buttons. ([0efb1ede](https://github.com/jam53/Takma/commit/0efb1ede4ca65a9f253d84d40e9f109a8eb28439))
- Redid light/dark theme setting implementation. ([4f8be626](https://github.com/jam53/Takma/commit/4f8be62672eee968d7f8056d9ce53f7a8e5c3b50))
- Removed boilerplate code. ([280b7b8c](https://github.com/jam53/Takma/commit/280b7b8ccd13676f92b65f87ec64b7283b35851b))
- Initial commit. ([b28d9a78](https://github.com/jam53/Takma/commit/b28d9a783ffcb7ff30e67e8a11677c66f28667e4))

<!-- Link Definitions -->
[1.7.3]: https://github.com/jam53/Takma/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/jam53/Takma/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/jam53/Takma/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/jam53/Takma/compare/v1.6.8...v1.7.0
[1.6.8]: https://github.com/jam53/Takma/compare/v1.6.7...v1.6.8
[1.6.7]: https://github.com/jam53/Takma/compare/v1.6.6...v1.6.7
[1.6.6]: https://github.com/jam53/Takma/compare/v1.6.5...v1.6.6
[1.6.5]: https://github.com/jam53/Takma/compare/v1.6.4...v1.6.5
[1.6.4]: https://github.com/jam53/Takma/compare/v1.6.3...v1.6.4
[1.6.3]: https://github.com/jam53/Takma/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/jam53/Takma/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/jam53/Takma/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/jam53/Takma/compare/v1.5.3...v1.6.0
[1.5.3]: https://github.com/jam53/Takma/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/jam53/Takma/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/jam53/Takma/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/jam53/Takma/compare/v1.4.15...v1.5.0
[1.4.15]: https://github.com/jam53/Takma/compare/v1.4.14...v1.4.15
[1.4.14]: https://github.com/jam53/Takma/compare/v1.4.13...v1.4.14
[1.4.13]: https://github.com/jam53/Takma/compare/v1.4.12...v1.4.13
[1.4.12]: https://github.com/jam53/Takma/compare/v1.4.11...v1.4.12
[1.4.11]: https://github.com/jam53/Takma/compare/v1.4.10...v1.4.11
[1.4.10]: https://github.com/jam53/Takma/compare/v1.4.9...v1.4.10
[1.4.9]: https://github.com/jam53/Takma/compare/v1.4.8...v1.4.9
[1.4.8]: https://github.com/jam53/Takma/compare/v1.4.7...v1.4.8
[1.4.7]: https://github.com/jam53/Takma/compare/v1.4.6...v1.4.7
[1.4.6]: https://github.com/jam53/Takma/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/jam53/Takma/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/jam53/Takma/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/jam53/Takma/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/jam53/Takma/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/jam53/Takma/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/jam53/Takma/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/jam53/Takma/compare/v1.2.6...v1.3.0
[1.2.6]: https://github.com/jam53/Takma/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/jam53/Takma/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/jam53/Takma/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/jam53/Takma/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/jam53/Takma/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/jam53/Takma/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/jam53/Takma/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/jam53/Takma/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/jam53/Takma/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/jam53/Takma/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/jam53/Takma/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jam53/Takma/compare/b28d9a783ffcb7ff30e67e8a11677c66f28667e4...v1.0.0