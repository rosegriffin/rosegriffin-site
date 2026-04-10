import requests
from pathlib import Path
from flask import Flask, render_template

from app.config import MODEL_CONFIG
from app.routes.home import home_bp
from app.routes.adi import adi_bp

def download_file(url, dest):
    response = requests.get(url, stream=True)
    response.raise_for_status()

    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=32768):
            f.write(chunk)

def create_app():
    app = Flask(__name__, instance_relative_config=True)

    model_dir = Path(app.instance_path) / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    # Download files listed in MODEL_CONFIG to model_dir
    for proj_name, files in MODEL_CONFIG.items():
        for filename, url in files.items():
            filepath = model_dir / filename

            # Download if missing
            if not filepath.exists():
                download_file(url, filepath)

    # Blueprints
    app.register_blueprint(home_bp)
    app.register_blueprint(adi_bp)

    return app
