#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const TASK = 'T34-complete-launcher'
const BIN = 'dsh'
const NAMESPACE = 'llm-pi-ai'
const SYNTHETIC_BASE_URL = 'http://127.0.0.1:1/v1'
const SYNTHETIC_KEY_REFERENCE = 'T34_COMPILED_BOUNDARY_SYNTHETIC_KEY'
const SYNTHETIC_LAWFIRM_MODEL = 'compiled-boundary-lawfirm-model'
const SYNTHETIC_EXTERNAL_MODEL = 'compiled-boundary-external-model'
// Cordis FiberState.ACTIVE is the compiled numeric value from the approved pin.
const CORDIS_FIBER_ACTIVE = 2
const HARNESS_FILE = fileURLToPath(import.meta.url)
const HARNESS_DIR = dirname(HARNESS_FILE)
const RUNS_DIR = join(HARNESS_DIR, 'runs')
const OBSERVER_OUTPUT_NAME = 'projection-observer.json'
const MAX_OBSERVER_BYTES = 16 * 1024
const COMPLETE_RUNTIME_NAME = 'complete-runtime'

const MODULES = Object.freeze({
  appBoot: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\index.js',
    bytes: 181825,
    sha256: 'b49e65913fff98a54313a4f94b9f9092f0e6aa9dc44a8b2a6e43d56b117967df',
  },
  configEditor: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-config-editor\\lib\\index.js',
    bytes: 6853,
    sha256: 'bb85243d9f5729a7186cace56c4ce31d4918bd026482797ef5b7c01bf612fab5',
  },
  settings: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\lib\\index.js',
    bytes: 22636,
    sha256: '9432b872597b7a31473072eb38a55979ab23375c76bd1d86d751388a692a0136',
  },
  loader: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\index.js',
    bytes: 23896,
    sha256: 'b57c5075e881b4ceb3a15382f506ce549bcbdcd2a0f5bae292f67e6a83a45b1f',
  },
  cordis: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\index.js',
    bytes: 60361,
    sha256: '6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e',
  },
  timer: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-timer\\lib\\index.js',
    bytes: 3961,
    sha256: 'aab5832ebcefccd223b16ff3e8f09ca611841f53352c8439ea3acf7cc11ad002',
  },
  hmr: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-hmr\\lib\\index.js',
    bytes: 24872,
    sha256: '75686a16199f90f5b580d96923d3d5c52a513402b399ad723d92506d00ea7676',
  },
  llm: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\index.js',
    bytes: 104821,
    sha256: '314204a70152d3bb7efe921fee3078bfe73fb36784829c10aefc49cafe7017c6',
  },
  llmPiAi: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\index.js',
    bytes: 114078,
    sha256: 'a86cc1bd55ae218b92eea3cad786c454a82b4450c351572c669f8c24d3ef1d9f',
  },
  observer: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\projection-observer.mjs',
    bytes: 20058,
    sha256: '2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac',
  },
})

const WORKSPACE_APP_BOOT = Object.freeze({
  path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\boot\\app-boot\\lib\\index.js',
  bytes: 181825,
  sha256: 'b49e65913fff98a54313a4f94b9f9092f0e6aa9dc44a8b2a6e43d56b117967df',
})

