from flask import Blueprint, render_template, redirect, url_for

home_bp = Blueprint("home", __name__)

@home_bp.route("/")
def index():
    #return render_template("index.html")
    return redirect(url_for("adi.adi")) # redirect to first proj in the meantime
