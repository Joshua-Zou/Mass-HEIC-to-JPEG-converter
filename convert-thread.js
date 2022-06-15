const { parentPort, workerData } = require("worker_threads");



var files = workerData.files;
var filePath = workerData.filePath;
var outputPath = workerData.outputPath;





const { promisify } = require('util');
const fs = require('fs');
const convert = require('heic-convert');


(async () => {
    for (let i = 0; i < files.length; i++) {
        try {
            let file = files[i];
            let path = filePath + "/" + file;

            const inputBuffer = await promisify(fs.readFile)(path);
            const outputBuffer = await convert({
                buffer: inputBuffer,
                format: 'JPEG'
            });

            await promisify(fs.writeFile)(`${outputPath}/${file.slice(0, -4)}jpg`, outputBuffer);
            parentPort.postMessage({
                filename: file,
                progress: i
            });
        }catch(err) {
            console.log("\nEncountered an error: ", err)
            console.log("Will continue with next file.")
            parentPort.postMessage({
                filename: file,
                progress: i
            });
        }
    }
})();