const COPY_INPUTS = Object.freeze([
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\package.json",
      "bytes": 2297,
      "sha256": "ae0558107b7036dbb20c32f418ffe29bf64e14ca6862e9426a17eba31b836f56",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\index.js",
      "bytes": 181825,
      "sha256": "b49e65913fff98a54313a4f94b9f9092f0e6aa9dc44a8b2a6e43d56b117967df",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\compatibility-preflight.js",
      "bytes": 9797,
      "sha256": "1fc26e75a6c6b38e20202e025f39ac93ebc33706a01782b064f63b48ab82eed3",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\compatibility-preflight.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\collect.js",
      "bytes": 12883,
      "sha256": "b7e4de11bde2991e756bf130239d4f26dc2d3c4b14ff85b89dfc981b77d9c241",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\collect.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\document.js",
      "bytes": 10013,
      "sha256": "0db94a0047fef726c67686d3cdc9a2bb25c80a186da76b5d0cfdcce4428b0407",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\document.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\index.js",
      "bytes": 1962,
      "sha256": "c7a441858090eeeb18fb5cc85d606f1288a712b6ab0381da124b0a15b5f7ca40",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\native.js",
      "bytes": 719,
      "sha256": "8975241dd0f3fedbae6e9abe92a2d70f1298921f0cfc7435c5e97581e73cb301",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\native.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\pattern.js",
      "bytes": 3201,
      "sha256": "be650196b40ad885b26f4702b20e9275c13d64630da78d9e713eac42b17a5ba6",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\pattern.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\projector.js",
      "bytes": 26542,
      "sha256": "bb6c6c8b87e64416eef05a0fe6a703859a03c186bddc237b87e443529f413966",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\projector.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\types.js",
      "bytes": 134,
      "sha256": "12efc28b5928b8d6e4c90c468dc8e816ad463994f6acb0903238bea5ffadb5cc",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\config-schema\\types.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\index.js",
      "bytes": 47818,
      "sha256": "e47c8110d82127a1c67aacd8c05aac30e7b3cc87abda79eab00deada2e853f20",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\package-meta.js",
      "bytes": 8266,
      "sha256": "e2a9bfd9bca9a813561e708f12a75ec3152900b83c949bc83aaee8a2febf9cda",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\package-meta.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\plugin-compatibility.js",
      "bytes": 4788,
      "sha256": "33044bb342e4a5c7892bf26d39cc32fb64c07fb8c0b5045eaf95138527989d40",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\plugin-compatibility.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-compatibility.js",
      "bytes": 7078,
      "sha256": "4a7a9e60120d4e9077a1d2ba8af831acb1fa9f368a953a19f775a53162d119f1",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-compatibility.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-context.js",
      "bytes": 2313,
      "sha256": "0c9a04dd38f639533bc6eb145e0e8829115dedddc3425528060de3faebda18db",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-context.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-plugins.js",
      "bytes": 4781,
      "sha256": "46422066f75f23ca73d0f03b2e2d4e67745852742aa4f8ba94806d51dc0f2555",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-plugins.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\legacy-links.js",
      "bytes": 700,
      "sha256": "98cb41c5377e29db6a39e7f2a8dd19e739f419247217d7b05032d3d78142a90c",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\legacy-links.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\resolver.js",
      "bytes": 37421,
      "sha256": "7ea5ed96a701abc499c79d9123c59a6e166a34e7bad7740c177a97501623cebd",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\resolver.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\service.js",
      "bytes": 3936,
      "sha256": "2f51b6d087ce57d3f59663b9210de49f417a72a9a49217512d8d00edd4e80c52",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\service.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\worker-bootstrap.js",
      "bytes": 417,
      "sha256": "c93344940382e8fe33963a2770e88e4c807041b6f7cda30c616c0b17c59c10de",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-resolution\\worker-bootstrap.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-sanitize.js",
      "bytes": 1879,
      "sha256": "0c3d0d0b8c624ceeab9fcf60f26e4bf83b5456bfc7182449ddc0d1415345cc16",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile-sanitize.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile.js",
      "bytes": 29334,
      "sha256": "5bffbdb533a43cb49ef637b270c16b910fef4112b9e65b26e76383d02f2c8792",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\types\\profile.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\worker\\profile-resolution-bootstrap.js",
      "bytes": 31833,
      "sha256": "4efac00eba95637481deb245ac4e5b497fceebb55db8e199675406b6bf53dbed",
      "relative": "node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\worker\\profile-resolution-bootstrap.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-config-editor\\package.json",
      "bytes": 1518,
      "sha256": "9894880bb405c38a0aa304886f87caec5f47c1c3b628d96ee9a167739ac267ae",
      "relative": "node_modules\\@deepseek-ai\\dsh-config-editor\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-config-editor\\lib\\index.js",
      "bytes": 6853,
      "sha256": "bb85243d9f5729a7186cace56c4ce31d4918bd026482797ef5b7c01bf612fab5",
      "relative": "node_modules\\@deepseek-ai\\dsh-config-editor\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-config-editor\\lib\\types\\index.js",
      "bytes": 8273,
      "sha256": "2a032ecab410407ca5ddd3fee16e1891ed9405568b959cd050d1d2d36fa7865e",
      "relative": "node_modules\\@deepseek-ai\\dsh-config-editor\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\package.json",
      "bytes": 1831,
      "sha256": "bbb4db5e548d6018c54da12f8a8e95e647ab9084d4b34c112320993f9a910a57",
      "relative": "node_modules\\@deepseek-ai\\dsh-settings\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\lib\\index.js",
      "bytes": 22636,
      "sha256": "9432b872597b7a31473072eb38a55979ab23375c76bd1d86d751388a692a0136",
      "relative": "node_modules\\@deepseek-ai\\dsh-settings\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\index.js",
      "bytes": 19537,
      "sha256": "c63a41db9559845def7840ae0b3fc0bb1cf9cda9c0da14e517cf322a31479dad",
      "relative": "node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\redact.js",
      "bytes": 3498,
      "sha256": "1ac0767fa8c29037f2a1ae125e855e48b3631ea3d3bbc3ba0c061922a1ed26e6",
      "relative": "node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\redact.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\schema.js",
      "bytes": 3482,
      "sha256": "d09aa399384019131272ed68434bf54031a1f9d80802577640bfe79283bb9528",
      "relative": "node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\schema.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\types.js",
      "bytes": 114,
      "sha256": "c9019b02dd4ba45fc8daac9e6316f9d241989c248f19a3f737262c4608694bd2",
      "relative": "node_modules\\@deepseek-ai\\dsh-settings\\lib\\types\\types.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\package.json",
      "bytes": 1069,
      "sha256": "964db46c6c911187b79e13d778b434e6f2eebb501d1a5ea285270a8ac19c2ddb",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\index.js",
      "bytes": 23896,
      "sha256": "b57c5075e881b4ceb3a15382f506ce549bcbdcd2a0f5bae292f67e6a83a45b1f",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\diff.js",
      "bytes": 1874,
      "sha256": "61f5d7de84422ee07fd72b65038e3955bfb7cef54a15340bebfde4db3b6a1cfa",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\diff.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\entry.js",
      "bytes": 8070,
      "sha256": "93e058c630404031dcdfba754bdea54b20afc905db73c9f7c269855cb60e089f",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\entry.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\group.js",
      "bytes": 2799,
      "sha256": "4d582fe452d4f37feb66b53278a493448203621a500559385a8ab3dec792ba5e",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\group.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\isolate.js",
      "bytes": 5722,
      "sha256": "9f5b3d1789039adbf146a4e617ba0868c85b4cfbdc45ccdc72e8914ac7aae4f2",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\isolate.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\tree.js",
      "bytes": 4858,
      "sha256": "14e944751b3af7ace44912d46972ebeb5c26e6924a95e03097cb571d09f26cea",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\tree.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\utils.js",
      "bytes": 931,
      "sha256": "1a578a151ef9effc2c32fdcd8516191701e173e4475a2cea187fcec12418ae1f",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\config\\utils.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\index.js",
      "bytes": 6330,
      "sha256": "d23e6b58971b88606e924ed31a632a4fd5e04535e207fc8f62669552d66453b1",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\internal.js",
      "bytes": 1994,
      "sha256": "8bcbf50c52c455c4141efed7adb595e7e706091d941052d384bd28ed9a6934bc",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\types\\internal.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\package.json",
      "bytes": 1237,
      "sha256": "bd5b142ae927e4f954ceaee7cdc0e43fe921dde311edc8ec4f797f85f1981f83",
      "relative": "node_modules\\@deepseek-ai\\cordis\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\index.js",
      "bytes": 60361,
      "sha256": "6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\context.js",
      "bytes": 4342,
      "sha256": "49ee341e27ee27b9a7e0d40e522ee0a706154f1519f80117b9499fa3f2ba4d24",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\context.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\events.js",
      "bytes": 7886,
      "sha256": "6e2c6fe9b9f2c634ee14804963050dd8fe603f5e289c088eb6ffdf8852e641cd",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\events.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\fiber.js",
      "bytes": 24856,
      "sha256": "bb7d54ff392861fce9dcac7e14e6503eddb9e64e35276a898fca5ceb622a1606",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\fiber.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\index.js",
      "bytes": 719,
      "sha256": "bd57618de816c3354c1d2d677284f9a957d44cea31c98d998a508039930e72a5",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\logger.js",
      "bytes": 7022,
      "sha256": "b58f8113f52778f4d801b678b003489558968284a8daf94a9dbb72bb98656f73",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\logger.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\reflect.js",
      "bytes": 12655,
      "sha256": "4276c47cab2b0a30eb39e2bf3587c56ea95766be0c8b357ab55bcdd328b2a754",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\reflect.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\registry.js",
      "bytes": 7963,
      "sha256": "68c2e49991ad65c9bcbf1b739c3009fe0b339d4cbfebdd697d8a7e2df293d921",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\registry.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\service.js",
      "bytes": 4377,
      "sha256": "8cab9e0cee4c69fd6fdb4e9ec4c27e24de6ec68ab202c3d501878de9a70c9fc7",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\service.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\types\\utils.js",
      "bytes": 10270,
      "sha256": "2b2a6a1a98df05e565264030af2c351e30540fc10ad0f6645ef76e8a8837b069",
      "relative": "node_modules\\@deepseek-ai\\cordis\\lib\\types\\utils.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-timer\\package.json",
      "bytes": 878,
      "sha256": "ea8b2580283686548b3d03849ecb786d0d9fd43f5879b1b0c5ae7c777b137113",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-timer\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-timer\\lib\\index.js",
      "bytes": 3961,
      "sha256": "aab5832ebcefccd223b16ff3e8f09ca611841f53352c8439ea3acf7cc11ad002",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-timer\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-timer\\lib\\types\\index.js",
      "bytes": 5026,
      "sha256": "2449824d53625ce7ec66cf0a9a1520319ecfb19f329ed3c9dd3c4edfa6ab9681",
      "relative": "node_modules\\@deepseek-ai\\cordis-plugin-timer\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-hmr\\package.json",
      "bytes": 1707,
      "sha256": "bb2df033d388a2c1988534473757f4a413c3380c6f3cb419f43172bedd91109e",
      "relative": "node_modules\\@deepseek-ai\\dsh-hmr\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-hmr\\lib\\index.js",
      "bytes": 24872,
      "sha256": "75686a16199f90f5b580d96923d3d5c52a513402b399ad723d92506d00ea7676",
      "relative": "node_modules\\@deepseek-ai\\dsh-hmr\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-hmr\\lib\\types\\error.js",
      "bytes": 1336,
      "sha256": "2d305a295099980307eb836412f4fa29031ced777af3757b4143c480dcc62463",
      "relative": "node_modules\\@deepseek-ai\\dsh-hmr\\lib\\types\\error.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-hmr\\lib\\types\\index.js",
      "bytes": 28533,
      "sha256": "baa7b47dee425609f7e117235296e55e8cc2ee5c933a1eadccd2fb03f6989621",
      "relative": "node_modules\\@deepseek-ai\\dsh-hmr\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-hmr\\lib\\types\\watch-config.js",
      "bytes": 3936,
      "sha256": "7a426dfec82d3facf5719f4244684ce4f98cf5de5db5929828ce963da8bd2a2d",
      "relative": "node_modules\\@deepseek-ai\\dsh-hmr\\lib\\types\\watch-config.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\package.json",
      "bytes": 2243,
      "sha256": "bacbbd4614e8a3c9f0b676280a4987253bbcef9640aa54ff521edfb26cd78d4d",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\index.js",
      "bytes": 104821,
      "sha256": "314204a70152d3bb7efe921fee3078bfe73fb36784829c10aefc49cafe7017c6",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\invariant.js",
      "bytes": 3395,
      "sha256": "8cb78641252b7a41523fef2c571dd42c698de4c9475dd91683191cefa4dced48",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\invariant.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\typert.host.js",
      "bytes": 42375,
      "sha256": "3d6dc147163a3bb066f4d0682edc2570da385a1016d39562048322f8de5c5beb",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\typert.host.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\typert.remote-client.js",
      "bytes": 4221,
      "sha256": "18d4e5bd55faea9b1bdccf0520cb38d4c744f555d8542638c0d5ae7f3042e0df",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\typert.remote-client.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\adapter-failure.js",
      "bytes": 4326,
      "sha256": "f1213f11f11e0f20aae26c09a5e0cf3d72512c1f1519e1b3f107edf64af43c28",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\adapter-failure.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\api-key.js",
      "bytes": 1518,
      "sha256": "254b774234c0bd38dd759765c0fd1e60788651a22106f5559ec2760a39935f2d",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\api-key.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\assembler.js",
      "bytes": 7945,
      "sha256": "35a4754ab854055942b9142934c595c3e6358a717947daa2d8d89847aef988f7",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\assembler.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\assistant-stream.js",
      "bytes": 19887,
      "sha256": "7e0cc96a4d60aed34381b552f9cb4549d70df36dbd28c0630da4cd93fa44b7a1",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\assistant-stream.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\attribution.js",
      "bytes": 2091,
      "sha256": "6f61d7b685175f7c74ed2a0498212258240f2a7fd93e939349cf7daccf33414b",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\attribution.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\brand.js",
      "bytes": 1650,
      "sha256": "6b70219e0478d3307d865309523e7e7be3f169b06c04f4eef0d49b54aaef72a2",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\brand.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\call-config.js",
      "bytes": 2045,
      "sha256": "257ba749081fb454633bbeedf3ab6c1f0138fbf1164d1d7624e2b66b5d47e683",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\call-config.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\content.js",
      "bytes": 16615,
      "sha256": "79802e2e6bece64114c8f6857943c2cd23742bd2c20b067cd06298d397f9b85e",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\content.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\error.js",
      "bytes": 8472,
      "sha256": "2a630a88b278ef18da72abbca0e1288b7a6b221434cbe51a69aeaf70d178da4f",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\error.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\index.js",
      "bytes": 53407,
      "sha256": "7722961891d78cfa754d35e27971b2a74b2d58436279c27d7b6e39866984bcdd",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\invariant.js",
      "bytes": 4401,
      "sha256": "31e6ab4e29731d461b2bd49fd285666ea1a1fb96fa71ecd5c449c6c27e95d889",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\invariant.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\message.js",
      "bytes": 3713,
      "sha256": "c87812f77a2afd284f271af071575edcadfde3daa7b6554d77b96810ce4688e0",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\message.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\retry-policy.js",
      "bytes": 5591,
      "sha256": "f0a8fe075ac24c56ed2aa5d5e359a85539f5ffa237af54b68d3f4fc5124b5d83",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\retry-policy.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\types.js",
      "bytes": 284,
      "sha256": "14106d660103de2db746964fbb5be90c5eb2a7ff736779e2501e9faff956cbf5",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm\\lib\\types\\types.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\package.json",
      "bytes": 2208,
      "sha256": "8a44611647f2b8e4ddd46f76756b3aea0503fba70824f08d589ffc4701d75fd1",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\index.js",
      "bytes": 114078,
      "sha256": "a86cc1bd55ae218b92eea3cad786c454a82b4450c351572c669f8c24d3ef1d9f",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\adapter.js",
      "bytes": 19160,
      "sha256": "6f1a71e5a64c850a0cf0b758a07f422615a76b93e3f6e6bbe73d6b4161d4a3e2",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\adapter.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\auth.js",
      "bytes": 10171,
      "sha256": "6ff6904e91bba4238393862f51a8276d9c6bda12c521c4e9e2cc5b7649698ac4",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\auth.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\catalog.js",
      "bytes": 30053,
      "sha256": "c5daa6d2a0612f718f5f90dd27f79e14da17164fe98bcb44948bd23bd6fd91b7",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\catalog.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\config.js",
      "bytes": 15404,
      "sha256": "6e236505fd5e5c5f4bb6234982d623b201e38ea4df1f5dbc2322c89ba916e79a",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\config.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\context.js",
      "bytes": 9948,
      "sha256": "a7491abe208b3c1691c708b8ae5337ca57c0160de1463ca00e8a2b0ff74d8f1f",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\context.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\discovery.js",
      "bytes": 14296,
      "sha256": "67c6913d1ec9e07f1f9b683ddcddb2bad83ce0a70bf5009f28584e7261ce5b78",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\discovery.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\index.js",
      "bytes": 11249,
      "sha256": "bada20351309a6f3d7a255cd5a035da3289d9c0df4dc8b1ece1cf6e69429fc4e",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\index.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\login.js",
      "bytes": 6977,
      "sha256": "1a7a33e95a0807576af5f4b29745f37b5dc6da2e57ccc20c60df1395cb46005d",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\login.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\models.js",
      "bytes": 1885,
      "sha256": "5546ad067f08c7f188907cbbbbd9b536145c8a91ad8c65b39945ff28378536af",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\models.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\provider.js",
      "bytes": 8374,
      "sha256": "3bd6cb9470aa69533360ae129cda073182fc7b47f7129b95e9b08e6c070bf5c0",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\provider.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\replay.js",
      "bytes": 11753,
      "sha256": "33b0e2ddc310604d8ba3d495a85eb78ebfb843405d7c257fe73e15bbe4de6807",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\replay.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\stream.js",
      "bytes": 11410,
      "sha256": "25d04b49fc036168a44ecc523aa959796d9bf81297e4180ed363d95661f30e20",
      "relative": "node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\types\\stream.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh\\package.json",
      "bytes": 7450,
      "sha256": "ad54b35110f24045758e81770b446765b35d5c1a5ca27c311b6337782547f20c",
      "relative": "node_modules/@deepseek-ai/dsh/package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\dsh\\apps\\cli\\lib\\profile-boot.js",
      "bytes": 310,
      "sha256": "c53d4e2caf21428e263b525e657dafaf63fd183f7ef016aabda56af7998b6c4f",
      "relative": "node_modules/@deepseek-ai/dsh/lib/profile-boot.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\dsh\\apps\\cli\\lib\\profile-boot-BZ2ZjNWi.js",
      "bytes": 12593,
      "sha256": "c394b2aa2ce08a3b1fcc8c544257c7d689dd4d0b1cfaf8602687e65eeaba5aa1",
      "relative": "node_modules/@deepseek-ai/dsh/lib/profile-boot-BZ2ZjNWi.js"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-desktop-host\\package.json",
      "bytes": 1004,
      "sha256": "ff8440f98dcd25a9fd9beb02fd8b2549cc4db380f4b4e141ff7c09786d8c7c7d",
      "relative": "node_modules/@deepseek-ai/dsh-desktop-host/package.json"
    },
    {
      "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-desktop-host\\lib\\index.js",
      "bytes": 12732,
      "sha256": "108c717578f7a99ce747af5cb55cf8fcd21e909001341b26876df06311fd55b3",
      "relative": "node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js"
    }
  ])

