import os
from app import create_app

os.environ['FLASK_DEBUG_EXCLUDE_PATTERNS'] = 'temp/*;*/temp/*;'

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)