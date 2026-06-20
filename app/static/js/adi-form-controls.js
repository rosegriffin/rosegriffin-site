const fileInput = document.getElementById("audio-input");
const fileList = document.getElementById("file-list");
const resetBtn = document.getElementById("btn-cancel");
const uploadBtn = document.getElementById("btn-upload");
const uploadBox = document.getElementById("upload-box");
const recordBox = document.getElementById("record-box");

const recordTab = document.getElementById("record-tab");
const uploadTab = document.getElementById("upload-tab");

const formHeader = document.getElementById("form-header");
const collapseBtn = document.getElementById("collapse-btn");
const cardBody = document.getElementById("card-body");
const rightIcon = document.getElementById("right-icon");
const downIcon = document.getElementById("down-icon");

const resultsContainer = document.getElementById("results-container");
const toggleButton = document.getElementById("toggle-form");

const INVALID_FILE_ALERT = "Only .wav files are allowed.";
const MAX_FILES_ALERT = "You can only have a maximum of 2 audio files.";
const NO_FILES_ALERT = "Please select at least one valid .wav file.";
const RECORDING_ALERT = "Please stop your recording before submitting.";
const BROWSER_ALERT = "Audio recording is not supported in this browser.";

let selectedFiles = [];

/* Tab functionality */

recordTab.addEventListener("click", () => {
    recordTab.classList.add("active");
    uploadTab.classList.remove("active");
    uploadBox.classList.add("hidden");
    recordBox.classList.remove("hidden");

});

uploadTab.addEventListener("click", () => {
    uploadTab.classList.add("active");
    recordTab.classList.remove("active");
    recordBox.classList.add("hidden");
    uploadBox.classList.remove("hidden");
});

/* Collapse functionality */

if (collapseBtn) {
    collapseBtn.addEventListener("click", () => {
        cardBody.classList.toggle("mobile-hidden");
        rightIcon.classList.toggle("hidden");
        downIcon.classList.toggle("hidden");
    });
}

/* Audio validation and display */

function isValidWav(file) {
    return file.name.toLowerCase().endsWith(".wav")
}

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

function addFiles(files) {
    const validFiles = files.filter(isValidWav);

    if (validFiles.length === 0) {
        alert(NO_FILES_ALERT);
        return;
    }

    if (selectedFiles.length + validFiles.length > 2) {
        alert(MAX_FILES_ALERT);
        return;
    }

    selectedFiles = [...selectedFiles, ...validFiles];

    syncInputFiles();
    displayFiles(selectedFiles);
}

fileInput.addEventListener("change", () => {
    addFiles(Array.from(fileInput.files));
});

uploadBox.addEventListener("click", () => {
    fileInput.click();
});

uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
});

uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();

    addFiles(Array.from(fileInput.files));
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

    if (recorder?.state === "recording") {
        e.preventDefault();
        alert(RECORDING_ALERT);
        return;
    }
});