const LAUNCHER_MODULES = Object.freeze({
  workspaceCliProfileBoot: {
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\apps\\cli\\lib\\profile-boot.js',
    bytes: 310,
    sha256: 'c53d4e2caf21428e263b525e657dafaf63fd183f7ef016aabda56af7998b6c4f',
  },
  workspaceCliProfileBootChunk: {
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\apps\\cli\\lib\\profile-boot-BZ2ZjNWi.js',
    bytes: 12593,
    sha256: 'c394b2aa2ce08a3b1fcc8c544257c7d689dd4d0b1cfaf8602687e65eeaba5aa1',
  },
  launchEnvironment: {
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\util\\launch-environment\\lib\\index.js',
    bytes: 2991,
    sha256: '6aab33b43d6caa4ee483f7d796a17afb400fca02b7a259fb55d486626e6bb7f0',
  },
})

const ACTUAL_INSTALL_ANCHOR = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh\\package.json'
const ACTUAL_PROFILE_DIR = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\runs\\T34-private-projection-observer-20261030-232427\\gui\\dsh-home\\profiles\\desktop'
const ACTUAL_DSH_HOME = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\runs\\T34-private-projection-observer-20261030-232427\\gui\\dsh-home'

const ERROR_NAMES = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'StartupError',
  'SettingsConflictError',
])

