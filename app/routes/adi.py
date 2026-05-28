import io
import librosa
import numpy as np
from pathlib import Path
from flask import Blueprint, render_template, request, current_app, flash
from werkzeug.utils import secure_filename
import plotly.graph_objects as go

from amer_dialect_id.features.wav2vec_features import Wav2VecFeatureExtractor
from amer_dialect_id.utils.predict import predict_batch, format_class_probs
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

# TODO: do not decode entire file. Perhaps enforce a limit on size.
def is_audio(file):
    try:
        y, sr = librosa.load(io.BytesIO(file.read()), sr=None)
        file.seek(0)
        return True
    except:
        file.seek(0)
        return False

def label_to_name(label):
    mapping = {
        0 : "New England",
        1 : "Northern",
        2 : "North Midland",
        3 : "South Midland",
        4 : "Southern",
        5 : "New York City",
        6 : "Western"
    }

    return mapping[label]

def format_results(probs):

    pairs = sorted(
        ((label_to_name(i) + "  ", prob) for i, prob in enumerate(probs)),
        key=lambda x: x[1],
        reverse=True
    )

    labels, probs = zip(*pairs)

    return labels, probs

def create_chart(labels, probs):

    fig = go.Figure(go.Bar(
        x=probs,
        y=labels,
        orientation="h",
        marker=dict(color="#8A1FA0"), # bar color
        hoverinfo="x"
    ))

    fig.update_yaxes(autorange="reversed")

    fig.update_layout(
        autosize=True,
        # title="Model Predictions by Region",
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="black",
        margin=dict(t=0),
        showlegend=False,
        bargap=0.15,
    )

    fig.update_xaxes(
        title="Estimated Probability",
        showgrid=True,
        gridcolor="rgba(0,0,0,0.05)"
    )

    return fig.to_html(full_html=False, config={"responsive": True})

@adi_bp.route("/american-dialect-identification", methods=["GET", "POST"])
def adi():

    result = None # overall dialect
    chart = create_chart(*format_results([0, 0, 0, 0, 0, 0, 0]))
    probs = None
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
                flash(f'{file.filename} is not a valid WAV file.', "error")

        # Handle model selection
        selected_model = request.form.get("model_selection")

        if selected_model not in MODEL_COMPONENTS:
            flash(f'{selected_model} is an invalid model.', "error")
        else:
            model_path = model_dir / MODEL_COMPONENTS[selected_model]["model"]
            scaler_path = model_dir / MODEL_COMPONENTS[selected_model]["scaler"]

            model = load_object(model_path)
            scaler = load_object(scaler_path)
            extractor = MODEL_COMPONENTS[selected_model]["extractor"]

        # Get prediction, will ignore invalid files
        if sample_paths and extractor:
            dialect, probs = predict_batch(sample_paths, extractor, model, scaler)
            chart = create_chart(*format_results(probs))
            probs = dict(zip(*format_results(probs)))

            result = label_to_name(dialect)

        # clean up
        for path in sample_paths:
            path.unlink(missing_ok=True)

    return render_template("adi.html", result=result, chart=chart, probabilities=probs)
