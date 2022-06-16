const { parentPort, workerData } = require("worker_threads");



var files = workerData.files;
var filePath = workerData.filePath;
var outputPath = workerData.outputPath;
var attempt_rename_copy_on_error = workerData.attempt_rename_copy_on_error




const { promisify } = require('util');
const fs = require('fs');
const convert = require('heic-convert');


(async () => {
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let path = filePath + "/" + file;

        try {
            const inputBuffer = fs.readFileSync(path)
            const outputBuffer = await convert({
                buffer: inputBuffer,
                format: 'JPEG'
            });

            await promisify(fs.writeFile)(`${outputPath}/${file.slice(0, -4)}jpg`, outputBuffer);
            parentPort.postMessage({
                filename: file,
                progress: i
            });
        } catch (err) {
            if (err.toString().includes("input buffer is not a HEIC") && attempt_rename_copy_on_error) {
                fs.copyFileSync(path, `${outputPath}/${file.slice(0, -4)}jpg`)
            } else {
                console.log("\nEncountered an error: ", err.toString() + " on file: " + file)
                console.log("Will continue with next file.")
            }
            parentPort.postMessage({
                filename: files[i],
                progress: i
            });
        }
    }
})();