const ERROR_CODES = new Set([
  'EACCES',
  'EBUSY',
  'EEXIST',
  'EISDIR',
  'ENOENT',
  'ENOSPC',
  'ENOTDIR',
  'EPERM',
])

const PRIMARY_ERROR_MESSAGES = Object.freeze({
  root_include_missing: `${BIN}: profile reload requires the root Include entry`,
  entry_changed: 'Configuration entry changed during reload',
  entry_unavailable: 'Configuration entry is no longer available',
  entry_inactive: 'Configuration plugin is no longer active',
  patch_not_sequence: 'Profile patch must be a YAML sequence',
  hmr_nested: 'HMR transactions cannot be nested',
  hmr_disposed: 'HMR is disposed',
})

const FAILURE_LABELS = new Set([
  'args_invalid',
  'root_not_absolute',
  'root_outside_runs',
  'runs_directory_missing',
  'root_parent_reparse',
  'root_already_exists',
  'root_create_failed',
  'source_pin_mismatch',
  'internal_loader_unavailable',
  'import_identity_mismatch',
  'guard_install_failed',
  'profile_setup_failed',
  'actual_profile_load_failed',
  'runtime_resolution_failed',
  'workspace_app_boot_import_failed',
  'launcher_import_failed',
  'runtime_copy_failed',
  'synthetic_profile_load_failed',
  'launcher_shutdown_unavailable',
  'launcher_boot_rejected',
  'namespace_precondition_failed',
  'observer_result_read_failed',
  'result_write_failed',
])

class BoundaryFailure extends Error {
  constructor(label) {
    super(label)
    this.label = label
  }
}

function nowUtc() {
  return new Date().toISOString()
}

function boundedName(error) {
  const value = error && typeof error === 'object' && typeof error.name === 'string'
    ? error.name
    : 'UNKNOWN'
  return ERROR_NAMES.has(value) ? value : 'OTHER'
}

function boundedCode(error) {
  const value = error && typeof error === 'object' && typeof error.code === 'string'
    ? error.code
    : undefined
  return value !== undefined && ERROR_CODES.has(value) ? value : 'UNKNOWN'
}

function boundedMessageMatch(error) {
  const value = error && typeof error === 'object' && typeof error.message === 'string'
    ? error.message
    : undefined
  if (value === undefined) return 'UNKNOWN'
  for (const [label, literal] of Object.entries(PRIMARY_ERROR_MESSAGES)) {
    if (value === literal) return label
  }
  return 'UNKNOWN'
}

function boundedError(error) {
  const label = error instanceof BoundaryFailure && FAILURE_LABELS.has(error.label)
    ? error.label
    : 'OTHER'
  return {
    name: boundedName(error),
    code: boundedCode(error),
    label,
    primaryMessageMatch: boundedMessageMatch(error),
  }
}

function stage(result, name, metadata = {}) {
  result.stages.push({ name, atUtc: nowUtc(), ...metadata })
}

function assertWithin(base, candidate) {
  const rel = relative(resolve(base), resolve(candidate))
  return rel !== ''
    && rel !== '..'
    && !rel.startsWith(`..${sep}`)
    && !isAbsolute(rel)
}

function normalizePathForCompare(value) {
  return resolve(value).replaceAll('/', '\\').toLowerCase()
}

function assertExistingPrefixesHaveNoReparse(target) {
  let cursor = resolve(target)
  while (true) {
    if (existsSync(cursor)) {
      if (lstatSync(cursor).isSymbolicLink()) {
        throw new BoundaryFailure('root_parent_reparse')
      }
      const real = realpathSync.native(cursor)
      if (normalizePathForCompare(real) !== normalizePathForCompare(cursor)) {
        throw new BoundaryFailure('root_parent_reparse')
      }
    }
    const parent = dirname(cursor)
    if (parent === cursor) break
    cursor = parent
  }
}

function parseRoot(argv) {
  if (argv.length !== 2 || argv[0] !== '--root' || !isAbsolute(argv[1])) {
    throw new BoundaryFailure('args_invalid')
  }
  const root = resolve(argv[1])
  if (!assertWithin(RUNS_DIR, root)) throw new BoundaryFailure('root_outside_runs')
  if (!existsSync(RUNS_DIR) || !statSync(RUNS_DIR).isDirectory()) {
    throw new BoundaryFailure('runs_directory_missing')
  }
  assertExistingPrefixesHaveNoReparse(RUNS_DIR)
  if (existsSync(root)) throw new BoundaryFailure('root_already_exists')
  try {
    mkdirSync(root, { mode: 0o700 })
  } catch {
    throw new BoundaryFailure('root_create_failed')
  }
  return root
}

function ownedPath(root, ...parts) {
  const candidate = join(root, ...parts)
  if (!assertWithin(root, candidate)) throw new BoundaryFailure('result_write_failed')
  return candidate
}

function writeOwnedText(root, relativePath, content, flag = 'w') {
  const path = ownedPath(root, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, { encoding: 'utf8', flag })
}

