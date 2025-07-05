#!/bin/bash
export PYTHONPATH="$(pwd)"
export FLASK_APP=api.index
flask run --host=0.0.0.0 --port=5000


