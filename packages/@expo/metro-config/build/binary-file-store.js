"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const FileStore_1 = __importDefault(require("@expo/metro/metro-cache/stores/FileStore"));
const msgpackr_1 = require("msgpackr");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const file_store_1 = require("./file-store");
const debug = require('debug')('expo:metro:cache');
class BinaryFileStore extends FileStore_1.default {
    #root;
    #packr = new msgpackr_1.Packr({
        useRecords: true,
        moreTypes: true,
    });
    constructor(options) {
        super(options);
        this.#root = options.root;
    }
    async get(key) {
        let data;
        try {
            data = await node_fs_1.default.promises.readFile(this.#getFilePath(key));
        }
        catch (err) {
            if (err.code === 'ENOENT' || err instanceof SyntaxError) {
                return null;
            }
            throw err;
        }
        return this.#packr.decode(data);
    }
    async set(key, value) {
        // Prevent caching of CSS files that have the skipCache flag set.
        if (value?.output?.[0]?.data?.css?.skipCache) {
            debug('Skipping caching for CSS file:', value.path);
            return;
        }
        const filePath = this.#getFilePath(key);
        const buffer = this.#packr.encode(value);
        try {
            await node_fs_1.default.promises.writeFile(filePath, buffer);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                node_fs_1.default.mkdirSync(node_path_1.default.dirname(filePath), { recursive: true });
                await node_fs_1.default.promises.writeFile(filePath, buffer);
            }
            else {
                throw err;
            }
        }
    }
    clear() {
        if (!(0, file_store_1.tryRenameAndDeleteAsync)(this.#root)) {
            super.clear();
        }
    }
    #getFilePath(key) {
        return node_path_1.default.join(this.#root, key.subarray(0, 1).toString('hex'), key.subarray(1).toString('hex') + '.mp');
    }
}
exports.FileStore = BinaryFileStore;
//# sourceMappingURL=binary-file-store.js.map