function writeResult(root, result) {
  const path = ownedPath(root, 'compiled-boundary-result.json')
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function verifySourcePins(result) {
  let verified = 0
  const pinSets = [
    ['module', MODULES],
    ['launcher', LAUNCHER_MODULES],
    ['workspace', { workspaceAppBoot: WORKSPACE_APP_BOOT }],
  ]
  for (const [kind, pins] of pinSets) for (const [moduleName, pin] of Object.entries(pins)) {
    const bytes = readFileSync(pin.path)
    const byteMatch = bytes.byteLength === pin.bytes
    const hashMatch = sha256Bytes(bytes) === pin.sha256
    result.source.modules.push({
      module: moduleName,
      kind,
      bytesMatch: byteMatch,
      sha256Match: hashMatch,
    })
    if (!byteMatch || !hashMatch) {
      throw new BoundaryFailure('source_pin_mismatch')
    }
    verified += 1
  }
  result.source.verified = verified

  let copyInputsVerified = 0
  for (const pin of COPY_INPUTS) {
    const bytes = readFileSync(pin.path)
    const byteMatch = bytes.byteLength === pin.bytes
    const hashMatch = sha256Bytes(bytes) === pin.sha256
    if (!byteMatch || !hashMatch) {
      throw new BoundaryFailure('source_pin_mismatch')
    }
    copyInputsVerified += 1
  }
  result.source.copyInputsVerified = copyInputsVerified
  result.source.copyInputCount = COPY_INPUTS.length
  result.source.totalVerified = verified + copyInputsVerified
  stage(result, 'imports_verified', {
    originalPins: verified,
    copyInputs: copyInputsVerified,
  })
}

function createOwnedRuntime(root, result) {
  const runtimeRoot = ownedPath(root, COMPLETE_RUNTIME_NAME)
  assertExistingPrefixesHaveNoReparse(runtimeRoot)
  try {
    mkdirSync(runtimeRoot, { mode: 0o700 })
  } catch {
    throw new BoundaryFailure('runtime_copy_failed')
  }

  let copiedBytes = 0
  let copyCount = 0
  for (const pin of COPY_INPUTS) {
    const sourceBytes = readFileSync(pin.path)
    if (sourceBytes.byteLength !== pin.bytes
      || sha256Bytes(sourceBytes) !== pin.sha256) {
      throw new BoundaryFailure('source_pin_mismatch')
    }

    const destination = ownedPath(runtimeRoot, pin.relative)
    const parent = dirname(destination)
    assertExistingPrefixesHaveNoReparse(parent)
    try {
      mkdirSync(parent, { recursive: true, mode: 0o700 })
      assertExistingPrefixesHaveNoReparse(parent)
      writeFileSync(destination, sourceBytes, { flag: 'wx' })
      const copied = readFileSync(destination)
      if (copied.byteLength !== pin.bytes
        || sha256Bytes(copied) !== pin.sha256) {
        throw new BoundaryFailure('runtime_copy_failed')
      }
    } catch (error) {
      if (error instanceof BoundaryFailure) throw error
      throw new BoundaryFailure('runtime_copy_failed')
    }
    copiedBytes += sourceBytes.byteLength
    copyCount += 1
  }

  const dshDir = ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh')
  const desktopHostDir = ownedPath(
    runtimeRoot,
    'node_modules',
    '@deepseek-ai',
    'dsh-desktop-host',
  )
  const effectiveModulePaths = Object.freeze({
    appBoot: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-app-boot', 'lib', 'index.js'),
    configEditor: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-config-editor', 'lib', 'index.js'),
    settings: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-settings', 'lib', 'index.js'),
    loader: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'cordis-plugin-loader', 'lib', 'index.js'),
    cordis: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'cordis', 'lib', 'index.js'),
    timer: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'cordis-plugin-timer', 'lib', 'index.js'),
    hmr: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-hmr', 'lib', 'index.js'),
    llm: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-llm', 'lib', 'index.js'),
    llmPiAi: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-llm-pi-ai', 'lib', 'index.js'),
  })
  const effectiveModuleUrls = Object.freeze(Object.fromEntries(
    Object.entries(effectiveModulePaths).map(([name, path]) => [
      name,
      pathToFileURL(path).href,
    ]),
  ))
  const installAnchor = ownedPath(dshDir, 'package.json')
  const desktopHostEntry = ownedPath(desktopHostDir, 'lib', 'index.js')

  result.completeRuntime = {
    target: COMPLETE_RUNTIME_NAME,
    fileCount: copyCount,
    byteCount: copiedBytes,
    allSourceHeld: copyCount === COPY_INPUTS.length
      && copiedBytes === COPY_INPUTS.reduce((sum, pin) => sum + pin.bytes, 0),
    allCopyEqual: true,
    fixedRoles: {
      installAnchor: 'owned_runtime_dsh_package',
      desktopHostEntry: 'owned_runtime_desktop_host_entry',
      appBoot: 'owned_runtime_appBoot_module',
      profileBoot: 'owned_runtime_dsh_profile_boot',
      observer: 'original_source_pin_unchanged',
    },
  }
  stage(result, 'complete_runtime_created', {
    fileCount: copyCount,
    byteCount: copiedBytes,
  })
  return {
    runtimeRoot,
    installAnchor,
    desktopHostEntry,
    effectiveModulePaths,
    effectiveModuleUrls,
  }
}

function countLiteral(text, literal) {
  let count = 0
  let offset = 0
  while (true) {
    const next = text.indexOf(literal, offset)
    if (next < 0) return count
    count += 1
    offset = next + literal.length
  }
}

function installNetworkAndProcessGuards() {
  const attempts = {
    http: 0,
    https: 0,
    net: 0,
    tls: 0,
    fetch: 0,
    websocket: 0,
    child_process: 0,
    worker: 0,
  }
  const denied = category => function deniedByCompiledBoundary() {
    attempts[category] += 1
    throw new Error(`compiled-boundary: ${category} denied`)
  }
  const replaceMethods = (target, names, category) => {
    for (const name of names) {
      if (target !== undefined && typeof target[name] === 'function') {
        Object.defineProperty(target, name, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: denied(category),
        })
      }
    }
  }
  const net = process.getBuiltinModule('node:net')
  const http = process.getBuiltinModule('node:http')
  const https = process.getBuiltinModule('node:https')
  const tls = process.getBuiltinModule('node:tls')
  const childProcess = process.getBuiltinModule('node:child_process')
  const workerThreads = process.getBuiltinModule('node:worker_threads')

  replaceMethods(net, ['connect', 'createConnection'], 'net')
  if (net?.Socket?.prototype !== undefined) {
    replaceMethods(net.Socket.prototype, ['connect'], 'net')
  }
  replaceMethods(http, ['get', 'request'], 'http')
  replaceMethods(https, ['get', 'request'], 'https')
  replaceMethods(tls, ['connect'], 'tls')
  replaceMethods(childProcess, [
    'exec',
    'execFile',
    'execFileSync',
    'execSync',
    'fork',
    'spawn',
    'spawnSync',
  ], 'child_process')
  replaceMethods(workerThreads, ['Worker'], 'worker')

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: denied('fetch'),
  })
  Object.defineProperty(globalThis, 'WebSocket', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: denied('websocket'),
  })
  syncBuiltinESMExports()

  return { attempts, installed: true, held: true }
}

function syntheticBundlePatch(root, runtime) {
  return [{
    insert: [
      { id: 'config-editor', name: runtime.effectiveModuleUrls.configEditor },
      { id: 'settings', name: runtime.effectiveModuleUrls.settings },
      { id: 'llm', name: runtime.effectiveModuleUrls.llm },
      { id: 'llm-pi-ai', name: runtime.effectiveModuleUrls.llmPiAi },
      { id: 'timer', name: runtime.effectiveModuleUrls.timer },
      {
        id: 'hmr',
        name: runtime.effectiveModuleUrls.hmr,
        config: { root: [], ignored: [], debounce: 0 },
      },
      {
        id: 't34-projection-observer',
        name: pathToFileURL(MODULES.observer.path).href,
        config: {
          stateDir: root,
          outputPath: join(root, OBSERVER_OUTPUT_NAME),
          configEditorModuleUrl: runtime.effectiveModuleUrls.configEditor,
          settingsModuleUrl: runtime.effectiveModuleUrls.settings,
        },
      },
    ],
  }]
}

function syntheticProvider(name, model) {
  return {
    displayName: `compiled-boundary-${name}`,
    apiKeyEnv: SYNTHETIC_KEY_REFERENCE,
    api: 'openai-completions',
    baseURL: SYNTHETIC_BASE_URL,
    models: [{
      id: model,
      input: ['text'],
      contextWindow: 2048,
    }],
  }
}

