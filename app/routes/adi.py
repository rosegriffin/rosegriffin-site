import io
import librosa
from pathlib import Path
from flask import Blueprint, render_template, request, current_app
from werkzeug.utils import secure_filename

from amer_dialect_id.features.wav2vec_features import Wav2VecFeatureExtractor
from amer_dialect_id.utils.predict import predict_batch, label_to_name, format_class_probs
from amer_dialect_id.utils.persistence import load_object

UPLOAD_FOLDER = Path("tmp")
UPLOAD_FOLDER.mkdir(exist_ok=True)

adi_bp = Blueprint("adi", __name__)

ALLOWED_EXTENSIONS = {"mp3", "wav"}
MODEL_COMPONENTS = {"wav2vec_lr": {"model": "lr.pkl",
                                   "scaler": "wav2vec_scaler.pkl",
                                   "extractor": Wav2VecFeatureExtractor()}
                   }

def extension_allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# TODO: move this to predict.py
def get_conf_str(confs):
    return '\n'.join(f'{conf[0]}: {conf[1]:.2f}' for conf in format_class_probs(confs))

def is_audio(file):
    try:
        y, sr = librosa.load(io.BytesIO(file.read()), sr=None)
        file.seek(0)
        return True
    except:
        file.seek(0)
        return False

@adi_bp.route("/american-dialect-identification", methods=["GET", "POST"])
def adi():

    result = None
    extractor = None
    model_dir = Path(current_app.instance_path) / "models"

    if request.method == "POST":
        files = request.files.getlist("audio")
        sample_paths = []

        # Verify and process samples
        for file in files:
            if extension_allowed(file.filename) and is_audio(file):
                # save to temp folder
                filename = secure_filename(file.filename)
                filepath = UPLOAD_FOLDER / filename
                file.save(filepath)

                sample_paths.append(filepath)
            else:
                result = ("Invalid file", file.filename)

        # Handle model selection
        selected_model = request.form.get("model_selection")

        if selected_model not in MODEL_COMPONENTS:
            result = ("Invalid model selection", selected_model)
        else:
            model_path = model_dir / MODEL_COMPONENTS[selected_model]["model"]
            scaler_path = model_dir / MODEL_COMPONENTS[selected_model]["scaler"]

            model = load_object(model_path)
            scaler = load_object(scaler_path)
            extractor = MODEL_COMPONENTS[selected_model]["extractor"]

        # Get prediction, will ignore invalid files
        if sample_paths and extractor:
            dialect, confs = predict_batch(sample_paths, extractor, model, scaler)
            result = ("Dialect: " + label_to_name(dialect),
                      "Model confidence by Region: " + get_conf_str(confs))

        # clean up
        for path in sample_paths:
            path.unlink(missing_ok=True)

    return render_template("adi.html", result=result)
