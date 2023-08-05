const details = () => ({
    id: 'Martin_Plugin_003_add_cover',
    Stage: 'Pre-processing',
    Name: 'Add cover image if available',
    Type: 'Video',
    Operation: 'Extraction',
    Description: 'If an image exist with the same as the video, it will be added to the video file. The image file is untouched.',
    Version: '1.0',
    Tags: 'pre-processing,configurable',
    Inputs: [
        {
            name: 'storage_path',
            type: 'string',
            inputUI: {
                type: 'text',
            },
            tooltip: 'The path to the storage folder',
        },
    ],
});


const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    inputs = lib.loadDefaultValues(inputs, details);

    const response = {
        file,
        removeFromDB: false,
        updateDB: false,
        processFile: false,
        infoLog: '',
    };

    const fs = require('fs');
    const path = require('path');
    const coverImagePath = path.join(inputs.storage_path, otherArguments.originalLibraryFile.meta.FileName + '.jpg');
    if (!fs.existsSync(coverImagePath)) {
        response.infoLog += 'Cover image not found. Skipping.\n';
        return response;
    }

    // Use execSync to run the ffmpeg command
    const execSync = require('child_process').execSync;
    const ffmpegPath = otherArguments.ffmpegPath;

    // Check if the video file already has a cover image
    for (const stream of file.ffProbeData.streams) {
        if (stream.disposition.attached_pic == 1) {
            response.infoLog += 'Video file already has a cover image. Skipping.\n';
            return response;
        }
    }

    // Add the cover image to the video file
    let command = `"${ffmpegPath}" -i "${file.file}" -i "${coverImagePath}" -map 1 -map 0 -c copy -disposition:0 attached_pic "${file.file}_temp.${file.container}"`;
    execSync(command);

    // Delete the original video file
    fs.unlinkSync(file.file);

    // Rename the new video file to the original name
    fs.renameSync(`${file.file}_temp.${file.container}`, file.file);

    return response;
};


module.exports.details = details;
module.exports.plugin = plugin;