function syntheticProfilePatch() {
  return [{
    id: 'llm-pi-ai',
    config: {
      providers: {
        lawfirm: syntheticProvider('lawfirm', SYNTHETIC_LAWFIRM_MODEL),
        external: syntheticProvider('external', SYNTHETIC_EXTERNAL_MODEL),
      },
    },
  }]
}

function createSyntheticProfile(root, appBoot, runtime) {
  const home = ownedPath(root, 'dsh-home')
  const profileDir = ownedPath(home, 'profiles', 'compiled-boundary')
  const bundleName = 'compiled-boundary-bundle'
  const bundleDir = ownedPath(profileDir, 'node_modules', bundleName)

  mkdirSync(home, { recursive: true })
  appBoot.initProfile(profileDir, [bundleName])

  mkdirSync(bundleDir, { recursive: true })
  writeOwnedText(root, relative(root, ownedPath(bundleDir, 'package.json')), `${JSON.stringify({
    name: bundleName,
    version: '1.0.0',
    private: true,
    dsh: { bundle: { patch: 'cordis.patch.yml' } },
  }, null, 2)}\n`)
  writeOwnedText(
    root,
    relative(root, ownedPath(bundleDir, 'cordis.patch.yml')),
    `${JSON.stringify(syntheticBundlePatch(root, runtime), null, 2)}\n`,
  )

  const profilePatchPath = ownedPath(profileDir, 'cordis.patch.yml')
  writeOwnedText(
    root,
    relative(root, profilePatchPath),
    `${JSON.stringify(syntheticProfilePatch(), null, 2)}\n`,
  )
  const rootConfigPath = ownedPath(profileDir, 'cordis.yml')
  writeOwnedText(root, relative(root, rootConfigPath), '[]\n')

  const profileContext = {
    name: 'compiled-boundary',
    dir: profileDir,
    patchPath: profilePatchPath,
    installAnchor: runtime.installAnchor,
    cwd: root,
    home,
    startedBundles: [bundleName],
    overlays: [],
    telemetryDisabledEnv: undefined,
  }

  return { home, profileDir, rootConfigPath, profileContext }
}

async function loadActualRuntimeResolution(appBoot, result) {
  let loadedActualProfile
  try {
    loadedActualProfile = appBoot.loadProfileDirectory(
      BIN,
      ACTUAL_PROFILE_DIR,
      ACTUAL_INSTALL_ANCHOR,
    )
  } catch (error) {
    result.error = boundedError(error)
    throw new BoundaryFailure('actual_profile_load_failed')
  }

  let resolution
  try {
    resolution = await appBoot.createRuntimeResolution({
      installAnchor: ACTUAL_INSTALL_ANCHOR,
      profile: loadedActualProfile,
      home: ACTUAL_DSH_HOME,
    })
  } catch (error) {
    result.error = boundedError(error)
    throw new BoundaryFailure('runtime_resolution_failed')
  }

  result.actualProfile = {
    loaded: true,
    dirMatchesApproved: normalizePathForCompare(loadedActualProfile.dir)
      === normalizePathForCompare(ACTUAL_PROFILE_DIR),
  }
  result.runtimeResolution = {
    computed: true,
    frozen: Object.isFrozen(resolution),
    entriesFrozen: Object.isFrozen(resolution.entries),
    entryCount: resolution.entries.length,
    localPackageCount: resolution.localPackageNames.length,
    linkedRootCount: resolution.linkedRoots.length,
    profilesDirMatchesApprovedHome: normalizePathForCompare(resolution.profilesDir)
      === normalizePathForCompare(join(ACTUAL_DSH_HOME, 'profiles')),
    profileDirMatchesApproved: resolution.profileDir !== undefined
      && normalizePathForCompare(resolution.profileDir)
        === normalizePathForCompare(ACTUAL_PROFILE_DIR),
  }
  stage(result, 'actual_runtime_resolution_computed', {
    entryCount: result.runtimeResolution.entryCount,
    localPackageCount: result.runtimeResolution.localPackageCount,
    linkedRootCount: result.runtimeResolution.linkedRootCount,
  })
  return resolution
}

async function importLauncherProfileBoot(loaderModule, result, runtime) {
  const internalLoader = loaderModule.ModuleLoader.fromInternal()
  if (internalLoader === undefined) {
    throw new BoundaryFailure('internal_loader_unavailable')
  }
  const parentUrl = pathToFileURL(runtime.desktopHostEntry).href
  let profileBoot
  try {
    profileBoot = await internalLoader.import(
      '@deepseek-ai/dsh/profile-boot',
      parentUrl,
      {},
    )
  } catch (error) {
    result.profileBootImport = {
      attempted: true,
      outcome: 'REJECTED',
      specifier: '@deepseek-ai/dsh/profile-boot',
      parentEntry: basename(runtime.desktopHostEntry),
      parentIsOwnedRuntime: true,
      loaderResolveApiAvailable: typeof internalLoader.resolve === 'function',
      boundedResolvedPath: 'NOT_RECORDED',
      error: boundedError(error),
    }
    throw new BoundaryFailure('launcher_import_failed')
  }
  result.profileBootImport = {
    attempted: true,
    outcome: 'FULFILLED',
    specifier: '@deepseek-ai/dsh/profile-boot',
    parentEntry: basename(runtime.desktopHostEntry),
    parentIsOwnedRuntime: true,
    loaderResolveApiAvailable: typeof internalLoader.resolve === 'function',
    boundedResolvedPath: 'NOT_RECORDED',
    runProfileFunction: typeof profileBoot.runProfile === 'function',
  }
  stage(result, 'launcher_profile_boot_imported')
  return {
    internalLoader,
    profileBoot,
    parentUrl,
  }
}

async function importWorkspaceAppBoot(result) {
  try {
    const workspaceAppBoot = await import(
      pathToFileURL(WORKSPACE_APP_BOOT.path).href
    )
    result.workspaceAppBootImport = {
      attempted: true,
      outcome: 'FULFILLED',
      bootFunction: typeof workspaceAppBoot.boot === 'function',
    }
    stage(result, 'workspace_app_boot_imported')
    return workspaceAppBoot
  } catch (error) {
    result.workspaceAppBootImport = {
      attempted: true,
      outcome: 'REJECTED',
      error: boundedError(error),
    }
    throw new BoundaryFailure('workspace_app_boot_import_failed')
  }
}

function identity3(left, right) {
  return {
    boot: left.boot === right.boot,
    mountRootInclude: left.mountRootInclude === right.mountRootInclude,
    reconcileProfilePatches: left.reconcileProfilePatches
      === right.reconcileProfilePatches,
  }
}

async function compareAppBootModules(
  internalLoader,
  effectiveRuntimeAppBoot,
  workspaceAppBoot,
  runtime,
  result,
) {
  let internalAppBoot
  try {
    internalAppBoot = await internalLoader.import(
      '@deepseek-ai/dsh-app-boot',
      runtime.effectiveModuleUrls.configEditor,
      {},
    )
  } catch (error) {
    result.importIdentity = {
      checked: true,
      outcome: 'REJECTED',
      base: 'actual_config_editor_file_url',
      error: boundedError(error),
    }
    throw new BoundaryFailure('launcher_import_failed')
  }
  result.importIdentity = {
    checked: true,
    outcome: 'CAPTURED',
    diagnosticOnly: true,
    hardAbortOnMismatch: false,
    base: 'owned_runtime_config_editor_file_url',
    regularWorkspaceIdentity3: identity3(workspaceAppBoot, internalAppBoot),
    effectiveRuntimeIdentity3: identity3(effectiveRuntimeAppBoot, internalAppBoot),
  }
  stage(result, 'app_boot_identities_captured')
  return internalAppBoot
}

