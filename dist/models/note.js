"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteModel = void 0;
const mongoose_1 = require("mongoose");
const noteSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now },
    text: { type: String, required: true },
    user: { ref: 'User', type: mongoose_1.Schema.Types.ObjectId },
});
exports.NoteModel = (0, mongoose_1.model)('Note', noteSchema);
//# sourceMappingURL=note.js.map