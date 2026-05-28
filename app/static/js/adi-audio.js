const fileInput = document.getElementById("audio-input");
const fileList = document.getElementById("file-list");
const resetBtn = document.getElementById("btn-cancel");
const uploadBtn = document.getElementById("btn-upload");
const uploadBox = document.getElementById("upload-box");

const INVALID_FILE_ALERT = "Only .wav files are allowed.";
const MAX_FILES_ALERT = "You can upload a maximum of 2 .wav files.";
const NO_FILES_ALERT = "Please select at least one valid .wav file.";

function syncInputFiles() {
    const dataTransfer = new DataTransfer();

    selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
    });

    fileInput.files = dataTransfer.files;
}

function displayFiles(files) {
    fileList.innerHTML = "";

    files.forEach((file, index) => {
        const url = URL.createObjectURL(file);

        const div = document.createElement("div");
        div.className = "file-card";

        const icon = document.createElement("img");
        icon.src = "/static/icons/audio_file.svg";
        icon.className = "icon"

        const name = document.createElement("div");
        name.textContent = file.name;

        const audio = document.createElement("audio");
        audio.controls = true;

        const source = document.createElement("source");
        source.src = url;
        source.type = "audio/wav";
        audio.appendChild(source);

        const cancel = document.createElement("img");
        cancel.src = "static/icons/cancel.svg";
        cancel.className = "cancel-icon icon";
        cancel.style.cursor = "pointer";

        cancel.addEventListener("click", () => {
            URL.revokeObjectURL(url);

            selectedFiles.splice(index, 1);
            syncInputFiles();
            displayFiles(selectedFiles);
        });

        div.append(icon, name, audio, cancel);
        fileList.appendChild(div);
    });
}

function isValidWav(file) {
    return file.name.toLowerCase().endsWith(".wav")
}

fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);
    const validFiles = files.filter(isValidWav);

    if (validFiles.length === 0) {
        alert(NO_FILES_ALERT);
        fileInput.value = "";
        return;
    }

    if (validFiles.length > 2) {
        alert(MAX_FILES_ALERT);
        fileInput.value = "";
        return;
    }

    selectedFiles = validFiles;
    syncInputFiles();
    displayFiles(selectedFiles);
});

uploadBox.addEventListener("click", () => {
    fileInput.click();
});

uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
});

uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(isValidWav);

    if (validFiles.length === 0) {
        alert(NO_FILES_ALERT);
        return;
    }

    if (validFiles.length > 2) {
        alert(MAX_FILES_ALERT);
        return;
    }

    selectedFiles = validFiles;
    syncInputFiles();
    displayFiles(selectedFiles);
});

resetBtn.addEventListener("click", () => {
    selectedFiles = [];
    fileInput.value = "";
    fileList.innerHTML = "";
});

uploadBtn.addEventListener("click", (e) => {
    const files = Array.from(fileInput.files)
    const validFiles = files.filter(isValidWav);

    if (validFiles.length === 0) {
        e.preventDefault();
        alert(NO_FILES_ALERT);
        fileInput.value = "";
        return;
    }

    if (validFiles.length > 2) {
        e.preventDefault();
        alert(MAX_FILES_ALERT);
        fileInput.value = "";
        return;
    }
});