function inspectPluginPackages(ctx, result, runtime) {
  const pluginPackages = ctx.get('pluginPackages')
  if (pluginPackages === undefined
    || typeof pluginPackages.packageOf !== 'function') {
    result.pluginPackagesResolution = {
      packageOfAvailable: false,
    }
    return
  }
  let appBootPackage
  let profileBootPackage
  try {
    appBootPackage = pluginPackages.packageOf(
      '@deepseek-ai/dsh-app-boot',
      runtime.effectiveModuleUrls.configEditor,
    )
    profileBootPackage = pluginPackages.packageOf(
      '@deepseek-ai/dsh/profile-boot',
      pathToFileURL(runtime.desktopHostEntry).href,
    )
  } catch {
    result.pluginPackagesResolution = {
      packageOfAvailable: true,
      queryOutcome: 'REJECTED',
    }
    return
  }
  const effectiveAppBootDir = dirname(dirname(
    runtime.effectiveModulePaths.appBoot,
  ))
  const effectiveDshDir = dirname(runtime.installAnchor)
  result.pluginPackagesResolution = {
    packageOfAvailable: true,
    queryOutcome: 'FULFILLED',
    appBootResolved: appBootPackage !== undefined,
    appBootDirectoryMatchesOwnedRuntime: appBootPackage?.dir !== undefined
      && normalizePathForCompare(appBootPackage.dir)
        === normalizePathForCompare(effectiveAppBootDir),
    appBootManifestMatchesOwnedRuntime: appBootPackage?.manifestPath !== undefined
      && normalizePathForCompare(appBootPackage.manifestPath)
        === normalizePathForCompare(join(effectiveAppBootDir, 'package.json')),
    profileBootPackageResolved: profileBootPackage !== undefined,
    profileBootPackageDirectoryMatchesOwnedRuntime:
      profileBootPackage?.dir !== undefined
      && normalizePathForCompare(profileBootPackage.dir)
        === normalizePathForCompare(effectiveDshDir),
  }
}

function inspectRootProvenance(ctx) {
  const rootIsSelf = ctx.root === ctx
  return {
    rootIsSelf,
    configEditorOwnedByRoot: ctx.configEditor.ownerContext.root === ctx.root,
    settingsOwnedByRoot: ctx.settings.ownerContext.root === ctx.root,
  }
}

function captureObserverFinal(root, result) {
  result.observerFinal = {
    captured: false,
    reason: 'NOT_AVAILABLE',
  }
  try {
    const path = ownedPath(root, OBSERVER_OUTPUT_NAME)
    const text = readFileSync(path, 'utf8')
    if (Buffer.byteLength(text, 'utf8') > MAX_OBSERVER_BYTES) {
      result.observerFinal.reason = 'SIZE_LIMIT'
      stage(result, 'observer_final_capture_skipped', { reason: 'SIZE_LIMIT' })
      return
    }
    const document = JSON.parse(text)
    if (document === null || typeof document !== 'object' || Array.isArray(document)) {
      result.observerFinal.reason = 'INVALID_DOCUMENT'
      stage(result, 'observer_final_capture_skipped', { reason: 'INVALID_DOCUMENT' })
      return
    }
    result.observerFinal = {
      captured: true,
      document,
    }
    stage(result, 'observer_final_captured')
  } catch {
    result.observerFinal.reason = 'READ_OR_PARSE_FAILED'
    stage(result, 'observer_final_capture_skipped', { reason: 'READ_OR_PARSE_FAILED' })
  }
}

function physicalMarkerCounts(profilePatchPath) {
  const text = readFileSync(profilePatchPath, 'utf8')
  const lawfirmModelCount = countLiteral(text, SYNTHETIC_LAWFIRM_MODEL)
  const externalModelCount = countLiteral(text, SYNTHETIC_EXTERNAL_MODEL)
  return {
    bytes: Buffer.byteLength(text),
    lawfirmModelMarkerCount: lawfirmModelCount,
    externalModelMarkerCount: externalModelCount,
    syntheticModelMarkerCount: lawfirmModelCount + externalModelCount,
    lawfirmLabelMarkerCount: countLiteral(text, 'compiled-boundary-lawfirm'),
    externalLabelMarkerCount: countLiteral(text, 'compiled-boundary-external'),
    literalBaseUrlCount: countLiteral(text, SYNTHETIC_BASE_URL),
    apiKeyReferenceMarkerCount: countLiteral(text, SYNTHETIC_KEY_REFERENCE),
  }
}

function inspectLiveNamespace(ctx) {
  const entries = [...ctx.loader.entries()].filter(entry => entry.options.id === NAMESPACE)
  const activeEntry = entries.length === 1
    && entries[0]?.fiber !== undefined
    && entries[0].fiber.state === CORDIS_FIBER_ACTIVE
  const descriptors = ctx.settings.describe().filter(row => row.ns === NAMESPACE)
  const providers = descriptors.length === 1
    && descriptors[0]?.value !== null
    && typeof descriptors[0]?.value === 'object'
    && descriptors[0].value.providers !== null
    && typeof descriptors[0].value.providers === 'object'
    ? descriptors[0].value.providers
    : undefined
  const hasLawfirm = providers !== undefined && Object.hasOwn(providers, 'lawfirm')
  const hasExternal = providers !== undefined && Object.hasOwn(providers, 'external')
  return {
    activeEntryCount: entries.length,
    activeEntry,
    liveDescriptorCount: descriptors.length,
    providersOwnLawfirm: hasLawfirm,
    providersOwnExternal: hasExternal,
    ready: activeEntry
      && descriptors.length === 1
      && hasLawfirm
      && hasExternal,
  }
}

function inspectPostMutation(ctx) {
  const descriptors = ctx.settings.describe().filter(row => row.ns === NAMESPACE)
  const providers = descriptors.length === 1
    && descriptors[0]?.value !== null
    && typeof descriptors[0]?.value === 'object'
    && descriptors[0].value.providers !== null
    && typeof descriptors[0].value.providers === 'object'
    ? descriptors[0].value.providers
    : undefined
  return {
    liveDescriptorCount: descriptors.length,
    providersOwnLawfirm: providers !== undefined && Object.hasOwn(providers, 'lawfirm'),
    providersOwnExternal: providers !== undefined && Object.hasOwn(providers, 'external'),
  }
}

async function disposeBootedContext(ctx, shutdown, result, root) {
  if (ctx === undefined || result.disposal.attempted) return
  result.disposal.attempted = true
  try {
    await shutdown.shutdown(0)
    result.disposal.outcome = 'FULFILLED'
    result.disposal.route = 'RUNPROFILE_SHUTDOWN'
    stage(result, 'disposed')
  } catch (error) {
    result.disposal.outcome = 'REJECTED'
    result.disposal.error = boundedError(error)
    stage(result, 'dispose_rejected')
  }
  result.finishedAtUtc = nowUtc()
  writeResult(root, result)
}

