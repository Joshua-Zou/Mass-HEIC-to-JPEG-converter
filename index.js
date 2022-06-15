const fs = require("fs")
const { Worker } = require('worker_threads')
const config = require("./config.json")
const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);


const file_path = config.file_path
const output_path = config.output_path
var threads = config.threads


if (!fs.existsSync(file_path)) throw new Error("File path does not exist!")
if (!fs.existsSync(output_path)) throw new Error("Output path does not exist!")

console.log("Locating and finding HEIC files...")
const all_files = fs.readdirSync(file_path)
var heicFiles = all_files.filter(file => file.endsWith(".heic"))
console.log("Found " + heicFiles.length + " HEIC files. Starting conversion...")
var done = 0;

if (heicFiles.length < threads) threads = heicFiles.length

let chunkSize = Math.floor(heicFiles.length / threads);
for (let i = 0; i < threads; i++) {
    var files;
    if (i+1 === threads) {
        files = heicFiles.slice(i * chunkSize)
    } else {
        files = heicFiles.slice(i * chunkSize, (i + 1) * chunkSize)
    }
    console.log(`Starting thread ${i+1}/${threads} that handles ` + files.length + ` files.`)
    startThread(files, file_path, output_path)
}
showProgress()


function startThread(files, filePath, outputPath) {
    const worker = new Worker('./convert-thread.js', {
        workerData: {
            files: files,
            filePath: filePath,
            outputPath: outputPath
        }
    });


    worker.on('message', function (message) {
        done++;
    });
    worker.on('error', function (err) {
        throw err
    });
    worker.on('exit', (code) => {
        if (code !== 0)
            throw (new Error(`Worker stopped with exit code ${code}`));
    })
}
async function showProgress(){
    bar1.start(heicFiles.length, 0);

    while(done < heicFiles.length){
        bar1.update(done);
        await sleep(250)
    }
    bar1.update(done);
    bar1.stop();
    console.log("All files converted.")
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}