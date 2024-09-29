declare global {
    interface String {
        getFilename(): string;
        getFileExtension(): string;
        getDirectoryPath(): string;
    }
}

/**
 * Extracts the filename from a given file path string.
 *
 * @returns {string} The filename extracted from the file path. If no filename is found (i.e., the string does not contain a valid path), an empty string is returned.
 */
String.prototype.getFilename = function (): string {
    const regex = /([^\/\\]+)$/; // Match everything after the last '/' or '\'
    const matches = this.match(regex);
    return matches ? matches[0] : ''; // Return the filename or empty string if no match
};

/**
 * Extracts the file extension from a given file path or filename string.
 *
 * @returns {string} The file extension extracted from the filename or file path. If no valid extension is found, an empty string is returned.
 */
String.prototype.getFileExtension = function (): string {
    const regex = /\.([a-zA-Z0-9]+)$/; // Match the last dot followed by characters
    const matches = this.match(regex);
    return matches ? matches[1] : ''; // Return the extension or empty string if no match
};

/**
 * Returns the directory path from a file path string.
 *
 * @returns {string} The directory path extracted from the file path including the last directory separator. If the input does not contain a valid directory path, an empty string is returned.
 */
String.prototype.getDirectoryPath = function (): string {
    // Use regex to match everything up to and including the last folder
    const regex = /^(.*[\/\\])[^\/\\]*$/; // Match everything up to the last '/' or '\'
    const matches = this.match(regex);
    return matches ? matches[1] : ''; // Return the path without the filename or empty string if no match
};

export {};