async function main(argv) {
  let root
  let result
  let bootedCtx
  let launcherShutdown
  try {
    root = parseRoot(argv)
    result = {
      schema: 'lawbench-t34-complete-launcher-v1',
      task: TASK,
      startedAtUtc: nowUtc(),
      authorRuntime: 'NOT_RUN',
      rootFreshAndExclusive: true,
      stages: [],
      source: { verified: 0, modules: [] },
      guards: { installed: false, held: false },
      completeRuntime: {
        target: COMPLETE_RUNTIME_NAME,
        fileCount: 0,
        byteCount: 0,
        allSourceHeld: false,
        allCopyEqual: false,
      },
      effectiveImports: { attempted: false, outcome: 'NOT_RUN' },
      profile: { synthetic: true, defaultBusinessProfileUsed: false },
      actualProfile: { loaded: false },
      runtimeResolution: { computed: false },
      profileBootImport: { attempted: false, outcome: 'NOT_RUN' },
      workspaceAppBootImport: { attempted: false, outcome: 'NOT_RUN' },
      prepare: { pluginPackages: 'RUNPROFILE_OWNED' },
      rootProvenance: { checked: false },
      importIdentity: { checked: false },
      pluginPackagesResolution: { packageOfAvailable: false },
      precondition: { checked: false, ready: false },
      mutation: { attempted: false, outcome: 'NOT_RUN' },
      physicalPrivatePatch: { checked: false },
      observerFinal: { captured: false, reason: 'NOT_AVAILABLE' },
      disposal: { attempted: false, outcome: 'NOT_RUN' },
      outcome: 'NOT_RUN',
    }
    writeResult(root, result)

    verifySourcePins(result)
    writeResult(root, result)

    result.guards = installNetworkAndProcessGuards()
    stage(result, 'guards_installed')
    writeResult(root, result)

    const runtime = createOwnedRuntime(root, result)
    writeResult(root, result)

    result.effectiveImports.attempted = true
    const appBoot = await import(runtime.effectiveModuleUrls.appBoot)
    const loaderModule = await import(runtime.effectiveModuleUrls.loader)
    const launchEnvironment = await import(
      pathToFileURL(LAUNCHER_MODULES.launchEnvironment.path).href
    )
    result.effectiveImports.outcome = 'FULFILLED'
    result.effectiveImports.moduleCount = Object.keys(
      runtime.effectiveModuleUrls,
    ).length
    stage(result, 'effective_runtime_imported', {
      moduleCount: result.effectiveImports.moduleCount,
    })
    writeResult(root, result)

    await loadActualRuntimeResolution(appBoot, result)
    writeResult(root, result)

    const launcher = await importLauncherProfileBoot(loaderModule, result, runtime)
    const workspaceAppBoot = await importWorkspaceAppBoot(result)
    writeResult(root, result)

    const synthetic = createSyntheticProfile(root, appBoot, runtime)
    result.profile.created = true
    stage(result, 'profile_created')
    writeResult(root, result)

    let loadedSynthetic
    try {
      loadedSynthetic = appBoot.loadProfileDirectory(
        BIN,
        synthetic.profileDir,
        runtime.installAnchor,
      )
    } catch (error) {
      result.profile.loaded = false
      result.error = boundedError(error)
      throw new BoundaryFailure('synthetic_profile_load_failed')
    }
    result.profile.loaded = true
    result.profile.loadedDirMatchesOwned = normalizePathForCompare(
      loadedSynthetic.dir,
    ) === normalizePathForCompare(synthetic.profileDir)
    stage(result, 'synthetic_profile_loaded')
    writeResult(root, result)

    const launchEnvironmentSnapshot =
      launchEnvironment.createLaunchEnvironmentSnapshot([])
    stage(result, 'launcher_boot_started')
    writeResult(root, result)

    let application
    try {
      application = await launcher.profileBoot.runProfile({
        environment: launchEnvironmentSnapshot,
        profile: 'compiled-boundary',
        resolvedProfile: {
          profile: loadedSynthetic,
          installAnchor: runtime.installAnchor,
        },
        patchFiles: [],
        args: [],
      })
      bootedCtx = application?.ctx
      launcherShutdown = application?.shutdown
      if (bootedCtx === undefined
        || launcherShutdown === undefined
        || typeof launcherShutdown.shutdown !== 'function') {
        throw new BoundaryFailure('launcher_shutdown_unavailable')
      }
    } catch (error) {
      result.mutation.outcome = 'NOT_STARTED_BOOT_REJECTED'
      result.error = boundedError(error)
      result.outcome = 'BOOT_REJECTED'
      result.disposal = {
        attempted: false,
        outcome: 'RUNPROFILE_INTERNAL_CLEANUP_ON_REJECTION',
        fullContextDisposedClaimed: false,
      }
      stage(result, 'launcher_boot_rejected', {
        boundedError: result.error,
      })
      writeResult(root, result)
      return 1
    }

    result.profile.booted = true
    stage(result, 'launcher_booted')
    result.rootProvenance = {
      checked: true,
      ...inspectRootProvenance(bootedCtx),
    }
    inspectPluginPackages(bootedCtx, result, runtime)
    writeResult(root, result)

    await compareAppBootModules(
      launcher.internalLoader,
      appBoot,
      workspaceAppBoot,
      runtime,
      result,
    )
    writeResult(root, result)

    result.precondition = {
      checked: true,
      ...inspectLiveNamespace(bootedCtx),
    }
    stage(result, 'namespace_ready', {
      ready: result.precondition.ready,
      activeEntryCount: result.precondition.activeEntryCount,
      liveDescriptorCount: result.precondition.liveDescriptorCount,
    })
    writeResult(root, result)

    if (!result.precondition.ready) {
      result.mutation.outcome = 'NOT_STARTED_PRECONDITION_FAILED'
      result.outcome = 'PRECONDITION_REJECTED'
    } else {
      result.mutation.attempted = true
      stage(result, 'mutation_started', {
        namespace: NAMESPACE,
        operationCount: 1,
      })
      writeResult(root, result)
      try {
        await bootedCtx.settings.mutate(NAMESPACE, [{
          op: 'unset',
          path: ['providers', 'external'],
        }])
        result.mutation.outcome = 'FULFILLED'
        result.outcome = 'MUTATION_FULFILLED_NOT_WHOLE_T34_PASS'
        stage(result, 'mutation_fulfilled_or_rejected', { outcome: 'FULFILLED' })
      } catch (error) {
        result.mutation.outcome = 'REJECTED'
        result.mutation.error = boundedError(error)
        result.outcome = 'MUTATION_REJECTED_CAUSE_UNKNOWN'
        stage(result, 'mutation_fulfilled_or_rejected', { outcome: 'REJECTED' })
      }
      result.mutation.post = inspectPostMutation(bootedCtx)
    }

    result.physicalPrivatePatch = {
      checked: true,
      ...physicalMarkerCounts(synthetic.profileContext.patchPath),
    }
    result.guards.blockedAttempts = { ...result.guards.attempts }
    writeResult(root, result)

    await disposeBootedContext(bootedCtx, launcherShutdown, result, root)
    captureObserverFinal(root, result)
    writeResult(root, result)

    if (result.disposal.outcome !== 'FULFILLED') return 4
    if (result.outcome === 'PRECONDITION_REJECTED') return 3
    if (result.mutation.outcome === 'REJECTED') return 2
    return 0
  } catch (error) {
    if (result !== undefined && root !== undefined) {
      if (bootedCtx !== undefined && !result.disposal.attempted) {
        try {
          await disposeBootedContext(
            bootedCtx,
            launcherShutdown,
            result,
            root,
          )
        } catch {
          if (result.disposal.outcome !== 'FULFILLED' && result.disposal.outcome !== 'REJECTED') {
            result.disposal.outcome = 'RESULT_WRITE_FAILED_AFTER_DISPOSE_ATTEMPT'
          }
        }
      }
      result.outcome = 'HARNESS_ERROR'
      result.error = boundedError(error)
      result.finishedAtUtc = nowUtc()
      try {
        writeResult(root, result)
      } catch {
        process.stderr.write('compiled-boundary: result write failed\n')
      }
    } else {
      process.stderr.write('compiled-boundary: boundary or internal error\n')
    }
    return 1
  }
}

process.exitCode = await main(process.argv.slice(2))
